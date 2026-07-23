import { deviceService } from '../services/device.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const deviceController = {
  create: asyncHandler(async (req, res) => {
    const result = await deviceService.createDevice(req.body, req.user.id);
    return new ApiResponse(
      201,
      result,
      'Tạo thiết bị thành công. Lưu lại API Key ngay vì sẽ không hiển thị lại.'
    ).send(res);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await deviceService.listDevices(req.query);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  getById: asyncHandler(async (req, res) => {
    const result = await deviceService.getDeviceById(req.params.id);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  update: asyncHandler(async (req, res) => {
    const result = await deviceService.updateDevice(req.params.id, req.body);
    return new ApiResponse(200, result, 'Cập nhật thiết bị thành công').send(res);
  }),

  remove: asyncHandler(async (req, res) => {
    await deviceService.deleteDevice(req.params.id);
    return new ApiResponse(200, null, 'Xoá thiết bị thành công').send(res);
  }),

  regenerateKey: asyncHandler(async (req, res) => {
    const result = await deviceService.regenerateApiKey(req.params.id);
    return new ApiResponse(
      200,
      result,
      'Cấp lại API Key thành công. Lưu lại ngay vì sẽ không hiển thị lại.'
    ).send(res);
  })
};
