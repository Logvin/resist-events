// POST /api/auth/logout — clear all auth state
// Sets the resist_logged_out flag (so middleware ignores any CF Access JWT)
// and expires the demo_role / demo_user_id cookies so a stale demo session
// cannot make the user appear authenticated in live mode.

export async function onRequestPost() {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.append('Set-Cookie', 'resist_logged_out=1; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400');
  headers.append('Set-Cookie', 'demo_role=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  headers.append('Set-Cookie', 'demo_user_id=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  return new Response(JSON.stringify({ ok: true }), { headers });
}

// GET /api/auth/logout — clear the logged-out flag so the existing JWT resumes
export async function onRequestGet() {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.append('Set-Cookie', 'resist_logged_out=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
  return new Response(JSON.stringify({ ok: true }), { headers });
}
