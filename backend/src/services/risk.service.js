import { scanRepository } from '../repositories/scan.repository.js';
import { evaluateHostPorts } from './riskEngine.service.js';
import { ApiError } from '../utils/apiError.js';

export const riskService = {
  async getOverview(query) {
    return scanRepository.getRiskOverview(query);
  },

  async reEvaluateScan(scanId) {
    const results = await scanRepository.findResultsByScanId(scanId);
    if (!results || results.length === 0) {
      throw ApiError.notFound('Không tìm thấy kết quả quét cho scanId này');
    }

    const updated = [];
    for (const result of results) {
      const { enrichedPorts, riskSummary } = await evaluateHostPorts(result.ports);
      const saved = await scanRepository.updatePortsAndSummary(
        result._id,
        enrichedPorts,
        riskSummary
      );
      updated.push(saved);
    }

    return { scanId, reEvaluatedHosts: updated.length, results: updated };
  }
};
