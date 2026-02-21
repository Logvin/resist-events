// GET  /api/admin/cleanup — get counts of data eligible for cleanup
// POST /api/admin/cleanup — archive or delete data

export async function onRequestGet(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;

  try {
    const eventsTotal = await db.prepare('SELECT COUNT(*) as c FROM events').first();
    const eventsArchived = await db.prepare("SELECT COUNT(*) as c FROM events WHERE status = 'archived'").first();

    const usersTotal = await db.prepare('SELECT COUNT(*) as c FROM users').first();

    const orgsTotal = await db.prepare('SELECT COUNT(*) as c FROM organizations').first();

    const msgsArchived = await db.prepare('SELECT COUNT(*) as c FROM messages WHERE archived = 1').first();

    const archivedItems = await db.prepare('SELECT COUNT(*) as c FROM archived_items').first();

    return Response.json({
      events: { total: eventsTotal.c, eligible: eventsArchived.c },
      users: { total: usersTotal.c, eligible: usersTotal.c },
      organizations: { total: orgsTotal.c, eligible: orgsTotal.c },
      messages: { total: msgsArchived.c, eligible: msgsArchived.c },
      archived_items: { total: archivedItems.c, eligible: archivedItems.c },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;

  try {
    const body = await context.request.json();
    const { action, items = {}, archive_days } = body;
    const results = {};

    const deleteAfter = archive_days
      ? new Date(Date.now() + archive_days * 86400000).toISOString()
      : null;

    if (action === 'archive') {
      if (items.events) {
        const { results: archived } = await db.prepare(
          "SELECT id FROM events WHERE status = 'archived'"
        ).all();
        for (const ev of archived) {
          await db.prepare(
            'INSERT OR IGNORE INTO archived_items (item_type, item_id, delete_after) VALUES (?, ?, ?)'
          ).bind('event', ev.id, deleteAfter).run();
        }
        results.events = archived.length;
      }

      if (items.messages) {
        const { results: msgs } = await db.prepare(
          'SELECT id FROM messages WHERE archived = 1'
        ).all();
        for (const msg of msgs) {
          await db.prepare(
            'INSERT OR IGNORE INTO archived_items (item_type, item_id, delete_after) VALUES (?, ?, ?)'
          ).bind('message', msg.id, deleteAfter).run();
        }
        results.messages = msgs.length;
      }
    } else if (action === 'delete') {
      if (items.events) {
        await db.prepare("DELETE FROM event_flyers WHERE event_id IN (SELECT id FROM events WHERE status = 'archived')").run();
        await db.prepare("DELETE FROM review_seen WHERE event_id IN (SELECT id FROM events WHERE status = 'archived')").run();
        await db.prepare("DELETE FROM event_published_seen WHERE event_id IN (SELECT id FROM events WHERE status = 'archived')").run();
        const del = await db.prepare("DELETE FROM events WHERE status = 'archived'").run();
        results.events = del.meta.changes;
      }

      if (items.messages) {
        const { results: archivedMsgs } = await db.prepare(
          'SELECT id FROM messages WHERE archived = 1'
        ).all();
        for (const msg of archivedMsgs) {
          await db.prepare('DELETE FROM message_replies WHERE message_id = ?').bind(msg.id).run();
        }
        const del = await db.prepare('DELETE FROM messages WHERE archived = 1').run();
        results.messages = del.meta.changes;
      }

      if (items.archived_items) {
        const del = await db.prepare(
          "DELETE FROM archived_items WHERE delete_after IS NOT NULL AND delete_after < datetime('now')"
        ).run();
        results.archived_items = del.meta.changes;
      }
    } else {
      return Response.json({ error: 'Invalid action. Use "archive" or "delete".' }, { status: 400 });
    }

    return Response.json({ ok: true, results });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
