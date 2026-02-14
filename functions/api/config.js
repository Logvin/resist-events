// GET /api/config — return site_config key-value pairs

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
