const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#16a34a",
  info: "#0284c7",
};

const SEVERITY_ANTD: Record<string, string> = {
  critical: "red",
  high: "orange",
  medium: "gold",
  low: "green",
  info: "blue",
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export function severityColor(severity: string): string {
  return SEVERITY_COLORS[severity.toLowerCase()] ?? "#64748b";
}

export function severityAntdColor(severity: string): string {
  return SEVERITY_ANTD[severity.toLowerCase()] ?? "default";
}

export function severityLabel(severity: string): string {
  return SEVERITY_LABELS[severity.toLowerCase()] ?? severity;
}

export const SEVERITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "info", label: "Info" },
];
