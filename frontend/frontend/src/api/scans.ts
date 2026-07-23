import { api, type ApiResponse } from "./client";
import type { PaginatedResult } from "./devices";

export interface Scan {
  id: number;
  created_by: number;
  device_id?: number | null;
  target_ip: string;
  scan_type: string;
  ports?: string | null;
  scan_params?: Record<string, unknown> | null;
  status: string;
  progress: number;
  started_at?: string | null;
  completed_at?: string | null;
  duration_seconds?: number | null;
  error_message?: string | null;
  hosts_found: number;
  open_ports_count: number;
  risk_critical: number;
  risk_high: number;
  risk_medium: number;
  risk_low: number;
  risk_info: number;
  is_mock: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface PortFinding {
  id: number;
  port: number;
  protocol: string;
  state: string;
  service_name?: string | null;
  product?: string | null;
  version?: string | null;
  cpe?: string | null;
  risk_score: number;
  risk_severity: string;
  risk_description?: string | null;
  recommendation?: string | null;
}

export interface ScanResult {
  id: number;
  ip_address: string;
  hostname?: string | null;
  host_status?: string | null;
  os_guess?: string | null;
  risk_score: number;
  port_findings: PortFinding[];
}

export interface ScanResultsResponse {
  scan: Scan;
  results: ScanResult[];
}

export interface ScanCreatePayload {
  target_ip: string;
  scan_type: string;
  device_id?: number | null;
  ports?: string | null;
  scan_params?: Record<string, unknown> | null;
}

export interface ScanListParams {
  page?: number;
  page_size?: number;
  status?: string;
  scan_type?: string;
  device_id?: number;
}

export async function listScans(
  params: ScanListParams = {},
): Promise<PaginatedResult<Scan>> {
  const res = await api.get<ApiResponse<Scan[]>>("/scans", { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getScan(id: number): Promise<Scan> {
  const res = await api.get<ApiResponse<Scan>>(`/scans/${id}`);
  return res.data.data;
}

export async function createScan(payload: ScanCreatePayload): Promise<Scan> {
  const res = await api.post<ApiResponse<Scan>>("/scans", payload);
  return res.data.data;
}

export async function cancelScan(id: number): Promise<Scan> {
  const res = await api.patch<ApiResponse<Scan>>(`/scans/${id}/cancel`);
  return res.data.data;
}

export async function retryScan(id: number): Promise<Scan> {
  const res = await api.post<ApiResponse<Scan>>(`/scans/${id}/retry`);
  return res.data.data;
}

export async function getScanResults(id: number): Promise<ScanResultsResponse> {
  const res = await api.get<ApiResponse<ScanResultsResponse>>(
    `/scans/${id}/results`,
  );
  return res.data.data;
}

export async function compareScans(scanA: number, scanB: number) {
  const res = await api.get<ApiResponse<Record<string, unknown>>>("/scans/compare", {
    params: { scan_a: scanA, scan_b: scanB },
  });
  return res.data.data;
}
