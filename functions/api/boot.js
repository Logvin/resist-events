// GET /api/boot — returns current app mode for frontend routing

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;

  const authMode = context.data.authMode || 'demo';
  const rawTeamDomain = context.env.CF_ACCESS_TEAM_DOMAIN || '';
  const teamDomain = rawTeamDomain.replace(/\.cloudflareaccess\.com$/i, '') || null;

  try {
    const row = await db.prepare("SELECT value FROM site_config WHERE key = 'app_mode'").first();
    if (!row || row.value === 'setup_required') {
      return Response.json({ mode: 'setup_required', authMode, teamDomain });
    }
    return Response.json({ mode: row.value, authMode, teamDomain });
  } catch (e) {
    // Table might not exist yet on a truly fresh install
    return Response.json({ mode: 'setup_required', authMode, teamDomain });
  }
}
