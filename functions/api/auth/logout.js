// POST /api/auth/logout — set app-level logged-out flag
// We don't clear CF_Authorization (CF Access manages that). Instead we set our own
// flag that the middleware checks to treat the user as guest.

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'resist_logged_out=1; Path=/; SameSite=Lax; Max-Age=86400',
    },
  });
}

// POST /api/auth/login — clear the logged-out flag so the existing JWT resumes
export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'resist_logged_out=; Max-Age=0; Path=/; SameSite=Lax',
    },
  });
}
