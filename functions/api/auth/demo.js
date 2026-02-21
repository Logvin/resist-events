// POST /api/auth/demo — set demo role via cookie
// GET  /api/auth/demo — get current demo session

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;

  try {
    const body = await context.request.json();
    const role = body.role;

    if (!['guest', 'organizer', 'admin'].includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Find the demo user for this role
    const user = await db.prepare(
      'SELECT u.id, u.display_name, u.role, u.org_id, o.name as org_name FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.role = ? LIMIT 1'
    ).bind(role).first();

    if (!user) {
      // Create a basic session without a user record
      const headers = new Headers();
      headers.append('Set-Cookie', `demo_role=${role}; Path=/; HttpOnly; Secure; SameSite=Strict`);
      headers.append('Set-Cookie', `demo_user_id=0; Path=/; HttpOnly; Secure; SameSite=Strict`);
      headers.set('Content-Type', 'application/json');
      return new Response(JSON.stringify({
        role,
        org_id: null,
        org_name: role === 'guest' ? 'Guest' : 'Demo Org',
        display_name: role === 'guest' ? 'Guest Visitor' : 'Demo User',
      }), { headers });
    }

    const headers = new Headers();
    headers.append('Set-Cookie', `demo_role=${user.role}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    headers.append('Set-Cookie', `demo_user_id=${user.id}; Path=/; HttpOnly; Secure; SameSite=Strict`);
    headers.set('Content-Type', 'application/json');

    return new Response(JSON.stringify({
      role: user.role,
      user_id: user.id,
      org_id: user.org_id,
      org_name: user.org_name || '',
      display_name: user.display_name,
    }), { headers });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role) {
    return Response.json({ role: null }, { status: 200 });
  }

  if (userId) {
    try {
      const user = await db.prepare(
        'SELECT u.id, u.display_name, u.role, u.org_id, o.name as org_name FROM users u LEFT JOIN organizations o ON u.org_id = o.id WHERE u.id = ?'
      ).bind(userId).first();

      if (user) {
        return Response.json({
          role: user.role,
          user_id: user.id,
          org_id: user.org_id,
          org_name: user.org_name || '',
          display_name: user.display_name,
        });
      }
    } catch (e) {
      // fallback
    }
  }

  return Response.json({
    role,
    org_id: null,
    org_name: role === 'guest' ? 'Guest' : 'Demo Org',
    display_name: role === 'guest' ? 'Guest Visitor' : 'Demo User',
  });
}
