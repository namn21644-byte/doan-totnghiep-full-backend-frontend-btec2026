import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  Input,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
} from "antd";
import { Plus, Search } from "lucide-react";
import { listDevices, type Device } from "@/api/devices";
import EmptyState from "@/components/EmptyState";
import SeverityBadge from "@/components/SeverityBadge";
import { formatDateTime } from "@/utils/format";
import { severityColor } from "@/utils/severity";

const STATUS_OPTIONS = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Không hoạt động" },
  { value: "maintenance", label: "Bảo trì" },
  { value: "decommissioned", label: "Ngừng sử dụng" },
];

const STATUS_COLORS: Record<string, string> = {
  active: "green",
  inactive: "default",
  maintenance: "orange",
  decommissioned: "red",
};

function riskSeverity(score: number): string {
  if (score >= 8) return "critical";
  if (score >= 6) return "high";
  if (score >= 4) return "medium";
  if (score >= 2) return "low";
  return "info";
}

export default function DevicesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [department, setDepartment] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["devices", page, pageSize, search, status, department],
    queryFn: () =>
      listDevices({ page, page_size: pageSize, search, status, department }),
  });

  const columns = useMemo(
    () => [
      {
        title: "Tên",
        dataIndex: "name",
        key: "name",
        render: (name: string, record: Device) => (
          <Link
            to={`/devices/${record.id}`}
            className="font-medium text-brand-600 hover:underline"
          >
            {name}
          </Link>
        ),
      },
      { title: "IP", dataIndex: "ip_address", key: "ip" },
      { title: "Hostname", dataIndex: "hostname", key: "hostname", render: (v: string) => v ?? "—" },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (s: string) => (
          <Tag color={STATUS_COLORS[s] ?? "default"}>{s}</Tag>
        ),
      },
      {
        title: "Rủi ro",
        dataIndex: "risk_score",
        key: "risk_score",
        render: (score: number) => (
          <Space>
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: severityColor(riskSeverity(score)) }}
            />
            <SeverityBadge severity={riskSeverity(score)} />
            <span className="text-xs text-slate-500">{score.toFixed(1)}</span>
          </Space>
        ),
      },
      { title: "Cổng mở", dataIndex: "open_ports_count", key: "ports" },
      { title: "Cảnh báo", dataIndex: "alerts_count", key: "alerts" },
      {
        title: "Quét gần nhất",
        dataIndex: "last_scan_at",
        key: "last_scan_at",
        render: formatDateTime,
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Thiết bị</h1>
          <p className="text-sm text-slate-500">
            Quản lý danh sách thiết bị trong hệ thống mạng
          </p>
        </div>
        <Button type="primary" icon={<Plus size={16} />}>
          Thêm thiết bị
        </Button>
      </div>

      <Card className="dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Tìm theo tên, IP, hostname..."
            prefix={<Search size={16} className="text-slate-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            className="max-w-xs"
            allowClear
          />
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
          <Input
            placeholder="Phòng ban"
            value={department ?? ""}
            onChange={(e) => {
              setDepartment(e.target.value || undefined);
              setPage(1);
            }}
            className="max-w-[180px]"
            allowClear
          />
          <Button
            type="primary"
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
          >
            Lọc
          </Button>
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !data?.items.length ? (
          <EmptyState description="Chưa có thiết bị nào" />
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
              showTotal: (t) => `Tổng ${t} thiết bị`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            scroll={{ x: 900 }}
          />
        )}
      </Card>
    </div>
  );
}
