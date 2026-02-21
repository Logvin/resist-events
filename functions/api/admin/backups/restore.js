// POST /api/admin/backups/restore — decrypt and preview/execute a restore
//
// Accepts either:
//   - backup_id (server-side backup in R2, IV retrieved from DB)
//   - file      (uploaded .enc file, IV embedded as first 12 bytes)
// Only the encryption key (hex) is needed from the user in both cases.

import { hexToBytes } from '../../../lib/crypto.js';

export async function onRequestPost(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const bucket = context.env.FLYER_BUCKET;

  try {
    const formData = await context.request.formData();
    const backupId = formData.get('backup_id');
    const file = formData.get('file');
    const keyHex = formData.get('key');
    const mode = formData.get('mode') || 'overwrite';
    const confirmed = formData.get('confirmed') === 'true';
    const items = formData.getAll('items');

    if (!keyHex) {
      return Response.json({ error: 'Missing required field: key' }, { status: 400 });
    }
    if (!backupId && !file) {
      return Response.json({ error: 'Provide either backup_id or a file upload' }, { status: 400 });
    }

    // Get raw bytes — IV is always the first 12 bytes, ciphertext follows
    let combinedBytes;
    if (backupId) {
      const backup = await db.prepare('SELECT * FROM backups WHERE id = ?').bind(backupId).first();
      if (!backup) return Response.json({ error: 'Backup not found' }, { status: 404 });
      if (!bucket) return Response.json({ error: 'Storage not configured' }, { status: 503 });
      const obj = await bucket.get(backup.filename);
      if (!obj) return Response.json({ error: 'Backup file not found in storage' }, { status: 404 });
      combinedBytes = new Uint8Array(await obj.arrayBuffer());
    } else {
      combinedBytes = new Uint8Array(await file.arrayBuffer());
    }

    if (combinedBytes.length < 13) {
      return Response.json({ error: 'Invalid backup file' }, { status: 400 });
    }

    const iv = combinedBytes.slice(0, 12);
    const ciphertext = combinedBytes.slice(12);
    const keyBytes = hexToBytes(keyHex);

    let backupData;
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
      const decoder = new TextDecoder();
      backupData = JSON.parse(decoder.decode(plaintext));
    } catch (e) {
      return Response.json({ error: 'Decryption failed — check that the encryption key is correct' }, { status: 400 });
    }

    const tables = backupData.tables || {};

    // Preview mode — return counts without modifying data
    if (!confirmed) {
      const preview = {};
      const tableNames = ['events', 'organizations', 'users', 'messages'];
      for (const table of tableNames) {
        if (!items.length || items.includes(table)) {
          const backupCount = (tables[table] || []).length;
          let currentCount = 0;
          try {
            const row = await db.prepare(`SELECT COUNT(*) as c FROM ${table}`).first();
            currentCount = row ? row.c : 0;
          } catch (e) { /* ignore */ }
          preview[table] = { backup: backupCount, current: currentCount };
        }
      }
      return Response.json({ preview, timestamp: backupData.timestamp, type: backupData.type });
    }

    // Execute restore
    const selectedItems = items.length > 0 ? items : ['events', 'organizations', 'users', 'messages'];

    if (mode === 'overwrite') {
      // Delete in FK-safe order
      if (selectedItems.includes('messages')) {
        await db.prepare('DELETE FROM message_reads').run();
        await db.prepare('DELETE FROM message_replies').run();
        await db.prepare('DELETE FROM messages').run();
      }
      if (selectedItems.includes('events')) {
        await db.prepare('DELETE FROM event_flyers').run();
        await db.prepare('DELETE FROM review_seen').run();
        await db.prepare('DELETE FROM event_published_seen').run();
        await db.prepare('DELETE FROM events').run();
      }
      if (selectedItems.includes('users')) {
        // backups.created_by references users — null it before deleting users
        await db.prepare('UPDATE backups SET created_by = NULL').run();
        await db.prepare('DELETE FROM user_orgs').run();
        await db.prepare('DELETE FROM users').run();
      }
      if (selectedItems.includes('organizations')) {
        await db.prepare('DELETE FROM organizations').run();
      }
    }

    // Insert rows from backup
    for (const table of selectedItems) {
      const rows = tables[table] || [];
      for (const row of rows) {
        if (table === 'events') {
          await db.prepare(`
            INSERT OR IGNORE INTO events
              (id, title, org_id, created_by, date, start_time, end_time, address, description,
               parking, flyer_url, website_url, reg_link, reg_required, hide_address, event_type,
               status, bring_items, no_bring_items, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            row.id, row.title, row.org_id, row.created_by, row.date, row.start_time, row.end_time,
            row.address, row.description, row.parking, row.flyer_url, row.website_url, row.reg_link,
            row.reg_required, row.hide_address, row.event_type, row.status, row.bring_items,
            row.no_bring_items, row.notes, row.created_at, row.updated_at
          ).run();
        } else if (table === 'organizations') {
          await db.prepare(`
            INSERT OR IGNORE INTO organizations
              (id, name, abbreviation, website, socials, logo_url, qr_url, city, mission_statement,
               can_self_publish, can_cross_publish, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            row.id, row.name, row.abbreviation, row.website, row.socials, row.logo_url, row.qr_url,
            row.city, row.mission_statement, row.can_self_publish, row.can_cross_publish, row.created_at
          ).run();
        } else if (table === 'users') {
          await db.prepare(`
            INSERT OR IGNORE INTO users (id, email, display_name, role, org_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(row.id, row.email, row.display_name, row.role, row.org_id, row.created_at).run();
        } else if (table === 'messages') {
          await db.prepare(`
            INSERT OR IGNORE INTO messages
              (id, topic, org_id, event_id, message_type, user_id, archived, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            row.id, row.topic, row.org_id, row.event_id, row.message_type,
            row.user_id, row.archived, row.created_at
          ).run();
        }
      }
    }

    // Restore message_replies if messages were included
    if (selectedItems.includes('messages') && tables.message_replies) {
      for (const row of tables.message_replies) {
        await db.prepare(`
          INSERT OR IGNORE INTO message_replies (id, message_id, from_type, text, user_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(row.id, row.message_id, row.from_type, row.text, row.user_id, row.created_at).run();
      }
    }

    return Response.json({ ok: true, restored: selectedItems });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
