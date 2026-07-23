import { api, type ApiResponse } from "./client";

export interface DashboardSummary {
  total_devices: number;
  active_devices: number;
  total_scans: number;
  open_ports: number;
  critical_alerts: number;
  open_alerts: number;
  system_risk_score: number;
  offline_agents: number;
}

export interface RiskDistributionItem {
  severity: string;
  count: number;
  color?: string | null;
}

export interface ScanTrendItem {
  date: string;
  scans: number;
}

export interface TopRiskyDevice {
  id: number;
  name: string;
  ip_address: string;
  risk_score: number;
  open_ports_count: number;
  alerts_count: number;
}

export interface RecentAlertItem {
  id: number;
  title: string;
  severity: string;
  status: string;
  device_id?: number | null;
  created_at: string;
}

export interface RecentScanItem {
  id: number;
  target_ip: string;
  scan_type: string;
  status: string;
  progress: number;
  created_at: string;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<ApiResponse<DashboardSummary>>("/dashboard/summary");
  return res.data.data;
}

export async function getRiskDistribution(): Promise<RiskDistributionItem[]> {
  const res = await api.get<ApiResponse<RiskDistributionItem[]>>(
    "/dashboard/risk-distribution",
  );
  return res.data.data;
}

export async function getScanTrend(days = 7): Promise<ScanTrendItem[]> {
  const res = await api.get<ApiResponse<ScanTrendItem[]>>("/dashboard/scan-trend", {
    params: { days },
  });
  return res.data.data;
}

export async function getTopRiskyDevices(
  limit = 10,
): Promise<TopRiskyDevice[]> {
  const res = await api.get<ApiResponse<TopRiskyDevice[]>>(
    "/dashboard/top-risky-devices",
    { params: { limit } },
  );
  return res.data.data;
}

export async function getRecentAlerts(limit = 10): Promise<RecentAlertItem[]> {
  const res = await api.get<ApiResponse<RecentAlertItem[]>>(
    "/dashboard/recent-alerts",
    { params: { limit } },
  );
  return res.data.data;
}

export async function getRecentScans(limit = 10): Promise<RecentScanItem[]> {
  const res = await api.get<ApiResponse<RecentScanItem[]>>(
    "/dashboard/recent-scans",
    { params: { limit } },
  );
  return res.data.data;
}
