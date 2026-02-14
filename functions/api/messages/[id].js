// GET  /api/messages/:id — get thread with replies
// POST /api/messages/:id — add reply to thread
// PUT  /api/messages/:id — update message (archive)

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;

  try {
    const message = await db.prepare(`
      SELECT m.*, o.name as org_name
      FROM messages m
      LEFT JOIN organizations o ON m.org_id = o.id
      WHERE m.id = ?
    `).bind(id).first();

    if (!message) return Response.json({ error: 'Not found' }, { status: 404 });

    const { results: replies } = await db.prepare(`
      SELECT r.*, u.email as user_email, u.display_name as user_display_name
      FROM message_replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.message_id = ? ORDER BY r.created_at ASC
    `).bind(id).all();

    return Response.json({
      ...message,
      archived: !!message.archived,
      replies,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;
  const role = context.data.demoRole;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Guests cannot reply' }, { status: 403 });
  }

  try {
    const body = await context.request.json();
    if (!body.text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const fromType = role === 'admin' ? 'admin' : 'org';
    const userId = context.data.demoUserId || null;
    await db.prepare(
      'INSERT INTO message_replies (message_id, from_type, text, user_id) VALUES (?, ?, ?, ?)'
    ).bind(id, fromType, body.text, userId).run();

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;

  try {
    const body = await context.request.json();

    if (body.archived !== undefined) {
      await db.prepare('UPDATE messages SET archived = ? WHERE id = ?').bind(body.archived ? 1 : 0, id).run();
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
