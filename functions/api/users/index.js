// GET  /api/users — list all users (admin only)
// POST /api/users — create user (admin only)

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;

  if (role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const url = new URL(context.request.url);
  const includeArchived = url.searchParams.get('include_archived') === 'true';

  try {
    let query = `
      SELECT u.id, u.email, u.display_name, u.role, u.org_id, o.name as org_name
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
    `;

    if (!includeArchived) {
      query += ` WHERE u.id NOT IN (SELECT item_id FROM archived_items WHERE item_type = 'user')`;
    }

    query += ` ORDER BY u.display_name`;

    const { results } = await db.prepare(query).all();

    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;

  if (role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const body = await context.request.json();
    const { display_name, email, role: userRole, org_id } = body;

    if (!display_name || !email) {
      return Response.json({ error: 'Display name and email are required' }, { status: 400 });
    }

    if (userRole === 'organizer' && !org_id) {
      return Response.json({ error: 'Organizer role requires an organization' }, { status: 400 });
    }

    const result = await db.prepare(
      'INSERT INTO users (display_name, email, role, org_id) VALUES (?, ?, ?, ?)'
    ).bind(
      display_name,
      email,
      userRole || 'guest',
      org_id || null
    ).run();

    return Response.json({ ok: true, id: result.meta.last_row_id });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return Response.json({ error: 'Email already exists' }, { status: 409 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}
