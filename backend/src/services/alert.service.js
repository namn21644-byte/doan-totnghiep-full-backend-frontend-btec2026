import { alertRepository } from '../repositories/alert.repository.js';
import { emitNewAlert } from '../sockets/alert.socket.js';
import { ApiError } from '../utils/apiError.js';

const RISK_ALERT_SEVERITIES = ['critical', 'high'];
const LOG_ALERT_SEVERITIES = ['error', 'critical'];

export const alertService = {
  async generateFromScanResult(scanResult) {
    const riskyPorts = scanResult.ports.filter((p) =>
      RISK_ALERT_SEVERITIES.includes(p.riskSeverity)
    );

    if (riskyPorts.length === 0) return null;

    const highestSeverity = riskyPorts.some((p) => p.riskSeverity === 'critical')
      ? 'critical'
      : 'high';

    const portList = riskyPorts
      .map((p) => `${p.port}/${p.protocol} (${p.service || 'unknown'}) - ${p.riskDescription}`)
      .join('; ');

    const alert = await alertRepository.create({
      sourceType: 'scan_result',
      sourceId: scanResult._id,
      deviceId: scanResult.deviceId,
      title: `Phát hiện ${riskyPorts.length} cổng rủi ro trên host ${scanResult.hostIp}`,
      description: portList,
      severity: highestSeverity,
      status: 'new'
    });

    emitNewAlert(alert);
    return alert;
  },

  async generateFromLog(log) {
    if (!LOG_ALERT_SEVERITIES.includes(log.severity)) return null;

    const alertSeverity = log.severity === 'critical' ? 'critical' : 'high';

    const alert = await alertRepository.create({
      sourceType: 'log',
      sourceId: log._id,
      deviceId: log.deviceId,
      title: `Log ${log.severity} từ thiết bị: ${log.source || log.logType}`,
      description: log.rawMessage?.slice(0, 500) || '',
      severity: alertSeverity,
      status: 'new'
    });

    emitNewAlert(alert);
    return alert;
  },

  async listAlerts(query) {
    const { items, total } = await alertRepository.list(query);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  },

  async getAlertById(id) {
    const alert = await alertRepository.findById(id);
    if (!alert) throw ApiError.notFound('Không tìm thấy alert');
    return alert;
  },

  async updateStatus(id, { status, assignedTo }) {
    const update = { status, assignedTo: assignedTo || null };
    if (status === 'resolved') {
      update.resolvedAt = new Date();
    }

    const alert = await alertRepository.updateById(id, update);
    if (!alert) throw ApiError.notFound('Không tìm thấy alert');
    return alert;
  }
};
