// GET    /api/admin/backup-schedules/:id?action=generate-script — regenerate scripts
// PUT    /api/admin/backup-schedules/:id — update schedule
// DELETE /api/admin/backup-schedules/:id — delete schedule

import { generateWorkerScript } from '../../../lib/script-generator.js';

export async function onRequestGet(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const { id } = context.params;
  const url = new URL(context.request.url);

  if (url.searchParams.get('action') === 'generate-script') {
    try {
      const schedule = await db.prepare('SELECT * FROM backup_schedules WHERE id = ?').bind(id).first();
      if (!schedule) return Response.json({ error: 'Not found' }, { status: 404 });

      const { workerScript, wranglerToml } = generateWorkerScript(schedule);
      return Response.json({ workerScript, wranglerToml });
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return Response.json({ error: 'Not found' }, { status: 404 });
}

export async function onRequestPut(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const { id } = context.params;

  try {
    const body = await context.request.json();
    const { label, cron, backup_type, retention_days, active, encryption_key_hint } = body;

    await db.prepare(
      'UPDATE backup_schedules SET label = ?, cron = ?, backup_type = ?, retention_days = ?, active = ?, encryption_key_hint = ? WHERE id = ?'
    ).bind(
      label,
      cron,
      backup_type,
      retention_days,
      active !== undefined ? (active ? 1 : 0) : 1,
      encryption_key_hint || null,
      id
    ).run();

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;
  const { id } = context.params;

  try {
    await db.prepare('DELETE FROM backup_schedules WHERE id = ?').bind(id).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
