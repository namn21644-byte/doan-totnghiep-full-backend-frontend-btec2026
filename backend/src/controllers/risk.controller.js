import { riskService } from '../services/risk.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const riskController = {
  overview: asyncHandler(async (req, res) => {
    const result = await riskService.getOverview(req.query);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  reEvaluate: asyncHandler(async (req, res) => {
    const result = await riskService.reEvaluateScan(req.params.scanId);
    return new ApiResponse(200, result, 'Đã đánh giá lại rủi ro cho scan này').send(res);
  })
};
