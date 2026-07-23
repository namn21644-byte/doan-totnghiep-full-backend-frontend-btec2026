import { getIO } from './index.js';
import { logger } from '../config/logger.js';

export function emitNewAlert(alert) {
  const io = getIO();
  if (!io) return;

  io.emit('alert:new', {
    id: alert._id,
    title: alert.title,
    severity: alert.severity,
    deviceId: alert.deviceId,
    sourceType: alert.sourceType,
    createdAt: alert.createdAt
  });

  logger.info(`Emitted alert:new - ${alert.title} [${alert.severity}]`);
}
