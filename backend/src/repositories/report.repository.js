import { ReportModel } from '../models/report.model.js';

export const reportRepository = {
  async create(data) {
    return ReportModel.create(data);
  },

  async findById(id) {
    return ReportModel.findById(id).select('+filePath');
  },

  async list({ page, limit, type }) {
    const filter = {};
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      ReportModel.find(filter)
        .populate('generatedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ReportModel.countDocuments(filter)
    ]);

    return { items, total };
  }
};
