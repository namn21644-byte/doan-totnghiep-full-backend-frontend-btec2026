import { logService } from '../services/log.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const logController = {
  ingest: asyncHandler(async (req, res) => {
    const result = await logService.ingestLogs(req.device.id, req.body.logs);
    return new ApiResponse(201, result, 'Đã ghi nhận log').send(res);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await logService.listLogs(req.query);
    return new ApiResponse(200, result, 'OK').send(res);
  })
};
