// GET  /api/events — list events
// POST /api/events — create event

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;

  try {
    const { results } = await db.prepare(`
      SELECT e.*, o.name as org_name, o.abbreviation as org_abbreviation,
        CASE WHEN e.org_id = (SELECT org_id FROM users WHERE id = ?) THEN 1 ELSE 0 END as org_is_host
      FROM events e
      JOIN organizations o ON e.org_id = o.id
      ORDER BY e.date ASC
    `).bind(context.data.demoUserId || 0).all();

    const events = results.map(row => ({
      ...row,
      bring_items: row.bring_items ? JSON.parse(row.bring_items) : [],
      no_bring_items: row.no_bring_items ? JSON.parse(row.no_bring_items) : [],
      reg_required: !!row.reg_required,
      hide_address: !!row.hide_address,
      org_is_host: !!row.org_is_host,
      archived: !!row.archived,
    }));

    return Response.json(events);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const userId = context.data.demoUserId;
  const role = context.data.demoRole;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Guests cannot create events' }, { status: 403 });
  }

  try {
    // Get user's org
    let orgId = null;
    if (userId) {
      const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
      if (user) orgId = user.org_id;
    }

    if (!orgId) {
      // Default to first org if no org found
      const firstOrg = await db.prepare('SELECT id FROM organizations LIMIT 1').first();
      orgId = firstOrg ? firstOrg.id : 1;
    }

    const body = await context.request.json();

    const result = await db.prepare(`
      INSERT INTO events (title, org_id, date, start_time, end_time, address, description, parking, flyer_url, website_url, reg_link, reg_required, hide_address, status, bring_items, no_bring_items, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.title || '',
      orgId,
      body.date || '',
      body.start_time || '',
      body.end_time || '',
      body.address || '',
      body.description || '',
      body.parking || '',
      body.flyer_url || '',
      body.website_url || '',
      body.reg_link || '',
      body.reg_required ? 1 : 0,
      body.hide_address ? 1 : 0,
      body.status || 'draft',
      JSON.stringify(body.bring_items || []),
      JSON.stringify(body.no_bring_items || []),
      body.notes || ''
    ).run();

    return Response.json({ ok: true, id: result.meta.last_row_id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
