// GET /api/auth/cf-logout — redirects to Cloudflare Access logout endpoint
// Keeps CF_ACCESS_TEAM_DOMAIN server-side so it is never exposed to the browser.

export async function onRequestGet(context) {
  const rawTeamDomain = context.env.CF_ACCESS_TEAM_DOMAIN || '';
  const teamDomain = rawTeamDomain.replace(/\.cloudflareaccess\.com$/i, '');

  if (!teamDomain) {
    // CF Access not configured — nothing to log out of
    return new Response(null, { status: 204 });
  }

  return Response.redirect(
    `https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/logout`,
    302
  );
}
