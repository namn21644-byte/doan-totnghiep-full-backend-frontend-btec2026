import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Progress,
  Select,
  Skeleton,
  Table,
  Tag,
} from "antd";
import { Plus } from "lucide-react";
import { listScans, type Scan } from "@/api/scans";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/utils/format";

const STATUS_OPTIONS = [
  { value: "queued", label: "Queued" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const TYPE_OPTIONS = [
  { value: "quick", label: "Quick" },
  { value: "standard", label: "Standard" },
  { value: "full", label: "Full" },
  { value: "custom", label: "Custom" },
];

const STATUS_COLORS: Record<string, string> = {
  queued: "default",
  validating: "processing",
  running: "blue",
  parsing: "cyan",
  analyzing: "purple",
  completed: "green",
  failed: "red",
  cancelled: "orange",
  timeout: "red",
};

export default function ScansPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState<string | undefined>();
  const [scanType, setScanType] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["scans", page, pageSize, status, scanType],
    queryFn: () =>
      listScans({ page, page_size: pageSize, status, scan_type: scanType }),
  });

  const columns = useMemo(
    () => [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        render: (id: number) => (
          <Link to={`/scans/${id}`} className="text-brand-600 hover:underline">
            #{id}
          </Link>
        ),
      },
      { title: "Mục tiêu", dataIndex: "target_ip", key: "target" },
      { title: "Loại", dataIndex: "scan_type", key: "type" },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (s: string) => <Tag color={STATUS_COLORS[s] ?? "default"}>{s}</Tag>,
      },
      {
        title: "Tiến độ",
        dataIndex: "progress",
        key: "progress",
        render: (p: number, record: Scan) => (
          <Progress
            percent={p}
            size="small"
            status={record.status === "failed" ? "exception" : undefined}
          />
        ),
      },
      { title: "Cổng mở", dataIndex: "open_ports_count", key: "ports" },
      { title: "Thời gian", dataIndex: "created_at", key: "created", render: formatDateTime },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Phiên quét</h1>
          <p className="text-sm text-slate-500">Lịch sử và trạng thái các phiên quét Nmap</p>
        </div>
        <Link to="/scans/create">
          <Button type="primary" icon={<Plus size={16} />}>
            Tạo phiên quét
          </Button>
        </Link>
      </div>

      <Card className="dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap gap-3">
          <Select
            placeholder="Trạng thái"
            allowClear
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            className="min-w-[160px]"
          />
          <Select
            placeholder="Loại quét"
            allowClear
            options={TYPE_OPTIONS}
            value={scanType}
            onChange={(v) => {
              setScanType(v);
              setPage(1);
            }}
            className="min-w-[160px]"
          />
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !data?.items.length ? (
          <EmptyState
            description="Chưa có phiên quét"
            action={
              <Link to="/scans/create">
                <Button type="primary">Tạo phiên quét đầu tiên</Button>
              </Link>
            }
          />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data.items}
            pagination={{
              current: page,
              pageSize,
              total: data.meta.total,
              showSizeChanger: true,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </div>
  );
}
