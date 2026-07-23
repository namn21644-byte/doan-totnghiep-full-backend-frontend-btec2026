import { scanRepository } from '../repositories/scan.repository.js';
import { deviceRepository } from '../repositories/device.repository.js';
import { scanClientService } from './scanClient.service.js';
import { evaluateHostPorts } from './riskEngine.service.js';
import { alertService } from './alert.service.js';
import { ApiError } from '../utils/apiError.js';

const PRESET_PORTS = {
  quick:
    '21,22,23,25,53,80,110,135,139,143,443,445,993,995,1433,3306,3389,5432,6379,8080,27017',
  full: '1-65535'
};

function buildPreset({ preset, ports, enableServiceDetection, enableOsDetection }) {
  const args = ['-sT', '-Pn', '-T4'];
  if (enableServiceDetection) args.push('-sV');
  if (enableOsDetection) args.push('-O');

  const resolvedPorts = preset === 'custom' ? ports : PRESET_PORTS[preset];

  return { type: preset, ports: resolvedPorts, arguments: args };
}

export const scanService = {
  async createAndRunScan(body, userId) {
    const device = await deviceRepository.findById(body.deviceId);
    if (!device) throw ApiError.notFound('Không tìm thấy thiết bị');
    if (device.status !== 'active') {
      throw ApiError.badRequest('Thiết bị không ở trạng thái active, không thể quét');
    }

    const scanPreset = buildPreset(body);

    const scan = await scanRepository.create({
      deviceId: device._id,
      createdBy: userId,
      targetIp: device.ipAddress,
      scanPreset,
      status: 'running',
      startedAt: new Date()
    });

    try {
      const flaskResponse = await scanClientService.runScan({
        scanId: scan._id.toString(),
        target: device.ipAddress,
        ports: scanPreset.ports,
        arguments: scanPreset.arguments,
        timeoutSeconds: scanPreset.type === 'full' ? 900 : 300
      });

      const resultsPayload = [];
      for (const hostResult of flaskResponse.data.results) {
        const { enrichedPorts, riskSummary } = await evaluateHostPorts(hostResult.ports);
        resultsPayload.push({
          scanId: scan._id,
          deviceId: device._id,
          hostIp: hostResult.hostIp,
          hostStatus: hostResult.hostStatus,
          ports: enrichedPorts,
          osGuess: hostResult.osGuess,
          riskSummary
        });
      }

      let savedResults = [];
      if (resultsPayload.length > 0) {
        savedResults = await scanRepository.saveResults(resultsPayload);
      }

      for (const result of savedResults) {
        await alertService.generateFromScanResult(result);
      }

      const updatedScan = await scanRepository.updateById(scan._id, {
        status: 'completed',
        finishedAt: new Date()
      });

      return { scan: updatedScan, results: savedResults };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Lỗi không xác định từ Scan Service';

      await scanRepository.updateById(scan._id, {
        status: 'failed',
        errorMessage: message,
        finishedAt: new Date()
      });

      throw ApiError.badRequest(`Quét thất bại: ${message}`);
    }
  },

  async listScans(query) {
    const { items, total } = await scanRepository.list(query);
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

  async getScanDetail(id) {
    const scan = await scanRepository.findById(id);
    if (!scan) throw ApiError.notFound('Không tìm thấy scan');
    const results = await scanRepository.findResultsByScanId(id);
    return { scan, results };
  },

  async cancelScan(id) {
    const scan = await scanRepository.findById(id);
    if (!scan) throw ApiError.notFound('Không tìm thấy scan');
    if (scan.status !== 'running') {
      throw ApiError.badRequest('Chỉ có thể huỷ scan đang ở trạng thái running');
    }

    await scanClientService.cancelScan(id);

    return scanRepository.updateById(id, {
      status: 'cancelled',
      finishedAt: new Date()
    });
  }
};
