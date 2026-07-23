import { api, type ApiResponse } from "./client";

export interface ScenarioStep {
  key: string;
  label: string;
  delay_seconds: number;
}

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  severity: string;
  duration_seconds: number;
  target_device_name: string;
  tags: string[];
  steps: ScenarioStep[];
}

export interface AttackRunStep {
  key: string;
  label: string;
  status: string;
  completed_at?: string | null;
}

export interface AttackRun {
  run_id: string;
  scenario_id: string;
  scenario_name: string;
  status: string;
  progress: number;
  current_step?: string | null;
  steps: AttackRunStep[];
  is_simulation: boolean;
  created_alert_ids: number[];
  created_log_ids: number[];
  scan_id?: number | null;
  message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export async function listScenarios(): Promise<AttackScenario[]> {
  const res = await api.get<ApiResponse<AttackScenario[]>>("/demo/attack/scenarios");
  return res.data.data;
}

export async function runScenario(scenarioId: string): Promise<AttackRun> {
  const res = await api.post<ApiResponse<AttackRun>>(`/demo/attack/run/${scenarioId}`);
  return res.data.data;
}

export async function getRunStatus(runId: string): Promise<AttackRun> {
  const res = await api.get<ApiResponse<AttackRun>>(`/demo/attack/runs/${runId}`);
  return res.data.data;
}
