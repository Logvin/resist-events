// GET  /api/messages/:id — get thread with replies (marks as read)
// POST /api/messages/:id — add reply to thread
// PUT  /api/messages/:id — update message (archive)

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  // Guests cannot read messages
  if (!role || role === 'guest') {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const message = await db.prepare(`
      SELECT m.*, o.name as org_name,
        u2.display_name as target_user_name
      FROM messages m
      LEFT JOIN organizations o ON m.org_id = o.id
      LEFT JOIN users u2 ON m.user_id = u2.id
      WHERE m.id = ?
    `).bind(id).first();

    if (!message) return Response.json({ error: 'Not found' }, { status: 404 });

    // Authorization check: must be admin, org member, or direct message target
    if (role !== 'admin') {
      let authorized = false;
      // Check if user is a member of the message's org
      if (message.org_id && userId) {
        const membership = await db.prepare(
          'SELECT 1 FROM user_orgs WHERE user_id = ? AND org_id = ? AND status = ?'
        ).bind(userId, message.org_id, 'active').first();
        if (membership) authorized = true;
      }
      // Check if user is the direct message target
      if (!authorized && message.user_id && message.user_id === userId) {
        authorized = true;
      }
      // Check if user is the event creator (for event-linked messages)
      if (!authorized && message.event_id && userId) {
        const eventRow = await db.prepare('SELECT created_by FROM events WHERE id = ?').bind(message.event_id).first();
        if (eventRow && eventRow.created_by === userId) authorized = true;
      }
      if (!authorized) {
        return Response.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    const { results: replies } = await db.prepare(`
      SELECT r.*, u.email as user_email, u.display_name as user_display_name
      FROM message_replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.message_id = ? ORDER BY r.created_at ASC
    `).bind(id).all();

    // Mark as read for the current user
    if (userId && replies.length > 0) {
      const latestReplyId = replies[replies.length - 1].id;
      await db.prepare(
        'INSERT INTO message_reads (user_id, message_id, last_read_reply_id) VALUES (?, ?, ?) ON CONFLICT(user_id, message_id) DO UPDATE SET last_read_reply_id = excluded.last_read_reply_id'
      ).bind(userId, id, latestReplyId).run();
    }

    const response = {
      ...message,
      archived: !!message.archived,
      message_type: message.message_type || 'org',
      target_user_name: message.target_user_name || null,
      replies,
    };

    // Admin viewing an org thread: include read receipts (no PII — display_name only)
    if (role === 'admin' && (message.message_type || 'org') === 'org' && message.org_id) {
      const { results: members } = await db.prepare(`
        SELECT u.id as user_id, u.display_name,
          CASE WHEN mr.last_read_reply_id IS NOT NULL THEN 1 ELSE 0 END as has_read,
          COALESCE(mr.last_read_reply_id, 0) as last_read_reply_id
        FROM user_orgs uo
        JOIN users u ON uo.user_id = u.id
        LEFT JOIN message_reads mr ON mr.user_id = u.id AND mr.message_id = ?
        WHERE uo.org_id = ? AND uo.status = 'active'
      `).bind(id, message.org_id).all();

      response.read_receipts = members.map(m => ({
        user_id: m.user_id,
        display_name: m.display_name,
        has_read: !!m.has_read,
        last_read_reply_id: m.last_read_reply_id,
      }));
    }

    return Response.json(response);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Guests cannot reply' }, { status: 403 });
  }

  try {
    const body = await context.request.json();
    if (!body.text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }
    if (body.text.length > 10000) {
      return Response.json({ error: 'Reply text must be 10,000 characters or fewer' }, { status: 400 });
    }

    const fromType = role === 'admin' ? 'admin' : 'org';
    await db.prepare(
      'INSERT INTO message_replies (message_id, from_type, text, user_id) VALUES (?, ?, ?, ?)'
    ).bind(id, fromType, body.text, userId || null).run();

    // Mark as read for the sender
    const latestReply = await db.prepare(
      'SELECT MAX(id) as max_id FROM message_replies WHERE message_id = ?'
    ).bind(id).first();
    if (userId && latestReply) {
      await db.prepare(
        'INSERT INTO message_reads (user_id, message_id, last_read_reply_id) VALUES (?, ?, ?) ON CONFLICT(user_id, message_id) DO UPDATE SET last_read_reply_id = excluded.last_read_reply_id'
      ).bind(userId, id, latestReply.max_id).run();
    }

    // If organizer replies to a thread linked to an event with pending_org status, move back to review
    if (fromType === 'org') {
      const message = await db.prepare('SELECT event_id FROM messages WHERE id = ?').bind(id).first();
      if (message && message.event_id) {
        const event = await db.prepare('SELECT status FROM events WHERE id = ?').bind(message.event_id).first();
        if (event && event.status === 'pending_org') {
          await db.prepare(
            "UPDATE events SET status = 'review', updated_at = datetime('now') WHERE id = ?"
          ).bind(message.event_id).run();
        }
      }
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await context.request.json();

    if (body.archived !== undefined) {
      // Only admin can archive messages; organizers can only archive their own org's threads
      if (role !== 'admin') {
        const message = await db.prepare('SELECT org_id FROM messages WHERE id = ?').bind(id).first();
        if (!message) return Response.json({ error: 'Not found' }, { status: 404 });
        if (userId && message.org_id) {
          const membership = await db.prepare(
            'SELECT 1 FROM user_orgs WHERE user_id = ? AND org_id = ? AND status = ?'
          ).bind(userId, message.org_id, 'active').first();
          if (!membership) return Response.json({ error: 'Not authorized' }, { status: 403 });
        } else {
          return Response.json({ error: 'Not authorized' }, { status: 403 });
        }
      }
      await db.prepare('UPDATE messages SET archived = ? WHERE id = ?').bind(body.archived ? 1 : 0, id).run();
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
