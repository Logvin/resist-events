// GET  /api/messages — list message topics
// POST /api/messages — create new topic with first message

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  try {
    let results;
    if (role === 'admin') {
      // Admin sees all messages
      ({ results } = await db.prepare(`
        SELECT m.*, o.name as org_name
        FROM messages m
        LEFT JOIN organizations o ON m.org_id = o.id
        ORDER BY m.created_at DESC
      `).all());
    } else {
      // Organizer sees their org's messages
      let orgId = null;
      if (userId) {
        const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
        if (user) orgId = user.org_id;
      }
      ({ results } = await db.prepare(`
        SELECT m.*, o.name as org_name
        FROM messages m
        LEFT JOIN organizations o ON m.org_id = o.id
        WHERE m.org_id = ?
        ORDER BY m.created_at DESC
      `).bind(orgId || 0).all());
    }

    const messages = results.map(row => ({
      ...row,
      archived: !!row.archived,
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

    // Get org id — admin can specify org_id to message any org
    let orgId = null;
    if (role === 'admin' && body.org_id) {
      orgId = body.org_id;
    } else if (userId) {
      const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
      if (user) orgId = user.org_id;
    }

    // Create message topic
    const msgResult = await db.prepare(
      'INSERT INTO messages (topic, org_id) VALUES (?, ?)'
    ).bind(body.topic, orgId).run();

    const messageId = msgResult.meta.last_row_id;

    // Add first reply
    const fromType = role === 'admin' ? 'admin' : 'org';
    await db.prepare(
      'INSERT INTO message_replies (message_id, from_type, text, user_id) VALUES (?, ?, ?, ?)'
    ).bind(messageId, fromType, body.text, userId || null).run();

    return Response.json({ ok: true, id: messageId });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
