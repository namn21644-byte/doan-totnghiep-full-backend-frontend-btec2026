import { api, type ApiResponse } from "./client";
import type { PaginatedResult } from "./devices";

export interface Setting {
  id: number;
  key: string;
  value?: string | null;
  description?: string | null;
  is_public: boolean;
  updated_at?: string | null;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  ip_address?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export async function getSettings(): Promise<Setting[]> {
  const res = await api.get<ApiResponse<Setting[]>>("/settings");
  return res.data.data;
}

export async function updateSettings(
  settings: Record<string, string | null>,
): Promise<Setting[]> {
  const res = await api.put<ApiResponse<Setting[]>>("/settings", { settings });
  return res.data.data;
}

export async function listAuditLogs(params: {
  page?: number;
  page_size?: number;
  action?: string;
  user_id?: number;
} = {}): Promise<PaginatedResult<AuditLog>> {
  const res = await api.get<ApiResponse<AuditLog[]>>("/settings/audit-logs", {
    params,
  });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}
