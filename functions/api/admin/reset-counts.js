// POST /api/admin/reset-counts — return row counts for reset confirmation

export async function onRequestPost(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const body = await context.request.json();
  const userId = context.data.demoUserId;
  const counts = {};

  try {
    if (body.full_reset) {
      // Count everything
      const orgs = await db.prepare("SELECT COUNT(*) as c FROM organizations").first();
      const users = await db.prepare("SELECT COUNT(*) as c FROM users").first();
      const events = await db.prepare("SELECT COUNT(*) as c FROM events").first();
      const messages = await db.prepare("SELECT COUNT(*) as c FROM messages").first();
      const flyers = await db.prepare("SELECT COUNT(*) as c FROM event_flyers").first();
      const settings = await db.prepare("SELECT COUNT(*) as c FROM site_config").first();
      counts.organizations = orgs.c;
      counts.users = users.c;
      counts.events = events.c;
      counts.messages = messages.c;
      counts.flyers = flyers.c;
      counts.settings = settings.c;
      counts.full_reset = true;
      return Response.json(counts);
    }

    // Individual counts
    if (body.reset_orgs) {
      // Get admin's org_id to exclude
      let adminOrgId = null;
      if (userId) {
        const adminUser = await db.prepare("SELECT org_id FROM users WHERE id = ?").bind(userId).first();
        if (adminUser) adminOrgId = adminUser.org_id;
      }
      if (adminOrgId) {
        const r = await db.prepare("SELECT COUNT(*) as c FROM organizations WHERE id != ?").bind(adminOrgId).first();
        counts.organizations = r.c;
      } else {
        const r = await db.prepare("SELECT COUNT(*) as c FROM organizations").first();
        counts.organizations = r.c;
      }
    }

    if (body.reset_users) {
      if (userId) {
        const r = await db.prepare("SELECT COUNT(*) as c FROM users WHERE id != ?").bind(userId).first();
        counts.users = r.c;
      } else {
        const r = await db.prepare("SELECT COUNT(*) as c FROM users").first();
        counts.users = r.c;
      }
    }

    if (body.reset_events) {
      const r = await db.prepare("SELECT COUNT(*) as c FROM events").first();
      counts.events = r.c;
    }

    if (body.reset_messages) {
      const r = await db.prepare("SELECT COUNT(*) as c FROM messages").first();
      counts.messages = r.c;
    }

    if (body.reset_flyers) {
      const r = await db.prepare("SELECT COUNT(*) as c FROM event_flyers").first();
      counts.flyers = r.c;
    }

    if (body.reset_styles) {
      counts.styles = 0; // placeholder
    }

    if (body.reset_settings) {
      const r = await db.prepare("SELECT COUNT(*) as c FROM site_config WHERE key NOT IN ('app_mode','admin_email','site_name','site_region')").first();
      counts.settings = r.c;
    }

    return Response.json(counts);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
