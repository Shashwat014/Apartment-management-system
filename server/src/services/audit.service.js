import AuditLog from '../models/audit-log.model.js';

export async function writeAudit({ actor, action, targetType, targetId, metadata = {} }) {
  await AuditLog.create({ actor, action, targetType, targetId, metadata });
}
