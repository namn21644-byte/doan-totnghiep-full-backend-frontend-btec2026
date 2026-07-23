import type { ReactNode } from "react";
import { Empty } from "antd";

export default function EmptyState({
  description = "Không có dữ liệu",
  action,
}: {
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-12">
      <Empty description={description}>
        {action}
      </Empty>
    </div>
  );
}
