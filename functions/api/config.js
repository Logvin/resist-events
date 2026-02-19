// GET /api/config — return site_config key-value pairs
// PUT /api/config — admin update site_config

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;

  try {
    const { results } = await db.prepare('SELECT key, value FROM site_config').all();
    const config = {};
    for (const row of results) {
      config[row.key] = row.value;
    }
    return Response.json(config);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPut(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  if (role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

  try {
    const body = await context.request.json();
    const allowedKeys = [
      'site_name', 'site_region',
      'event_organizer_permission',
      'hero_line_1', 'hero_line_2', 'hero_subtitle',
      'show_event_count', 'show_org_count', 'show_people_mobilized',
      'purpose_text', 'privacy_policy', 'terms_of_service',
      'show_github_link', 'copyright_text',
    ];

    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.includes(key)) continue;
      await db.prepare('INSERT INTO site_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
        .bind(key, value).run();
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
