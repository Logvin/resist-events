// GET  /api/events — list events
// POST /api/events — create event

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const userId = context.data.demoUserId;
  const role = context.data.demoRole;

  try {
    let query = `
      SELECT e.*, o.name as org_name, o.abbreviation as org_abbreviation,
        CASE WHEN e.org_id = (SELECT org_id FROM users WHERE id = ?) THEN 1 ELSE 0 END as org_is_host,
        CASE WHEN ef.event_id IS NOT NULL THEN '/api/events/' || e.id || '/flyer/image.png' ELSE NULL END as generated_flyer_url
    `;

    // For admins, include review_seen status
    if (role === 'admin') {
      query += `,
        CASE WHEN e.status IN ('review', 'pending_org') AND EXISTS (SELECT 1 FROM review_seen rs WHERE rs.event_id = e.id AND rs.user_id = ?) THEN 1 ELSE 0 END as is_seen
      `;
    }

    query += `
      FROM events e
      JOIN organizations o ON e.org_id = o.id
      LEFT JOIN event_flyers ef ON ef.event_id = e.id
      ORDER BY e.date ASC
    `;

    const bindParams = role === 'admin'
      ? [userId || 0, userId || 0]
      : [userId || 0];

    const { results } = await db.prepare(query).bind(...bindParams).all();

    const events = results.map(row => ({
      ...row,
      bring_items: row.bring_items ? JSON.parse(row.bring_items) : [],
      no_bring_items: row.no_bring_items ? JSON.parse(row.no_bring_items) : [],
      reg_required: !!row.reg_required,
      hide_address: !!row.hide_address,
      org_is_host: !!row.org_is_host,
      is_seen: !!row.is_seen,
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

    // Auto-approve if organizer belongs to the sponsoring org
    // (their org_id matches the event's org_id)
    let status = body.status || 'draft';
    if (status === 'review' && orgId) {
      // The event is always created under the user's org, so if submitting for review
      // and the user belongs to the org, auto-approve (skip review)
      const userBelongsToOrg = true; // events are always created under user's org
      if (userBelongsToOrg) {
        status = 'published';
      }
    }

    const result = await db.prepare(`
      INSERT INTO events (title, org_id, date, start_time, end_time, address, description, parking, flyer_url, website_url, reg_link, reg_required, hide_address, status, bring_items, no_bring_items, notes, event_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      status,
      JSON.stringify(body.bring_items || []),
      JSON.stringify(body.no_bring_items || []),
      body.notes || '',
      body.event_type || ''
    ).run();

    return Response.json({ ok: true, id: result.meta.last_row_id, status });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
