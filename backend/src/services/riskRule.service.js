import { riskRuleRepository } from '../repositories/riskRule.repository.js';
import { ApiError } from '../utils/apiError.js';
import { DEFAULT_RISK_RULES } from './riskEngine.service.js';

export const riskRuleService = {
  async createRule(data, userId) {
    return riskRuleRepository.create({ ...data, createdBy: userId });
  },

  async listRules(query) {
    const { items, total } = await riskRuleRepository.list(query);
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

  async getRuleById(id) {
    const rule = await riskRuleRepository.findById(id);
    if (!rule) throw ApiError.notFound('Không tìm thấy risk rule');
    return rule;
  },

  async updateRule(id, update) {
    const rule = await riskRuleRepository.updateById(id, update);
    if (!rule) throw ApiError.notFound('Không tìm thấy risk rule');
    return rule;
  },

  async deleteRule(id) {
    const rule = await riskRuleRepository.deleteById(id);
    if (!rule) throw ApiError.notFound('Không tìm thấy risk rule');
    return true;
  },

  async seedDefaults(userId) {
    const existingCount = await riskRuleRepository.count();
    if (existingCount > 0) {
      throw ApiError.conflict(
        'Risk rules đã tồn tại trong hệ thống, không thể seed lại. Vui lòng xoá thủ công nếu muốn seed mới.'
      );
    }
    const docs = DEFAULT_RISK_RULES.map((r) => ({ ...r, createdBy: userId }));
    return riskRuleRepository.insertMany(docs);
  }
};
