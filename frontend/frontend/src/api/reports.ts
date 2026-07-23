import { api, type ApiResponse } from "./client";
import type { PaginatedResult } from "./devices";

export interface ReportFile {
  id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Report {
  id: number;
  created_by: number;
  report_type: string;
  title: string;
  format: string;
  status: string;
  filters?: Record<string, unknown> | null;
  error_message?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  files: ReportFile[];
}

export interface ReportGeneratePayload {
  report_type: string;
  title: string;
  format: string;
  filters?: Record<string, unknown> | null;
}

export interface ReportListParams {
  page?: number;
  page_size?: number;
  report_type?: string;
  status?: string;
}

export async function listReports(
  params: ReportListParams = {},
): Promise<PaginatedResult<Report>> {
  const res = await api.get<ApiResponse<Report[]>>("/reports", { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getReport(id: number): Promise<Report> {
  const res = await api.get<ApiResponse<Report>>(`/reports/${id}`);
  return res.data.data;
}

export async function generateReport(
  payload: ReportGeneratePayload,
): Promise<Report> {
  const res = await api.post<ApiResponse<Report>>("/reports/generate", payload);
  return res.data.data;
}

export async function downloadReport(id: number): Promise<Blob> {
  const res = await api.get(`/reports/${id}/download`, {
    responseType: "blob",
  });
  return res.data;
}

export async function deleteReport(id: number): Promise<void> {
  await api.delete(`/reports/${id}`);
}
