import { api, type ApiResponse } from "./client";

export interface PaginatedMeta {
  page: number;
  page_size: number;
  total: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface Tag {
  id: number;
  name: string;
  color?: string | null;
}

export interface Device {
  id: number;
  name: string;
  ip_address: string;
  hostname?: string | null;
  os_type?: string | null;
  mac_address?: string | null;
  location?: string | null;
  department?: string | null;
  manager_name?: string | null;
  status: string;
  risk_score: number;
  open_ports_count: number;
  alerts_count: number;
  last_scan_at?: string | null;
  last_agent_at?: string | null;
  api_key_prefix?: string | null;
  notes?: string | null;
  tags: Tag[];
  created_at: string;
  updated_at?: string | null;
}

export interface DeviceCreatePayload {
  name: string;
  ip_address: string;
  hostname?: string;
  os_type?: string;
  mac_address?: string;
  location?: string;
  department?: string;
  manager_name?: string;
  status?: string;
  notes?: string;
  tag_ids?: number[];
  generate_api_key?: boolean;
}

export interface DeviceUpdatePayload extends Partial<DeviceCreatePayload> {}

export interface DeviceListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  tag_id?: number;
  department?: string;
}

export interface TestConnectionResult {
  device_id: number;
  ip_address: string;
  reachable: boolean;
  latency_ms?: number | null;
  detail: string;
}

export async function listDevices(
  params: DeviceListParams = {},
): Promise<PaginatedResult<Device>> {
  const res = await api.get<ApiResponse<Device[]>>("/devices", { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getDevice(id: number): Promise<Device> {
  const res = await api.get<ApiResponse<Device>>(`/devices/${id}`);
  return res.data.data;
}

export async function createDevice(
  payload: DeviceCreatePayload,
): Promise<{ device: Device; api_key?: string | null }> {
  const res = await api.post<
    ApiResponse<{ device: Device; api_key?: string | null }>
  >("/devices", payload);
  return res.data.data;
}

export async function updateDevice(
  id: number,
  payload: DeviceUpdatePayload,
): Promise<Device> {
  const res = await api.put<ApiResponse<Device>>(`/devices/${id}`, payload);
  return res.data.data;
}

export async function deleteDevice(id: number): Promise<void> {
  await api.delete(`/devices/${id}`);
}

export async function regenerateDeviceKey(
  id: number,
): Promise<{ api_key: string; api_key_prefix?: string | null }> {
  const res = await api.post<
    ApiResponse<{ api_key: string; api_key_prefix?: string | null }>
  >(`/devices/${id}/regenerate-key`);
  return res.data.data;
}

export async function testDeviceConnection(
  id: number,
): Promise<TestConnectionResult> {
  const res = await api.post<ApiResponse<TestConnectionResult>>(
    `/devices/${id}/test-connection`,
  );
  return res.data.data;
}

export async function exportDevices(): Promise<Blob> {
  const res = await api.get("/devices/export", { responseType: "blob" });
  return res.data;
}

export async function getDeviceScans(
  id: number,
  params: { page?: number; page_size?: number } = {},
) {
  const res = await api.get<ApiResponse<import("./scans").Scan[]>>(
    `/devices/${id}/scans`,
    { params },
  );
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getDeviceAlerts(
  id: number,
  params: { page?: number; page_size?: number } = {},
) {
  const res = await api.get<ApiResponse<import("./alerts").Alert[]>>(
    `/devices/${id}/alerts`,
    { params },
  );
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getDeviceLogs(
  id: number,
  params: { page?: number; page_size?: number } = {},
) {
  const res = await api.get<ApiResponse<import("./logs").LogEntry[]>>(
    `/devices/${id}/logs`,
    { params },
  );
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}
