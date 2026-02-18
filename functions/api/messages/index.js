// GET  /api/messages — list message topics (with unread info)
// POST /api/messages — create new topic with first message

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;
  const url = new URL(context.request.url);
  const view = url.searchParams.get('view');
  const eventIdFilter = url.searchParams.get('event_id');

  try {
    let results;

    // Event-scoped message filter
    if (eventIdFilter) {
      const eid = parseInt(eventIdFilter);

      // Check visibility: if event creator is NOT a member of the event's org,
      // only show messages to the creator and admins
      const event = await db.prepare('SELECT created_by, org_id FROM events WHERE id = ?').bind(eid).first();
      if (event && event.created_by && event.org_id) {
        const creatorInOrg = await db.prepare(
          'SELECT 1 FROM user_orgs WHERE user_id = ? AND org_id = ? AND status = ?'
        ).bind(event.created_by, event.org_id, 'active').first();

        if (!creatorInOrg && role !== 'admin' && userId !== event.created_by) {
          return Response.json([]);
        }
      }

      ({ results } = await db.prepare(`
        SELECT m.*, o.name as org_name,
          u2.display_name as target_user_name,
          (SELECT MAX(r.id) FROM message_replies r WHERE r.message_id = m.id) as latest_reply_id,
          COALESCE((SELECT mr.last_read_reply_id FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?), 0) as last_read_reply_id
        FROM messages m
        LEFT JOIN organizations o ON m.org_id = o.id
        LEFT JOIN users u2 ON m.user_id = u2.id
        WHERE m.event_id = ?
        ORDER BY m.created_at DESC
      `).bind(userId || 0, eid).all());

      const messages = results.map(row => ({
        ...row,
        archived: !!row.archived,
        has_unread: (row.latest_reply_id || 0) > (row.last_read_reply_id || 0),
        message_type: row.message_type || 'org',
        target_user_name: row.target_user_name || null,
      }));

      return Response.json(messages);
    }

    if (view === 'admin' && role === 'admin') {
      // Admin view: all messages except event-linked threads where event is not published
      ({ results } = await db.prepare(`
        SELECT m.*, o.name as org_name,
          u2.display_name as target_user_name,
          e.status as event_status,
          (SELECT MAX(r.id) FROM message_replies r WHERE r.message_id = m.id) as latest_reply_id,
          COALESCE((SELECT mr.last_read_reply_id FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?), 0) as last_read_reply_id
        FROM messages m
        LEFT JOIN organizations o ON m.org_id = o.id
        LEFT JOIN users u2 ON m.user_id = u2.id
        LEFT JOIN events e ON m.event_id = e.id
        WHERE m.event_id IS NULL
           OR e.status = 'published'
        ORDER BY m.created_at DESC
      `).bind(userId || 0).all());

      const messages = results.map(row => ({
        ...row,
        archived: row.event_id && row.event_status === 'published' ? true : !!row.archived,
        has_unread: (row.latest_reply_id || 0) > (row.last_read_reply_id || 0),
        message_type: row.message_type || 'org',
        target_user_name: row.target_user_name || null,
      }));

      return Response.json(messages);
    } else if (role === 'admin') {
      // Admin using organizer messages view (no ?view param) — show all
      ({ results } = await db.prepare(`
        SELECT m.*, o.name as org_name,
          u2.display_name as target_user_name,
          (SELECT MAX(r.id) FROM message_replies r WHERE r.message_id = m.id) as latest_reply_id,
          COALESCE((SELECT mr.last_read_reply_id FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?), 0) as last_read_reply_id
        FROM messages m
        LEFT JOIN organizations o ON m.org_id = o.id
        LEFT JOIN users u2 ON m.user_id = u2.id
        ORDER BY m.created_at DESC
      `).bind(userId || 0).all());
    } else {
      // Organizer: show messages from all their active orgs + direct messages to them
      // Also include messages for events they created
      ({ results } = await db.prepare(`
        SELECT m.*, o.name as org_name,
          u2.display_name as target_user_name,
          (SELECT MAX(r.id) FROM message_replies r WHERE r.message_id = m.id) as latest_reply_id,
          COALESCE((SELECT mr.last_read_reply_id FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = ?), 0) as last_read_reply_id
        FROM messages m
        LEFT JOIN organizations o ON m.org_id = o.id
        LEFT JOIN users u2 ON m.user_id = u2.id
        WHERE m.org_id IN (SELECT org_id FROM user_orgs WHERE user_id = ? AND status = 'active')
           OR m.user_id = ?
           OR m.event_id IN (SELECT id FROM events WHERE created_by = ?)
        ORDER BY m.created_at DESC
      `).bind(userId || 0, userId || 0, userId || 0, userId || 0).all());
    }

    const messages = results.map(row => ({
      ...row,
      archived: !!row.archived,
      has_unread: (row.latest_reply_id || 0) > (row.last_read_reply_id || 0),
      message_type: row.message_type || 'org',
      target_user_name: row.target_user_name || null,
    }));

    return Response.json(messages);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Guests cannot send messages' }, { status: 403 });
  }

  try {
    const body = await context.request.json();
    if (!body.topic || !body.text) {
      return Response.json({ error: 'Topic and text are required' }, { status: 400 });
    }

    const messageType = body.message_type || 'org';
    let orgId = null;
    let targetUserId = null;

    if (messageType === 'direct') {
      // Direct message: no org, target a user
      orgId = null;
      targetUserId = body.user_id || userId;
    } else {
      // Org message: use specified org_id or fall back to user's primary org
      if (body.org_id) {
        orgId = body.org_id;
      } else if (userId) {
        const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
        if (user) orgId = user.org_id;
      }
      targetUserId = null;
    }

    // Create message topic (with optional event_id)
    const eventId = body.event_id || null;
    const msgResult = await db.prepare(
      'INSERT INTO messages (topic, org_id, event_id, message_type, user_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(body.topic, orgId, eventId, messageType, targetUserId).run();

    const messageId = msgResult.meta.last_row_id;

    // Add first reply
    const fromType = role === 'admin' ? 'admin' : 'org';
    await db.prepare(
      'INSERT INTO message_replies (message_id, from_type, text, user_id) VALUES (?, ?, ?, ?)'
    ).bind(messageId, fromType, body.text, userId || null).run();

    // Mark as read for the sender
    const latestReply = await db.prepare(
      'SELECT MAX(id) as max_id FROM message_replies WHERE message_id = ?'
    ).bind(messageId).first();
    if (userId && latestReply) {
      await db.prepare(
        'INSERT INTO message_reads (user_id, message_id, last_read_reply_id) VALUES (?, ?, ?) ON CONFLICT(user_id, message_id) DO UPDATE SET last_read_reply_id = excluded.last_read_reply_id'
      ).bind(userId, messageId, latestReply.max_id).run();
    }

    // If admin is messaging about a specific event, mark it as pending organizer response
    if (role === 'admin' && eventId) {
      await db.prepare(
        "UPDATE events SET status = 'pending_org', updated_at = datetime('now') WHERE id = ?"
      ).bind(eventId).run();
    }

    return Response.json({ ok: true, id: messageId });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
