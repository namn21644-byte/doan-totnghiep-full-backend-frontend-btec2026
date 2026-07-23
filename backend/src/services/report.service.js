import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

import { reportRepository } from '../repositories/report.repository.js';
import { scanRepository } from '../repositories/scan.repository.js';
import { alertRepository } from '../repositories/alert.repository.js';
import { deviceRepository } from '../repositories/device.repository.js';
import { logRepository } from '../repositories/log.repository.js';
import { generatePdfReport } from './reportGenerators/pdf.generator.js';
import { generateXlsxReport } from './reportGenerators/xlsx.generator.js';
import { ApiError } from '../utils/apiError.js';

const REPORTS_DIR = path.join(process.cwd(), 'uploads', 'reports');

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

async function buildScanSummaryData({ deviceId, from, to }) {
  const scans = await scanRepository.findForReport({ deviceId, from, to });
  const scanIds = scans.map((s) => s._id);
  const results = scanIds.length > 0 ? await scanRepository.findResultsByScanIds(scanIds) : [];
  return { scans, results };
}

async function buildRiskSummaryData({ deviceId }) {
  return scanRepository.getRiskOverview({ deviceId });
}

async function buildDeviceReportData({ deviceId, from, to }) {
  const device = await deviceRepository.findById(deviceId);
  if (!device) throw ApiError.notFound('Không tìm thấy thiết bị để sinh báo cáo');

  const scans = await scanRepository.findForReport({ deviceId, from, to });
  const scanIds = scans.map((s) => s._id);
  const results = scanIds.length > 0 ? await scanRepository.findResultsByScanIds(scanIds) : [];
  const alerts = await alertRepository.findForReport({ deviceId, from, to });
  const logCount = await logRepository.countByDevice(deviceId);

  return { device, scans, results, alerts, logCount };
}

function scanSummaryToSections({ scans, results }) {
  const scanLines = scans.map(
    (s, idx) =>
      `${idx + 1}. ${s.deviceId?.name || 'N/A'} (${s.targetIp}) - ${s.status} - ${new Date(
        s.createdAt
      ).toLocaleString('vi-VN')}`
  );

  const portLines = [];
  results.forEach((r) => {
    portLines.push(
      `Host ${r.hostIp} - Mức cao nhất: ${r.riskSummary.highestSeverity.toUpperCase()} - Tổng điểm: ${r.riskSummary.totalScore}`
    );
    r.ports.forEach((p) => {
      portLines.push(
        `   Port ${p.port}/${p.protocol} (${p.service || 'unknown'}) - ${p.riskSeverity.toUpperCase()} (${p.riskScore}) - ${p.riskDescription}`
      );
    });
  });

  return [
    { heading: `Danh sách scan (${scans.length})`, lines: scanLines },
    { heading: 'Chi tiết rủi ro theo host', lines: portLines }
  ];
}

function riskSummaryToSections(overview) {
  const distLines = Object.entries(overview.severityDistribution).map(
    ([sev, count]) => `${sev.toUpperCase()}: ${count} cổng`
  );

  const deviceLines = overview.topRiskyDevices.map(
    (d, idx) =>
      `${idx + 1}. ${d.deviceName} (${d.ipAddress}) - Tổng điểm rủi ro: ${d.totalScore} - Số lần quét: ${d.scansCount}`
  );

  const portLines = overview.topRiskyPorts.map(
    (p, idx) =>
      `${idx + 1}. Port ${p.port} (${p.service || 'unknown'}) - Điểm TB: ${p.avgScore} - Xuất hiện: ${p.occurrences} lần`
  );

  return [
    { heading: `Tổng số host đã quét: ${overview.totalHostsScanned}`, lines: [] },
    { heading: 'Phân bố mức độ rủi ro', lines: distLines },
    { heading: 'Top 5 thiết bị rủi ro cao nhất', lines: deviceLines },
    { heading: 'Top 10 cổng rủi ro cao nhất', lines: portLines }
  ];
}

