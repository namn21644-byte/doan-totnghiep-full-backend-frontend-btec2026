import { Tag } from "antd";
import { severityAntdColor, severityLabel } from "@/utils/severity";

export default function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Tag color={severityAntdColor(severity)} className="font-medium">
      {severityLabel(severity)}
    </Tag>
  );
}
