import { alertService } from '../services/alert.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const alertController = {
  list: asyncHandler(async (req, res) => {
    const result = await alertService.listAlerts(req.query);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await alertService.getAlertById(req.params.id);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const result = await alertService.updateStatus(req.params.id, req.body);
    return new ApiResponse(200, result, 'Cập nhật trạng thái alert thành công').send(res);
  })
};
