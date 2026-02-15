// GET  /api/orgs — list organizations
// PUT  /api/orgs — update an organization (organizer updates own, or specify org_id)
// POST /api/orgs — create organization (admin only)

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;

  try {
    const { results } = await db.prepare('SELECT id, name, abbreviation, website, socials, logo_url, qr_url FROM organizations ORDER BY name').all();
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
    const { name, abbreviation, website, socials, logo_url, qr_url } = body;

    if (!name || !abbreviation) {
      return Response.json({ error: 'Name and abbreviation are required' }, { status: 400 });
    }

    const result = await db.prepare(
      'INSERT INTO organizations (name, abbreviation, website, socials, logo_url, qr_url) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      name,
      abbreviation,
      website || '',
      JSON.stringify(socials || {}),
      logo_url || null,
      qr_url || null
    ).run();

    return Response.json({ ok: true, id: result.meta.last_row_id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const db = context.env.RESIST_DB;
  const userId = context.data.demoUserId;
  const role = context.data.demoRole;
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await context.request.json();

    // Determine which org to update
    let orgId = body.org_id || null;
    if (!orgId) {
      // Fall back to user's primary org
      const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
      if (!user || !user.org_id) return Response.json({ error: 'No org found' }, { status: 404 });
      orgId = user.org_id;
    }

    // Verify organizer belongs to this org (or is admin)
    if (role !== 'admin') {
      const membership = await db.prepare('SELECT 1 FROM user_orgs WHERE user_id = ? AND org_id = ? AND status = ?').bind(userId, orgId, 'active').first();
      if (!membership) return Response.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    const { name, website, socials, logo_url, qr_url } = body;

    await db.prepare(
      'UPDATE organizations SET name = ?, website = ?, socials = ?, logo_url = ?, qr_url = ? WHERE id = ?'
    ).bind(
      name || '',
      website || '',
      JSON.stringify(socials || {}),
      logo_url !== undefined ? (logo_url || null) : null,
      qr_url !== undefined ? (qr_url || null) : null,
      orgId
    ).run();

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
