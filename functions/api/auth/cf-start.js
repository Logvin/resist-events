// GET /api/auth/cf-start — CF Access login entry point
// This path should be protected by a CF Access "Allow" policy.
// When a user navigates here, CF Access intercepts and presents the login screen.
// After authentication, CF Access sets the CF_Authorization cookie and forwards
// the request to this handler, which redirects the user back to the site.

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const redirect = url.searchParams.get('redirect_url') || '/';
  return Response.redirect(redirect, 302);
}
