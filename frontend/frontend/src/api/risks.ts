import { api, type ApiResponse } from "./client";
import type { PaginatedResult } from "./devices";

export interface RiskRule {
  id: number;
  name: string;
  port?: number | null;
  protocol?: string | null;
  service?: string | null;
  severity: string;
  base_score: number;
  description?: string | null;
  impact?: string | null;
  recommendation?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface RiskRuleCreatePayload {
  name: string;
  port?: number | null;
  protocol?: string | null;
  service?: string | null;
  severity: string;
  base_score?: number;
  description?: string | null;
  impact?: string | null;
  recommendation?: string | null;
  is_active?: boolean;
}

export interface RiskRuleUpdatePayload extends Partial<RiskRuleCreatePayload> {}

export interface RiskRuleListParams {
  page?: number;
  page_size?: number;
  search?: string;
  severity?: string;
  is_active?: boolean;
}

export async function listRiskRules(
  params: RiskRuleListParams = {},
): Promise<PaginatedResult<RiskRule>> {
  const res = await api.get<ApiResponse<RiskRule[]>>("/risk-rules", { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getRiskRule(id: number): Promise<RiskRule> {
  const res = await api.get<ApiResponse<RiskRule>>(`/risk-rules/${id}`);
  return res.data.data;
}

export async function createRiskRule(
  payload: RiskRuleCreatePayload,
): Promise<RiskRule> {
  const res = await api.post<ApiResponse<RiskRule>>("/risk-rules", payload);
  return res.data.data;
}

export async function updateRiskRule(
  id: number,
  payload: RiskRuleUpdatePayload,
): Promise<RiskRule> {
  const res = await api.put<ApiResponse<RiskRule>>(`/risk-rules/${id}`, payload);
  return res.data.data;
}

export async function deleteRiskRule(id: number): Promise<void> {
  await api.delete(`/risk-rules/${id}`);
}

export async function importRiskRules(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post<
    ApiResponse<{ created: number; updated: number; skipped: number }>
  >("/risk-rules/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}
