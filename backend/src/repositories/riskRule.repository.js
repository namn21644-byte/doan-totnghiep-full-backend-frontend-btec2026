import { RiskRuleModel } from '../models/riskRule.model.js';

export const riskRuleRepository = {
  async create(data) {
    return RiskRuleModel.create(data);
  },

  async findById(id) {
    return RiskRuleModel.findById(id);
  },

  async findActiveRules() {
    return RiskRuleModel.find({ isActive: true });
  },

  async list({ page, limit, matchType, severity }) {
    const filter = {};
    if (matchType) filter.matchType = matchType;
    if (severity) filter.severity = severity;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      RiskRuleModel.find(filter).sort({ port: 1 }).skip(skip).limit(limit),
      RiskRuleModel.countDocuments(filter)
    ]);

    return { items, total };
  },

  async updateById(id, update) {
    return RiskRuleModel.findByIdAndUpdate(id, update, { new: true });
  },

  async deleteById(id) {
    return RiskRuleModel.findByIdAndDelete(id);
  },

  async count() {
    return RiskRuleModel.countDocuments();
  },

  async insertMany(docs) {
    return RiskRuleModel.insertMany(docs);
  }
};
