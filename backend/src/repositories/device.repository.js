import { DeviceModel } from '../models/device.model.js';

export const deviceRepository = {
  async create(data) {
    return DeviceModel.create(data);
  },

  async findById(id) {
    return DeviceModel.findById(id);
  },

  async findByIdWithKeyHash(id) {
    return DeviceModel.findById(id).select('+apiKeyHash');
  },

  async findByIpAddress(ipAddress) {
    return DeviceModel.findOne({ ipAddress });
  },

  async findByApiKeyHash(apiKeyHash) {
    return DeviceModel.findOne({ apiKeyHash }).select('+apiKeyHash');
  },

  async list({ page, limit, search, status, osType }) {
    const filter = {};

    if (status) filter.status = status;
    if (osType) filter.osType = osType;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } },
        { hostname: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      DeviceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      DeviceModel.countDocuments(filter)
    ]);

    return { items, total };
  },

  async updateById(id, update) {
    return DeviceModel.findByIdAndUpdate(id, update, { new: true });
  },

  async deleteById(id) {
    return DeviceModel.findByIdAndDelete(id);
  }
};
