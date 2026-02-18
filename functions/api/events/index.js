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

    // For non-admin users, include published_seen status
    if (role && role !== 'admin') {
      query += `,
        CASE WHEN e.status = 'published' AND EXISTS (SELECT 1 FROM event_published_seen eps WHERE eps.event_id = e.id AND eps.user_id = ?) THEN 1 ELSE 0 END as published_seen
      `;
    }

    query += `
      FROM events e
      LEFT JOIN organizations o ON e.org_id = o.id
      LEFT JOIN event_flyers ef ON ef.event_id = e.id
      ORDER BY e.date ASC
    `;

    const bindParams = [userId || 0];
    if (role === 'admin') bindParams.push(userId || 0);
    if (role && role !== 'admin') bindParams.push(userId || 0);

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
      published_seen: !!row.published_seen,
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
    let userOrgId = null;
    if (userId) {
      const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
      if (user) userOrgId = user.org_id;
    }

    const body = await context.request.json();

    // Determine target org_id: use body.org_id if provided, else user's org
    let orgId = (body.org_id !== undefined && body.org_id !== null) ? body.org_id : userOrgId;

    // For non-admin users, require an org
    if (!orgId && role !== 'admin') {
      const firstOrg = await db.prepare('SELECT id FROM organizations LIMIT 1').first();
      orgId = firstOrg ? firstOrg.id : 1;
    }
    // Admin without org: orgId stays null (admin persona)

    // Read event_organizer_permission config
    let eventOrgPerm = 'own_org_only';
    try {
      const permRow = await db.prepare("SELECT value FROM site_config WHERE key = 'event_organizer_permission'").first();
      if (permRow) eventOrgPerm = permRow.value;
    } catch (e) { /* use default */ }

    // Validate org_id based on permission level (non-admin only)
    if (role !== 'admin' && orgId && orgId !== userOrgId) {
      if (eventOrgPerm === 'own_org_only') {
        return Response.json({ error: 'You can only create events for your own organization' }, { status: 403 });
      }
    }

    let status = body.status || 'draft';

    if (status === 'review') {
      if (role === 'admin') {
        // Admin events always auto-publish
        status = 'published';
      } else if (eventOrgPerm === 'any_org') {
        // Any org mode: organizer events always auto-publish
        status = 'published';
      } else if (eventOrgPerm === 'approved_list' && orgId) {
        // Approved list mode: use existing can_self_publish/can_cross_publish flags
        const org = await db.prepare('SELECT can_self_publish, can_cross_publish FROM organizations WHERE id = ?').bind(orgId).first();

        if (userOrgId === orgId && org && org.can_self_publish) {
          status = 'published';
        } else if (userOrgId !== orgId && org && org.can_cross_publish) {
          status = 'published';
        }
        // Otherwise stays 'review'
      }
      // own_org_only: organizers always go to 'review' (no auto-publish)
    }

    const result = await db.prepare(`
      INSERT INTO events (title, org_id, created_by, date, start_time, end_time, address, description, parking, flyer_url, website_url, reg_link, reg_required, hide_address, status, bring_items, no_bring_items, notes, event_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.title || '',
      orgId,
      userId || null,
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
