// GET /api/boot — returns current app mode for frontend routing

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;

  const authMode = context.data.authMode || 'demo';

  try {
    const row = await db.prepare("SELECT value FROM site_config WHERE key = 'app_mode'").first();
    if (!row || row.value === 'setup_required') {
      return Response.json({ mode: 'setup_required', authMode });
    }
    return Response.json({ mode: row.value, authMode });
  } catch (e) {
    // Table might not exist yet on a truly fresh install
    return Response.json({ mode: 'setup_required', authMode });
  }
}