function deviceReportToSections({ device, scans, results, alerts, logCount }) {
  const infoLines = [
    `Tên thiết bị: ${device.name}`,
    `Địa chỉ IP: ${device.ipAddress}`,
    `Hệ điều hành: ${device.osType}`,
    `Trạng thái: ${device.status}`,
    `Vị trí: ${device.location || 'N/A'}`
  ];

  const scanLines = scans.map(
    (s, idx) => `${idx + 1}. ${s.status} - ${new Date(s.createdAt).toLocaleString('vi-VN')}`
  );

  const riskLines = [];
  results.forEach((r) => {
    riskLines.push(`Host ${r.hostIp} - Mức cao nhất: ${r.riskSummary.highestSeverity.toUpperCase()}`);
    r.ports.forEach((p) => {
      riskLines.push(
        `   Port ${p.port}/${p.protocol} (${p.service || 'unknown'}) - ${p.riskSeverity.toUpperCase()}`
      );
    });
  });

  const alertLines = alerts.map(
    (a, idx) => `${idx + 1}. [${a.severity.toUpperCase()}] ${a.title} - Trạng thái: ${a.status}`
  );

  return [
    { heading: 'Thông tin thiết bị', lines: infoLines },
    { heading: `Lịch sử scan (${scans.length})`, lines: scanLines },
    { heading: 'Chi tiết rủi ro', lines: riskLines },
    { heading: `Cảnh báo (${alerts.length})`, lines: alertLines },
    { heading: 'Log đã ghi nhận', lines: [`Tổng số log: ${logCount}`] }
  ];
}

function scanSummaryToSheets({ scans, results }) {
  const scanRows = scans.map((s) => ({
    device: s.deviceId?.name || 'N/A',
    targetIp: s.targetIp,
    status: s.status,
    createdAt: new Date(s.createdAt).toLocaleString('vi-VN')
  }));

  const portRows = [];
  results.forEach((r) => {
    r.ports.forEach((p) => {
      portRows.push({
        hostIp: r.hostIp,
        port: p.port,
        protocol: p.protocol,
        service: p.service || '',
        severity: p.riskSeverity,
        score: p.riskScore,
        description: p.riskDescription
      });
    });
  });

  return [
    {
      name: 'Scans',
      columns: [
        { header: 'Thiết bị', key: 'device', width: 25 },
        { header: 'IP', key: 'targetIp', width: 18 },
        { header: 'Trạng thái', key: 'status', width: 15 },
        { header: 'Thời gian', key: 'createdAt', width: 22 }
      ],
      rows: scanRows
    },
    {
      name: 'Port Risks',
      columns: [
        { header: 'Host IP', key: 'hostIp', width: 18 },
        { header: 'Port', key: 'port', width: 10 },
        { header: 'Protocol', key: 'protocol', width: 10 },
        { header: 'Service', key: 'service', width: 15 },
        { header: 'Severity', key: 'severity', width: 12 },
        { header: 'Score', key: 'score', width: 10 },
        { header: 'Description', key: 'description', width: 50 }
      ],
      rows: portRows
    }
  ];
}

function riskSummaryToSheets(overview) {
  const distRows = Object.entries(overview.severityDistribution).map(([severity, count]) => ({
    severity,
    count
  }));

  return [
    {
      name: 'Severity Distribution',
      columns: [
        { header: 'Severity', key: 'severity', width: 15 },
        { header: 'Count', key: 'count', width: 10 }
      ],
      rows: distRows
    },
    {
      name: 'Top Risky Devices',
      columns: [
        { header: 'Device', key: 'deviceName', width: 25 },
        { header: 'IP', key: 'ipAddress', width: 18 },
        { header: 'Total Score', key: 'totalScore', width: 15 },
        { header: 'Scans Count', key: 'scansCount', width: 15 }
      ],
      rows: overview.topRiskyDevices
    },
    {
      name: 'Top Risky Ports',
      columns: [
        { header: 'Port', key: 'port', width: 10 },
        { header: 'Service', key: 'service', width: 15 },
        { header: 'Avg Score', key: 'avgScore', width: 12 },
        { header: 'Occurrences', key: 'occurrences', width: 15 }
      ],
      rows: overview.topRiskyPorts
    }
  ];
}

