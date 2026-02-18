// PUT    /api/orgs/:id — admin edit any org
// DELETE /api/orgs/:id — admin delete org

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

    if (body.name !== undefined) { fields.push('name = ?'); values.push(body.name); }
    if (body.abbreviation !== undefined) { fields.push('abbreviation = ?'); values.push(body.abbreviation); }
    if (body.website !== undefined) { fields.push('website = ?'); values.push(body.website); }
    if (body.socials !== undefined) { fields.push('socials = ?'); values.push(JSON.stringify(body.socials)); }
    if (body.logo_url !== undefined) { fields.push('logo_url = ?'); values.push(body.logo_url || null); }
    if (body.qr_url !== undefined) { fields.push('qr_url = ?'); values.push(body.qr_url || null); }
    if (body.city !== undefined) { fields.push('city = ?'); values.push(body.city || null); }
    if (body.mission_statement !== undefined) { fields.push('mission_statement = ?'); values.push(body.mission_statement || null); }
    if (body.can_self_publish !== undefined) { fields.push('can_self_publish = ?'); values.push(body.can_self_publish ? 1 : 0); }
    if (body.can_cross_publish !== undefined) { fields.push('can_cross_publish = ?'); values.push(body.can_cross_publish ? 1 : 0); }

    if (fields.length === 0) {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    await db.prepare(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

    return Response.json({ ok: true });
  } catch (e) {
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
    await db.prepare('DELETE FROM organizations WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
