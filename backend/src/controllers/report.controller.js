import path from 'path';
import { reportService } from '../services/report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const reportController = {
  generate: asyncHandler(async (req, res) => {
    const report = await reportService.generateReport(req.body, req.user.id);
    return new ApiResponse(201, report, 'Sinh báo cáo thành công').send(res);
  }),

  list: asyncHandler(async (req, res) => {
    const result = await reportService.listReports(req.query);
    return new ApiResponse(200, result, 'OK').send(res);
  }),

  download: asyncHandler(async (req, res) => {
    const report = await reportService.getReportFileForDownload(req.params.id);
    const fileName = path.basename(report.filePath);
    res.download(report.filePath, fileName);
  })
};
