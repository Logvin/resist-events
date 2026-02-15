// GET  /api/orgs/members?org_id=X — list members of an org
// POST /api/orgs/members — add/archive/unarchive a member

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id');

    if (!orgId) {
      return Response.json({ error: 'org_id is required' }, { status: 400 });
    }

    // Get all members (active and archived) for this org
    const { results } = await db.prepare(`
      SELECT uo.status as membership_status, uo.created_at as joined_at,
             u.id, u.email, u.display_name, u.role
      FROM user_orgs uo
      JOIN users u ON uo.user_id = u.id
      WHERE uo.org_id = ?
      ORDER BY uo.status ASC, u.display_name ASC
    `).bind(orgId).all();

    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await context.request.json();
    const { action, org_id, user_id, email } = body;

    if (!org_id || !action) {
      return Response.json({ error: 'org_id and action are required' }, { status: 400 });
    }

    // Verify caller is a member of this org or admin
    if (role !== 'admin') {
      const membership = await db.prepare(
        'SELECT 1 FROM user_orgs WHERE user_id = ? AND org_id = ? AND status = ?'
      ).bind(userId, org_id, 'active').first();
      if (!membership) {
        return Response.json({ error: 'Not a member of this organization' }, { status: 403 });
      }
    }

    if (action === 'add') {
      // Add by email — find user, create user_orgs entry
      if (!email) {
        return Response.json({ error: 'email is required to add a member' }, { status: 400 });
      }

      const user = await db.prepare('SELECT id, role FROM users WHERE email = ?').bind(email).first();
      if (!user) {
        return Response.json({ error: 'No user found with that email' }, { status: 404 });
      }

      // Upsert into user_orgs
      await db.prepare(
        "INSERT INTO user_orgs (user_id, org_id, status) VALUES (?, ?, 'active') ON CONFLICT(user_id, org_id) DO UPDATE SET status = 'active'"
      ).bind(user.id, org_id).run();

      // If user is a guest, upgrade to organizer and set primary org
      if (user.role === 'guest') {
        await db.prepare("UPDATE users SET role = 'organizer', org_id = ? WHERE id = ?").bind(org_id, user.id).run();
      } else if (!user.org_id) {
        // Set primary org if they don't have one
        await db.prepare("UPDATE users SET org_id = ? WHERE id = ? AND org_id IS NULL").bind(org_id, user.id).run();
      }

      return Response.json({ ok: true, message: 'Member added' });
    }

    if (action === 'archive') {
      if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 });

      await db.prepare(
        "UPDATE user_orgs SET status = 'archived' WHERE user_id = ? AND org_id = ?"
      ).bind(user_id, org_id).run();

      // Check if user has any remaining active orgs
      const activeOrgs = await db.prepare(
        "SELECT COUNT(*) as count FROM user_orgs WHERE user_id = ? AND status = 'active'"
      ).bind(user_id).first();

      // If no active orgs, demote to guest
      if (activeOrgs.count === 0) {
        await db.prepare("UPDATE users SET role = 'guest', org_id = NULL WHERE id = ?").bind(user_id).run();
      } else {
        // Update primary org to first active one
        const firstActive = await db.prepare(
          "SELECT org_id FROM user_orgs WHERE user_id = ? AND status = 'active' LIMIT 1"
        ).bind(user_id).first();
        if (firstActive) {
          await db.prepare("UPDATE users SET org_id = ? WHERE id = ?").bind(firstActive.org_id, user_id).run();
        }
      }

      return Response.json({ ok: true, message: 'Member archived' });
    }

    if (action === 'unarchive') {
      if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 });

      await db.prepare(
        "UPDATE user_orgs SET status = 'active' WHERE user_id = ? AND org_id = ?"
      ).bind(user_id, org_id).run();

      // Restore to organizer if currently a guest
      const user = await db.prepare('SELECT role FROM users WHERE id = ?').bind(user_id).first();
      if (user && user.role === 'guest') {
        await db.prepare("UPDATE users SET role = 'organizer', org_id = ? WHERE id = ?").bind(org_id, user_id).run();
      }

      return Response.json({ ok: true, message: 'Member restored' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
