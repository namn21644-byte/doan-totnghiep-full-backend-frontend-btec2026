import { deviceRepository } from '../repositories/device.repository.js';
import { ApiError } from '../utils/apiError.js';
import { generateApiKey, hashApiKey, getApiKeyPrefix } from '../utils/apiKey.util.js';

export const deviceService = {
  async createDevice(data, ownerId) {
    const existing = await deviceRepository.findByIpAddress(data.ipAddress);
    if (existing) {
      throw ApiError.conflict('Địa chỉ IP này đã được đăng ký cho thiết bị khác');
    }

    const apiKey = generateApiKey();

    const device = await deviceRepository.create({
      ...data,
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: getApiKeyPrefix(apiKey),
      ownerId
    });

    return {
      device: sanitizeDevice(device),
      apiKey
    };
  },

  async listDevices(query) {
    const { items, total } = await deviceRepository.list(query);
    return {
      items: items.map(sanitizeDevice),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  },

  async getDeviceById(id) {
    const device = await deviceRepository.findById(id);
    if (!device) throw ApiError.notFound('Không tìm thấy thiết bị');
    return sanitizeDevice(device);
  },

  async updateDevice(id, update) {
    const device = await deviceRepository.updateById(id, update);
    if (!device) throw ApiError.notFound('Không tìm thấy thiết bị');
    return sanitizeDevice(device);
  },

  async deleteDevice(id) {
    const device = await deviceRepository.deleteById(id);
    if (!device) throw ApiError.notFound('Không tìm thấy thiết bị');
    return true;
  },

  async regenerateApiKey(id) {
    const device = await deviceRepository.findById(id);
    if (!device) throw ApiError.notFound('Không tìm thấy thiết bị');

    const apiKey = generateApiKey();
    const updated = await deviceRepository.updateById(id, {
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: getApiKeyPrefix(apiKey)
    });

    return {
      device: sanitizeDevice(updated),
      apiKey
    };
  },

  async findDeviceByApiKey(apiKey) {
    const apiKeyHash = hashApiKey(apiKey);
    const device = await deviceRepository.findByApiKeyHash(apiKeyHash);
    if (!device) return null;
    return device;
  }
};

function sanitizeDevice(device) {
  return {
    id: device._id,
    name: device.name,
    ipAddress: device.ipAddress,
    hostname: device.hostname,
    osType: device.osType,
    location: device.location,
    tags: device.tags,
    apiKeyPrefix: device.apiKeyPrefix,
    status: device.status,
    ownerId: device.ownerId,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt
  };
}
