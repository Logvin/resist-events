// GET    /api/events/:id — get single event
// PUT    /api/events/:id — update event
// DELETE /api/events/:id — delete event

import { auditLog } from '../../lib/audit.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const MAX_LENGTHS = { title: 200, address: 500, description: 10000, parking: 500, notes: 5000, event_type: 100 };

function validateEventFields(body) {
  const errors = [];
  if (body.title !== undefined && body.title.length > MAX_LENGTHS.title) {
    errors.push(`Title must be ${MAX_LENGTHS.title} characters or fewer`);
  }
  if (body.date !== undefined && body.date && !DATE_RE.test(body.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }
  if (body.start_time && !TIME_RE.test(body.start_time)) errors.push('start_time must be in HH:MM format');
  if (body.end_time && !TIME_RE.test(body.end_time)) errors.push('end_time must be in HH:MM format');
  for (const field of ['website_url', 'reg_link', 'flyer_url']) {
    if (body[field]) {
      try { new URL(body[field]); } catch { errors.push(`${field} must be a valid URL`); }
    }
  }
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (body[field] && body[field].length > max) {
      errors.push(`${field} must be ${max} characters or fewer`);
    }
  }
  if (body.bring_items !== undefined && !Array.isArray(body.bring_items)) {
    errors.push('bring_items must be an array');
  }
  if (body.no_bring_items !== undefined && !Array.isArray(body.no_bring_items)) {
    errors.push('no_bring_items must be an array');
  }
  return errors;
}

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const id = context.params.id;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  try {
    const row = await db.prepare(`
      SELECT e.*, o.name as org_name, o.abbreviation as org_abbreviation,
        CASE WHEN e.org_id = (SELECT org_id FROM users WHERE id = ?) THEN 1 ELSE 0 END as org_is_host,
        CASE WHEN ef.event_id IS NOT NULL THEN '/api/events/' || e.id || '/flyer/image.png' ELSE NULL END as generated_flyer_url
      FROM events e
      LEFT JOIN organizations o ON e.org_id = o.id
      LEFT JOIN event_flyers ef ON ef.event_id = e.id
      WHERE e.id = ?
    `).bind(userId || 0, id).first();

    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

    // Guests can only see published events
    const isAdmin = role === 'admin';
    const isOrganizer = role === 'organizer';
    const unpublishedStatuses = ['draft', 'review', 'pending_org'];

    if (!isAdmin && unpublishedStatuses.includes(row.status)) {
      // Organizers can see their own org's unpublished events
      if (isOrganizer && userId) {
        const userOrg = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
        if (!userOrg || userOrg.org_id !== row.org_id) {
          return Response.json({ error: 'Not found' }, { status: 404 });
        }
      } else {
        return Response.json({ error: 'Not found' }, { status: 404 });
      }
    }

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

    // Input validation
    const validationErrors = validateEventFields(body);
    if (validationErrors.length > 0) {
      return Response.json({ error: validationErrors.join('; ') }, { status: 400 });
    }

    // Ownership check: organizers can only edit events belonging to their org
    if (role !== 'admin') {
      const existingEvent = await db.prepare('SELECT org_id FROM events WHERE id = ?').bind(id).first();
      if (!existingEvent) return Response.json({ error: 'Not found' }, { status: 404 });
      const userOrg = userId ? await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first() : null;
      if (!userOrg || userOrg.org_id !== existingEvent.org_id) {
        return Response.json({ error: 'You can only edit events for your own organization' }, { status: 403 });
      }
    }

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

    // Enforce status workflow transitions (admin can do any transition)
    if (body.status !== undefined && role !== 'admin') {
      const currentEvent = await db.prepare('SELECT status FROM events WHERE id = ?').bind(id).first();
      if (currentEvent) {
        const allowedTransitions = {
          draft: ['review'],
          review: ['draft'],
          pending_org: ['review'],
          published: ['archived'],
          archived: [],
        };
        const from = currentEvent.status;
        const to = body.status;
        const allowed = allowedTransitions[from] || [];
        if (from !== to && !allowed.includes(to)) {
          return Response.json({ error: `Cannot transition event from '${from}' to '${to}'` }, { status: 400 });
        }
      }
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

    // Audit status changes
    if (body.status) {
      await auditLog(db, {
        userId: context.data.demoUserId,
        action: `event.status.${body.status}`,
        targetType: 'event',
        targetId: parseInt(id),
      });
    }

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
    await auditLog(db, { userId: context.data.demoUserId, action: 'event.delete', targetType: 'event', targetId: parseInt(id) });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
