import mongoose from 'mongoose';
import { ScanModel } from '../models/scan.model.js';
import { ScanResultModel } from '../models/scanResult.model.js';

export const scanRepository = {
  async create(data) {
    return ScanModel.create(data);
  },

  async findById(id) {
    return ScanModel.findById(id);
  },

  async updateById(id, update) {
    return ScanModel.findByIdAndUpdate(id, update, { new: true });
  },

  async list({ page, limit, deviceId, status }) {
    const filter = {};
    if (deviceId) filter.deviceId = deviceId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ScanModel.find(filter)
        .populate('deviceId', 'name ipAddress')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ScanModel.countDocuments(filter)
    ]);

    return { items, total };
  },

  async saveResults(results) {
    return ScanResultModel.insertMany(results);
  },

  async findResultsByScanId(scanId) {
    return ScanResultModel.find({ scanId });
  },

  async updatePortsAndSummary(resultId, ports, riskSummary) {
    return ScanResultModel.findByIdAndUpdate(
      resultId,
      { ports, riskSummary },
      { new: true }
    );
  },

  async getRiskOverview({ deviceId }) {
    const matchStage = deviceId
      ? { deviceId: new mongoose.Types.ObjectId(deviceId) }
      : {};

    const [severityAgg, topRiskyDevices, topRiskyPorts, totalHostsScanned] = await Promise.all([
      ScanResultModel.aggregate([
        { $match: matchStage },
        { $unwind: '$ports' },
        { $group: { _id: '$ports.riskSeverity', count: { $sum: 1 } } }
      ]),
      ScanResultModel.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$deviceId',
            totalScore: { $sum: '$riskSummary.totalScore' },
            scansCount: { $sum: 1 }
          }
        },
        { $sort: { totalScore: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'devices',
            localField: '_id',
            foreignField: '_id',
            as: 'device'
          }
        },
        { $unwind: '$device' },
        {
          $project: {
            _id: 0,
            deviceId: '$_id',
            deviceName: '$device.name',
            ipAddress: '$device.ipAddress',
            totalScore: 1,
            scansCount: 1
          }
        }
      ]),
      ScanResultModel.aggregate([
        { $match: matchStage },
        { $unwind: '$ports' },
        {
          $group: {
            _id: { port: '$ports.port', service: '$ports.service' },
            occurrences: { $sum: 1 },
            avgScore: { $avg: '$ports.riskScore' }
          }
        },
        { $sort: { avgScore: -1, occurrences: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            port: '$_id.port',
            service: '$_id.service',
            occurrences: 1,
            avgScore: { $round: ['$avgScore', 1] }
          }
        }
      ]),
      ScanResultModel.countDocuments(matchStage)
    ]);

    const severityDistribution = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    severityAgg.forEach((s) => {
      if (s._id && severityDistribution[s._id] !== undefined) {
        severityDistribution[s._id] = s.count;
      }
    });

    return { totalHostsScanned, severityDistribution, topRiskyDevices, topRiskyPorts };
  },

  async findForReport({ deviceId, from, to }) {
    const filter = { status: 'completed' };
    if (deviceId) filter.deviceId = deviceId;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    return ScanModel.find(filter).populate('deviceId', 'name ipAddress').sort({ createdAt: -1 });
  },

  async findResultsByScanIds(scanIds) {
    return ScanResultModel.find({ scanId: { $in: scanIds } });
  }
};
