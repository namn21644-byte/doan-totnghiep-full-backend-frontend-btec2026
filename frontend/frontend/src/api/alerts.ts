import { api, type ApiResponse } from "./client";
import type { PaginatedResult } from "./devices";

export interface AlertComment {
  id: number;
  alert_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface Alert {
  id: number;
  device_id?: number | null;
  scan_id?: number | null;
  port_finding_id?: number | null;
  source_type: string;
  source_id?: string | null;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  assigned_to?: number | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  comments: AlertComment[];
}

export interface AlertListParams {
  page?: number;
  page_size?: number;
  search?: string;
  severity?: string;
  status?: string;
  device_id?: number;
  assigned_to?: number;
}

export async function listAlerts(
  params: AlertListParams = {},
): Promise<PaginatedResult<Alert>> {
  const res = await api.get<ApiResponse<Alert[]>>("/alerts", { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getAlert(id: number): Promise<Alert> {
  const res = await api.get<ApiResponse<Alert>>(`/alerts/${id}`);
  return res.data.data;
}

export async function updateAlertStatus(
  id: number,
  status: string,
  note?: string,
): Promise<Alert> {
  const res = await api.patch<ApiResponse<Alert>>(`/alerts/${id}/status`, {
    status,
    note,
  });
  return res.data.data;
}

export async function assignAlert(
  id: number,
  assignedTo: number,
): Promise<Alert> {
  const res = await api.patch<ApiResponse<Alert>>(`/alerts/${id}/assign`, {
    assigned_to: assignedTo,
  });
  return res.data.data;
}

export async function addAlertComment(
  id: number,
  content: string,
): Promise<AlertComment> {
  const res = await api.post<ApiResponse<AlertComment>>(
    `/alerts/${id}/comments`,
    { content },
  );
  return res.data.data;
}

export async function getAlertTimeline(id: number) {
  const res = await api.get<ApiResponse<Record<string, unknown>[]>>(
    `/alerts/${id}/timeline`,
  );
  return res.data.data;
}
