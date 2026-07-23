import { api, type ApiResponse } from "./client";
import type { PaginatedResult } from "./devices";

export interface LogEntry {
  id: number;
  device_id?: number | null;
  log_type: string;
  severity: string;
  source?: string | null;
  message: string;
  event_id?: string | null;
  logged_at: string;
  created_at: string;
}

export interface LogListParams {
  page?: number;
  page_size?: number;
  search?: string;
  severity?: string;
  log_type?: string;
  device_id?: number;
  from_date?: string;
  to_date?: string;
}

export async function listLogs(
  params: LogListParams = {},
): Promise<PaginatedResult<LogEntry>> {
  const res = await api.get<ApiResponse<LogEntry[]>>("/logs", { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getLog(id: number): Promise<LogEntry> {
  const res = await api.get<ApiResponse<LogEntry>>(`/logs/${id}`);
  return res.data.data;
}

export async function deleteLog(id: number): Promise<void> {
  await api.delete(`/logs/${id}`);
}
