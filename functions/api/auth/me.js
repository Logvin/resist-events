// GET /api/auth/me — returns current session info for both auth modes

export async function onRequestGet(context) {
  const { authMode, demoRole, demoUserId, jwtEmail, liveOrgId, liveOrgName, liveDisplayName } = context.data;

  if (authMode === 'live') {
    if (demoRole && demoRole !== 'guest' && demoUserId) {
      return Response.json({
        authenticated: true,
        authMode: 'live',
        role: demoRole,
        user_id: demoUserId,
        org_id: liveOrgId || null,
        org_name: liveOrgName || '',
        display_name: liveDisplayName || '',
        email: jwtEmail,
      });
    }
    return Response.json({
      authenticated: false,
      authMode: 'live',
      role: 'guest',
    });
  }

  // Demo mode
  return Response.json({
    authenticated: !!demoRole,
    authMode: 'demo',
    role: demoRole || null,
  });
}
