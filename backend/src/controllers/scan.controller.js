import { scanService } from '../services/scan.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const scanController = {
  create: asyncHandler(async (req, res) => {
    const result = await scanService.createAndRunScan(req.body, req.user.id);
    return new ApiResponse(201, result, 'Quét hoàn tất').send(res);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await scanService.listScans(req.query);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await scanService.getScanDetail(req.params.id);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  cancel: asyncHandler(async (req, res) => {
    const result = await scanService.cancelScan(req.params.id);
    return new ApiResponse(200, result, 'Đã huỷ scan').send(res);
  })
};
