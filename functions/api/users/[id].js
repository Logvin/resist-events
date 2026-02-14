// PUT    /api/users/:id — admin edit user
// DELETE /api/users/:id — admin delete user

export async function onRequestPut(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const id = context.params.id;

  if (role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const body = await context.request.json();
    const fields = [];
    const values = [];

    if (body.display_name !== undefined) { fields.push('display_name = ?'); values.push(body.display_name); }
    if (body.email !== undefined) { fields.push('email = ?'); values.push(body.email); }
    if (body.role !== undefined) { fields.push('role = ?'); values.push(body.role); }
    if (body.org_id !== undefined) { fields.push('org_id = ?'); values.push(body.org_id || null); }

    if (body.role === 'organizer' && !body.org_id) {
      return Response.json({ error: 'Organizer role requires an organization' }, { status: 400 });
    }

    if (fields.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

    return Response.json({ ok: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return Response.json({ error: 'Email already exists' }, { status: 409 });
    }
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const db = context.env.RESIST_DB;
  const role = context.data.demoRole;
  const id = context.params.id;

  if (role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
