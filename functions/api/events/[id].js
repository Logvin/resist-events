// GET    /api/events/:id — get single event
// PUT    /api/events/:id — update event
// DELETE /api/events/:id — delete event

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;

  try {
    const row = await db.prepare(`
      SELECT e.*, o.name as org_name, o.abbreviation as org_abbreviation,
        CASE WHEN e.org_id = (SELECT org_id FROM users WHERE id = ?) THEN 1 ELSE 0 END as org_is_host,
        CASE WHEN ef.event_id IS NOT NULL THEN '/api/events/' || e.id || '/flyer/image.png' ELSE NULL END as generated_flyer_url
      FROM events e
      LEFT JOIN organizations o ON e.org_id = o.id
      LEFT JOIN event_flyers ef ON ef.event_id = e.id
      WHERE e.id = ?
    `).bind(context.data.demoUserId || 0, id).first();

    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

    const event = {
      ...row,
      bring_items: row.bring_items ? JSON.parse(row.bring_items) : [],
      no_bring_items: row.no_bring_items ? JSON.parse(row.no_bring_items) : [],
      reg_required: !!row.reg_required,
      hide_address: !!row.hide_address,
      org_is_host: !!row.org_is_host,
    };

    return Response.json(event);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;
  const role = context.data.demoRole;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Guests cannot edit events' }, { status: 403 });
  }

  try {
    const body = await context.request.json();
    const userId = context.data.demoUserId;

    // Read event_organizer_permission config
    let eventOrgPerm = 'own_org_only';
    try {
      const permRow = await db.prepare("SELECT value FROM site_config WHERE key = 'event_organizer_permission'").first();
      if (permRow) eventOrgPerm = permRow.value;
    } catch (e) { /* use default */ }

    // Handle org_id update
    if (body.org_id !== undefined) {
      const userOrgId = userId ? (await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first())?.org_id : null;
      if (role !== 'admin' && body.org_id && body.org_id !== userOrgId && eventOrgPerm === 'own_org_only') {
        return Response.json({ error: 'You can only create events for your own organization' }, { status: 403 });
      }
    }

    // Auto-publish logic
    if (body.status === 'review') {
      if (role === 'admin') {
        // Admin events always auto-publish
        body.status = 'published';
      } else if (eventOrgPerm === 'any_org') {
        // Any org mode: organizer events always auto-publish
        body.status = 'published';
      } else if (eventOrgPerm === 'approved_list' && role === 'organizer' && userId) {
        const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
        const targetOrgId = body.org_id !== undefined ? body.org_id : (await db.prepare('SELECT org_id FROM events WHERE id = ?').bind(id).first())?.org_id;
        if (user && targetOrgId) {
          const org = await db.prepare('SELECT can_self_publish, can_cross_publish FROM organizations WHERE id = ?').bind(targetOrgId).first();
          if (user.org_id === targetOrgId && org && org.can_self_publish) {
            body.status = 'published';
          } else if (user.org_id !== targetOrgId && org && org.can_cross_publish) {
            body.status = 'published';
          }
        }
      }
      // own_org_only: organizers always go to 'review' (no auto-publish)
    }

    // Build dynamic update
    const fields = [];
    const values = [];

    const allowed = ['title', 'org_id', 'date', 'start_time', 'end_time', 'address', 'description', 'parking', 'flyer_url', 'website_url', 'reg_link', 'notes', 'status', 'event_type'];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (body.reg_required !== undefined) {
      fields.push('reg_required = ?');
      values.push(body.reg_required ? 1 : 0);
    }
    if (body.hide_address !== undefined) {
      fields.push('hide_address = ?');
      values.push(body.hide_address ? 1 : 0);
    }
    if (body.bring_items !== undefined) {
      fields.push('bring_items = ?');
      values.push(JSON.stringify(body.bring_items));
    }
    if (body.no_bring_items !== undefined) {
      fields.push('no_bring_items = ?');
      values.push(JSON.stringify(body.no_bring_items));
    }

    if (fields.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;
  const role = context.data.demoRole;

  if (role !== 'admin') {
    return Response.json({ error: 'Only admins can delete events' }, { status: 403 });
  }

  try {
    await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
