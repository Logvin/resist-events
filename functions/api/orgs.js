// GET  /api/orgs — list organizations
// PUT  /api/orgs — update current user's organization
// POST /api/orgs — create organization (admin only)

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;

  try {
    const { results } = await db.prepare('SELECT id, name, abbreviation, website, socials FROM organizations ORDER BY name').all();
    const orgs = results.map(row => ({
      ...row,
      socials: row.socials ? JSON.parse(row.socials) : {},
    }));
    return Response.json(orgs);
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
    const { name, abbreviation, website, socials } = body;

    if (!name || !abbreviation) {
      return Response.json({ error: 'Name and abbreviation are required' }, { status: 400 });
    }

    const result = await db.prepare(
      'INSERT INTO organizations (name, abbreviation, website, socials) VALUES (?, ?, ?, ?)'
    ).bind(
      name,
      abbreviation,
      website || '',
      JSON.stringify(socials || {})
    ).run();

    return Response.json({ ok: true, id: result.meta.last_row_id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const db = context.env.RESIST_DB;
  const userId = context.data.demoUserId;
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    // Get user's org
    const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
    if (!user || !user.org_id) return Response.json({ error: 'No org found' }, { status: 404 });

    const body = await context.request.json();
    const { name, website, socials } = body;

    await db.prepare(
      'UPDATE organizations SET name = ?, website = ?, socials = ? WHERE id = ?'
    ).bind(
      name || '',
      website || '',
      JSON.stringify(socials || {}),
      user.org_id
    ).run();

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
