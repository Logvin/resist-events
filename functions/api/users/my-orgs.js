// GET /api/users/my-orgs — get orgs the current user belongs to

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const userId = context.data.demoUserId;

  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { results } = await db.prepare(`
      SELECT o.id, o.name, o.abbreviation
      FROM user_orgs uo
      JOIN organizations o ON uo.org_id = o.id
      WHERE uo.user_id = ? AND uo.status = 'active'
      ORDER BY o.name
    `).bind(userId).all();

    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