function deviceReportToSheets({ device, scans, results, alerts, logCount }) {
  const scanRows = scans.map((s) => ({
    status: s.status,
    createdAt: new Date(s.createdAt).toLocaleString('vi-VN')
  }));

  const portRows = [];
  results.forEach((r) => {
    r.ports.forEach((p) => {
      portRows.push({
        hostIp: r.hostIp,
        port: p.port,
        service: p.service || '',
        severity: p.riskSeverity,
        score: p.riskScore
      });
    });
  });

  const alertRows = alerts.map((a) => ({
    title: a.title,
    severity: a.severity,
    status: a.status,
    createdAt: new Date(a.createdAt).toLocaleString('vi-VN')
  }));

  return [
    {
      name: 'Device Info',
      columns: [
        { header: 'Field', key: 'field', width: 20 },
        { header: 'Value', key: 'value', width: 40 }
      ],
      rows: [
        { field: 'Name', value: device.name },
        { field: 'IP', value: device.ipAddress },
        { field: 'OS', value: device.osType },
        { field: 'Status', value: device.status },
        { field: 'Total Logs', value: logCount }
      ]
    },
    {
      name: 'Scan History',
      columns: [
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'createdAt', width: 22 }
      ],
      rows: scanRows
    },
    {
      name: 'Port Risks',
      columns: [
        { header: 'Host IP', key: 'hostIp', width: 18 },
        { header: 'Port', key: 'port', width: 10 },
        { header: 'Service', key: 'service', width: 15 },
        { header: 'Severity', key: 'severity', width: 12 },
        { header: 'Score', key: 'score', width: 10 }
      ],
      rows: portRows
    },
    {
      name: 'Alerts',
      columns: [
        { header: 'Title', key: 'title', width: 40 },
        { header: 'Severity', key: 'severity', width: 12 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'createdAt', width: 22 }
      ],
      rows: alertRows
    }
  ];
}

export const reportService = {
  async generateReport(body, userId) {
    ensureReportsDir();

    const { type, format, deviceId, from, to } = body;
    const generatedAt = new Date();

    let sections = [];
    let sheets = [];
    let title = '';

    if (type === 'scan_summary') {
      const data = await buildScanSummaryData({ deviceId, from, to });
      title = 'Báo cáo tổng hợp Scan';
      sections = scanSummaryToSections(data);
      sheets = scanSummaryToSheets(data);
    } else if (type === 'risk_summary') {
      const data = await buildRiskSummaryData({ deviceId });
      title = 'Báo cáo tổng quan rủi ro';
      sections = riskSummaryToSections(data);
      sheets = riskSummaryToSheets(data);
    } else if (type === 'device_report') {
      const data = await buildDeviceReportData({ deviceId, from, to });
      title = `Báo cáo chi tiết thiết bị: ${data.device.name}`;
      sections = deviceReportToSections(data);
      sheets = deviceReportToSheets(data);
    } else {
      throw ApiError.badRequest('Loại báo cáo không được hỗ trợ');
    }

    const fileId = uuidv4();
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const fileName = `${type}-${fileId}.${extension}`;
    const filePath = path.join(REPORTS_DIR, fileName);

    if (format === 'pdf') {
      await generatePdfReport({ filePath, title, generatedAt, sections });
    } else {
      await generateXlsxReport({ filePath, sheets });
    }

    const report = await reportRepository.create({
      type,
      title,
      filters: { deviceId: deviceId || null, from: from || null, to: to || null },
      format,
      filePath,
      fileUrl: '',
      generatedBy: userId
    });

    report.fileUrl = `/api/v1/reports/${report._id}/download`;
    await report.save();

    return report;
  },

  async listReports(query) {
    const { items, total } = await reportRepository.list(query);
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

  async getReportFileForDownload(id) {
    const report = await reportRepository.findById(id);
    if (!report) throw ApiError.notFound('Không tìm thấy báo cáo');
    if (!fs.existsSync(report.filePath)) {
      throw ApiError.notFound('File báo cáo không còn tồn tại trên hệ thống');
    }
    return report;
  }
};
