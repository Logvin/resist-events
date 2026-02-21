// GET  /api/admin/backup-schedules — list schedules
// POST /api/admin/backup-schedules — create schedule + generate worker script

import { generateWorkerScript } from '../../../lib/script-generator.js';

export async function onRequestGet(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;

  try {
    const { results } = await db.prepare(
      'SELECT * FROM backup_schedules ORDER BY created_at DESC'
    ).all();
    return Response.json(results);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost(context) {
  if (context.data.demoRole !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const db = context.env.RESIST_DB;

  try {
    const body = await context.request.json();
    const { label, cron, backup_type = 'full', retention_days = 30, encryption_key_hint } = body;

    if (!label || !cron) {
      return Response.json({ error: 'Label and cron are required' }, { status: 400 });
    }

    const result = await db.prepare(
      'INSERT INTO backup_schedules (label, cron, backup_type, retention_days, encryption_key_hint) VALUES (?, ?, ?, ?, ?)'
    ).bind(label, cron, backup_type, retention_days, encryption_key_hint || null).run();

    const schedule = {
      id: result.meta.last_row_id,
      label,
      cron,
      backup_type,
      retention_days,
      encryption_key_hint: encryption_key_hint || null,
      active: 1,
    };

    const { workerScript, wranglerToml } = generateWorkerScript(schedule);

    return Response.json({ ok: true, schedule, workerScript, wranglerToml });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
