import { AlertModel } from '../models/alert.model.js';

export const alertRepository = {
  async create(data) {
    return AlertModel.create(data);
  },

  async findById(id) {
    return AlertModel.findById(id)
      .populate('deviceId', 'name ipAddress')
      .populate('assignedTo', 'fullName email');
  },

  async list({ page, limit, deviceId, severity, status, sourceType }) {
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (sourceType) filter.sourceType = sourceType;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AlertModel.find(filter)
        .populate('deviceId', 'name ipAddress')
        .populate('assignedTo', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AlertModel.countDocuments(filter)
    ]);

    return { items, total };
  },

  async updateById(id, update) {
    return AlertModel.findByIdAndUpdate(id, update, { new: true });
  },

  async findForReport({ deviceId, from, to }) {
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    return AlertModel.find(filter).populate('deviceId', 'name ipAddress').sort({ createdAt: -1 });
  }
};
