// Audit logging helper
// Logs admin/write actions to the audit_log table.
// Failures are swallowed — audit logging must never break the main operation.

export async function auditLog(db, { userId, action, targetType, targetId, detail }) {
  try {
    await db.prepare(
      'INSERT INTO audit_log (user_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      userId || null,
      action,
      targetType || null,
      targetId || null,
      detail ? JSON.stringify(detail) : null
    ).run();
  } catch (e) {
    console.error('audit_log write failed:', e.message);
  }
}
