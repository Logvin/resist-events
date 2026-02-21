// GET  /api/admin/backups — list backups (admin only)
// POST /api/admin/backups — create encrypted backup (admin only)

import { bytesToHex } from '../../../lib/crypto.js';

export async function onRequestGet(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;

  try {
    const { results } = await db.prepare(
      'SELECT id, filename, label, type, size_bytes, created_at, expires_at FROM backups ORDER BY created_at DESC'
    ).all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const bucket = context.env.FLYER_BUCKET;

  try {
    const body = await context.request.json();
    const { items = ['events', 'organizations', 'users', 'messages'], label, type = 'full' } = body;

    // Collect data from selected tables
    const backupData = {
      timestamp: new Date().toISOString(),
      type,
      tables: {},
    };

    if (items.includes('events')) {
      const { results } = await db.prepare('SELECT * FROM events').all();
      backupData.tables.events = results;
    }
    if (items.includes('organizations')) {
      const { results } = await db.prepare('SELECT * FROM organizations').all();
      backupData.tables.organizations = results;
    }
    if (items.includes('users')) {
      const { results } = await db.prepare('SELECT * FROM users').all();
      backupData.tables.users = results;
    }
    if (items.includes('messages')) {
      const { results } = await db.prepare('SELECT * FROM messages').all();
      backupData.tables.messages = results;
      const { results: replies } = await db.prepare('SELECT * FROM message_replies').all();
      backupData.tables.message_replies = replies;
    }

    // Generate encryption key and IV
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(backupData));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

    // Export key to hex (returned to caller, never stored)
    const keyBytes = await crypto.subtle.exportKey('raw', key);
    const keyHex = bytesToHex(keyBytes);
    const ivHex = bytesToHex(iv);

    // Prepend IV (12 bytes) to ciphertext so the file is self-contained.
    // Users only need the encryption key to restore — IV is embedded in the file.
    const combined = new Uint8Array(12 + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), 12);

    // Upload to R2
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uuid = crypto.randomUUID();
    const filename = `backups/${timestamp}-${uuid}.enc`;
    const sizeBytes = combined.byteLength;

    if (bucket) {
      await bucket.put(filename, combined.buffer, {
        httpMetadata: { contentType: 'application/octet-stream' },
      });
    }

    // Save metadata to DB (IV also stored for server-side restores; key is NOT stored)
    const userId = context.data.demoUserId;
    const result = await db.prepare(
      'INSERT INTO backups (filename, label, type, size_bytes, iv, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(filename, label || null, type, sizeBytes, ivHex, userId || null).run();

    return Response.json({
      ok: true,
      id: result.meta.last_row_id,
      filename,
      encryption_key: keyHex,
      size_bytes: sizeBytes,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
