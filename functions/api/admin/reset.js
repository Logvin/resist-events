// POST /api/admin/reset — selective table reset, admin-only

export async function onRequestPost(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const body = await context.request.json();

  if (body.confirm !== 'RESET') {
    return Response.json({ error: 'Confirmation required: type RESET' }, { status: 400 });
  }

  const userId = context.data.demoUserId;
  let adminOrgId = null;
  if (userId) {
    const adminUser = await db.prepare("SELECT org_id FROM users WHERE id = ?").bind(userId).first();
    if (adminUser) adminOrgId = adminUser.org_id;
  }

  try {
    if (body.full_reset) {
      // Wipe all tables in FK-safe order
      await db.batch([
        db.prepare("DELETE FROM event_published_seen"),
        db.prepare("DELETE FROM review_seen"),
        db.prepare("DELETE FROM message_reads"),
        db.prepare("DELETE FROM message_replies"),
        db.prepare("DELETE FROM messages"),
        db.prepare("DELETE FROM event_flyers"),
        db.prepare("DELETE FROM events"),
        db.prepare("DELETE FROM user_orgs"),
        db.prepare("DELETE FROM users"),
        db.prepare("DELETE FROM organizations"),
        db.prepare("DELETE FROM site_config"),
        // Mark as needing setup so boot returns 'setup_required'
        db.prepare("INSERT INTO site_config (key, value) VALUES ('app_mode', 'setup_required')"),
      ]);
      return Response.json({ ok: true, full_reset: true });
    }

    // Individual resets — build statements in FK-safe order
    const stmts = [];

    // Messages first (messages reference events, orgs, users via FK)
    if (body.reset_messages) {
      stmts.push(db.prepare("DELETE FROM message_reads"));
      stmts.push(db.prepare("DELETE FROM message_replies"));
      stmts.push(db.prepare("DELETE FROM messages"));
    }

    // Events (clear FK references from messages first if not deleting messages)
    if (body.reset_events) {
      stmts.push(db.prepare("DELETE FROM event_published_seen"));
      stmts.push(db.prepare("DELETE FROM review_seen"));
      stmts.push(db.prepare("DELETE FROM event_flyers"));
      if (!body.reset_messages) {
        // Null out event_id in messages so FK doesn't block event deletion
        stmts.push(db.prepare("UPDATE messages SET event_id = NULL WHERE event_id IS NOT NULL"));
      }
      stmts.push(db.prepare("DELETE FROM events"));
    }

    // Flyers (if events not already cleared)
    if (body.reset_flyers && !body.reset_events) {
      stmts.push(db.prepare("DELETE FROM event_flyers"));
    }

    // Users (preserve admin; clear FK refs from events/messages first)
    if (body.reset_users) {
      if (userId) {
        if (!body.reset_events) {
          stmts.push(db.prepare("UPDATE events SET created_by = NULL WHERE created_by IS NOT NULL AND created_by != ?").bind(userId));
        }
        if (!body.reset_messages) {
          stmts.push(db.prepare("UPDATE messages SET user_id = NULL WHERE user_id IS NOT NULL AND user_id != ?").bind(userId));
          stmts.push(db.prepare("UPDATE message_replies SET user_id = NULL WHERE user_id IS NOT NULL AND user_id != ?").bind(userId));
        }
        stmts.push(db.prepare("DELETE FROM user_orgs WHERE user_id != ?").bind(userId));
        stmts.push(db.prepare("DELETE FROM users WHERE id != ?").bind(userId));
      } else {
        if (!body.reset_events) {
          stmts.push(db.prepare("UPDATE events SET created_by = NULL WHERE created_by IS NOT NULL"));
        }
        if (!body.reset_messages) {
          stmts.push(db.prepare("UPDATE messages SET user_id = NULL WHERE user_id IS NOT NULL"));
          stmts.push(db.prepare("UPDATE message_replies SET user_id = NULL WHERE user_id IS NOT NULL"));
        }
        stmts.push(db.prepare("DELETE FROM user_orgs"));
        stmts.push(db.prepare("DELETE FROM users"));
      }
    }

    // Organizations (preserve admin's org; clear FK refs)
    if (body.reset_orgs) {
      if (adminOrgId) {
        if (!body.reset_events) {
          stmts.push(db.prepare("UPDATE events SET org_id = NULL WHERE org_id IS NOT NULL AND org_id != ?").bind(adminOrgId));
        }
        if (!body.reset_messages) {
          stmts.push(db.prepare("UPDATE messages SET org_id = NULL WHERE org_id IS NOT NULL AND org_id != ?").bind(adminOrgId));
        }
        if (!body.reset_users) {
          stmts.push(db.prepare("UPDATE users SET org_id = NULL WHERE org_id IS NOT NULL AND org_id != ? AND id != ?").bind(adminOrgId, userId || 0));
        }
        stmts.push(db.prepare("DELETE FROM user_orgs WHERE org_id != ?").bind(adminOrgId));
        stmts.push(db.prepare("DELETE FROM organizations WHERE id != ?").bind(adminOrgId));
      } else {
        if (!body.reset_events) {
          stmts.push(db.prepare("UPDATE events SET org_id = NULL WHERE org_id IS NOT NULL"));
        }
        if (!body.reset_messages) {
          stmts.push(db.prepare("UPDATE messages SET org_id = NULL WHERE org_id IS NOT NULL"));
        }
        if (!body.reset_users) {
          stmts.push(db.prepare("UPDATE users SET org_id = NULL WHERE org_id IS NOT NULL"));
        }
        stmts.push(db.prepare("DELETE FROM user_orgs"));
        stmts.push(db.prepare("DELETE FROM organizations"));
      }
    }

    // Styles — no-op placeholder
    // if (body.reset_styles) { }

    // Settings (preserve core keys)
    if (body.reset_settings) {
      stmts.push(db.prepare("DELETE FROM site_config WHERE key NOT IN ('app_mode','admin_email','site_name','site_region')"));
    }

    if (stmts.length > 0) {
      await db.batch(stmts);
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
