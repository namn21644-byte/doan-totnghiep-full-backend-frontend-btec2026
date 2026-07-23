import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Skeleton,
  Table,
  Tag,
} from "antd";
import { Search } from "lucide-react";
import type { Dayjs } from "dayjs";
import { listLogs, type LogEntry } from "@/api/logs";
import EmptyState from "@/components/EmptyState";
import SeverityBadge from "@/components/SeverityBadge";
import { formatDateTime } from "@/utils/format";

const LOG_TYPES = [
  { value: "agent", label: "Agent" },
  { value: "system", label: "System" },
  { value: "audit", label: "Audit" },
  { value: "scan", label: "Scan" },
];

const LOG_SEVERITIES = [
  { value: "debug", label: "Debug" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
  { value: "critical", label: "Critical" },
];

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [severity, setSeverity] = useState<string | undefined>();
  const [logType, setLogType] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["logs", page, pageSize, search, severity, logType, dateRange],
    queryFn: () =>
      listLogs({
        page,
        page_size: pageSize,
        search,
        severity,
        log_type: logType,
        from_date: dateRange?.[0]?.toISOString(),
        to_date: dateRange?.[1]?.toISOString(),
      }),
  });

  const columns = useMemo(
    () => [
      {
        title: "Thời gian",
        dataIndex: "logged_at",
        key: "time",
        width: 170,
        render: formatDateTime,
      },
      {
        title: "Loại",
        dataIndex: "log_type",
        key: "type",
        width: 90,
        render: (t: string) => <Tag>{t}</Tag>,
      },
      {
        title: "Mức",
        dataIndex: "severity",
        key: "severity",
        width: 100,
        render: (s: string) => <SeverityBadge severity={s} />,
      },
      { title: "Nguồn", dataIndex: "source", key: "source", width: 120, render: (v: string) => v ?? "—" },
      {
        title: "Thiết bị",
        dataIndex: "device_id",
        key: "device",
        width: 90,
        render: (id: number) => (id ? `#${id}` : "—"),
      },
      { title: "Nội dung", dataIndex: "message", key: "message", ellipsis: true },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Log</h1>
        <p className="text-sm text-slate-500">Trình xem log hệ thống và agent</p>
      </div>

      <Card className="dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Tìm trong nội dung log..."
            prefix={<Search size={16} className="text-slate-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => {
              setSearch(searchInput);
              setPage(1);
            }}
            className="max-w-sm"
            allowClear
          />
          <Select
            placeholder="Loại log"
            allowClear
            options={LOG_TYPES}
            value={logType}
            onChange={(v) => {
              setLogType(v);
              setPage(1);
            }}
            className="min-w-[130px]"
          />
          <Select
            placeholder="Mức độ"
            allowClear
            options={LOG_SEVERITIES}
            value={severity}
            onChange={(v) => {
              setSeverity(v);
              setPage(1);
            }}
            className="min-w-[130px]"
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              setPage(1);
            }}
          />
          <Button
            type="primary"
            onClick={() => {
              setSearch(searchInput);
              setPage(1);
            }}
          >
            Tìm kiếm
          </Button>
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : !data?.items.length ? (
          <EmptyState description="Không tìm thấy log" />
        ) : (
          <Table<LogEntry>
            rowKey="id"
            columns={columns}
            dataSource={data.items}
            size="small"
            pagination={{
              current: page,
              pageSize,
              total: data.meta.total,
              showSizeChanger: true,
              pageSizeOptions: ["20", "30", "50", "100"],
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
