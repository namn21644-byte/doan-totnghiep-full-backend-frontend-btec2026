import { riskRuleService } from '../services/riskRule.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const riskRuleController = {
  create: asyncHandler(async (req, res) => {
    const result = await riskRuleService.createRule(req.body, req.user.id);
    return new ApiResponse(201, result, 'Tạo risk rule thành công').send(res);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await riskRuleService.listRules(req.query);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await riskRuleService.getRuleById(req.params.id);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  update: asyncHandler(async (req, res) => {
    const result = await riskRuleService.updateRule(req.params.id, req.body);
    return new ApiResponse(200, result, 'Cập nhật risk rule thành công').send(res);
  }),

  remove: asyncHandler(async (req, res) => {
    await riskRuleService.deleteRule(req.params.id);
    return new ApiResponse(200, null, 'Xoá risk rule thành công').send(res);
  }),

  seedDefaults: asyncHandler(async (req, res) => {
    const result = await riskRuleService.seedDefaults(req.user.id);
    return new ApiResponse(
      201,
      { inserted: result.length },
      'Đã seed risk rules mặc định'
    ).send(res);
  })
};
