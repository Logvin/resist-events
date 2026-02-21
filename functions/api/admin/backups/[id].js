// GET    /api/admin/backups/:id — download backup file
// DELETE /api/admin/backups/:id — delete backup

export async function onRequestGet(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const bucket = context.env.FLYER_BUCKET;
  const { id } = context.params;

  try {
    const backup = await db.prepare('SELECT * FROM backups WHERE id = ?').bind(id).first();
    if (!backup) return Response.json({ error: 'Not found' }, { status: 404 });

    if (!bucket) return Response.json({ error: 'Storage not configured' }, { status: 503 });

    const object = await bucket.get(backup.filename);
    if (!object) return Response.json({ error: 'File not found in storage' }, { status: 404 });

    const safeFilename = backup.filename.split('/').pop();
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': String(backup.size_bytes || ''),
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const bucket = context.env.FLYER_BUCKET;
  const { id } = context.params;

  try {
    const backup = await db.prepare('SELECT * FROM backups WHERE id = ?').bind(id).first();
    if (!backup) return Response.json({ error: 'Not found' }, { status: 404 });

    if (bucket) {
      await bucket.delete(backup.filename);
    }

    await db.prepare('DELETE FROM backups WHERE id = ?').bind(id).run();

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
