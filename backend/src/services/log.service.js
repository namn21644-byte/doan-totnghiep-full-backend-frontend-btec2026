import { logRepository } from '../repositories/log.repository.js';
import { alertService } from './alert.service.js';

export const logService = {
  async ingestLogs(deviceId, logs) {
    const documents = logs.map((log) => ({
      ...log,
      deviceId,
      receivedAt: new Date()
    }));

    const inserted = await logRepository.insertMany(documents);

    for (const log of inserted) {
      await alertService.generateFromLog(log);
    }

    return { inserted: inserted.length };
  },

  async listLogs(query) {
    const { items, total } = await logRepository.list(query);
    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  }
};
