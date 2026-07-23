import { LogModel } from '../models/log.model.js';

export const logRepository = {
  async insertMany(logs) {
    return LogModel.insertMany(logs, { ordered: false });
  },

  async list({ page, limit, deviceId, logType, severity, from, to }) {
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    if (logType) filter.logType = logType;
    if (severity) filter.severity = severity;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      LogModel.find(filter)
        .populate('deviceId', 'name ipAddress')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      LogModel.countDocuments(filter)
    ]);

    return { items, total };
  },

  async countByDevice(deviceId) {
    return LogModel.countDocuments({ deviceId });
  }
};
