// POST /api/events/published-seen — mark published events as seen by organizer

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const userId = context.data.demoUserId;

  if (!userId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await context.request.json();
    const eventIds = body.event_ids || [];

    for (const eventId of eventIds) {
      await db.prepare(
        'INSERT INTO event_published_seen (user_id, event_id) VALUES (?, ?) ON CONFLICT(user_id, event_id) DO NOTHING'
      ).bind(userId, eventId).run();
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
