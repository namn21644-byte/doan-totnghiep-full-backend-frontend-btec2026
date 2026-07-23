import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Segmented,
  Skeleton,
  Table,
  Tag,
} from "antd";
import { LayoutGrid, List, Search } from "lucide-react";
import {
  assignAlert,
  listAlerts,
  updateAlertStatus,
  type Alert,
} from "@/api/alerts";
import { listUsers } from "@/api/users";
import EmptyState from "@/components/EmptyState";
import SeverityBadge from "@/components/SeverityBadge";
import { SEVERITY_OPTIONS } from "@/utils/severity";
import { formatDateTime } from "@/utils/format";

const STATUS_OPTIONS = [
  { value: "new", label: "Mới" },
  { value: "acknowledged", label: "Đã xác nhận" },
  { value: "investigating", label: "Đang điều tra" },
  { value: "resolved", label: "Đã xử lý" },
  { value: "ignored", label: "Bỏ qua" },
];

const KANBAN_COLUMNS = ["new", "acknowledged", "investigating", "resolved"];

export default function AlertsPage() {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [severity, setSeverity] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [assignModal, setAssignModal] = useState<Alert | null>(null);
  const [assignUserId, setAssignUserId] = useState<number | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["alerts", page, pageSize, search, severity, status],
    queryFn: () =>
      listAlerts({
        page: view === "table" ? page : 1,
        page_size: view === "kanban" ? 100 : pageSize,
        search,
        severity,
        status: view === "kanban" ? undefined : status,
      }),
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-assign"],
    queryFn: () => listUsers({ page_size: 100, is_active: true }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: string }) =>
      updateAlertStatus(id, newStatus),
    onSuccess: () => {
      message.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => message.error("Cập nhật thất bại"),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: number; userId: number }) =>
      assignAlert(id, userId),
    onSuccess: () => {
      message.success("Giao cảnh báo thành công");
      setAssignModal(null);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => message.error("Giao cảnh báo thất bại"),
  });

  const columns = useMemo(
    () => [
      { title: "Tiêu đề", dataIndex: "title", key: "title", ellipsis: true },
      {
        title: "Mức độ",
        dataIndex: "severity",
        key: "severity",
        render: (s: string) => <SeverityBadge severity={s} />,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (s: string, record: Alert) => (
          <Select
            size="small"
            value={s}
            options={STATUS_OPTIONS}
            onChange={(v) => statusMutation.mutate({ id: record.id, newStatus: v })}
            className="min-w-[140px]"
          />
        ),
      },
      {
        title: "Thiết bị",
        dataIndex: "device_id",
        key: "device",
        render: (id: number) => (id ? `#${id}` : "—"),
      },
      { title: "Thời gian", dataIndex: "created_at", key: "time", render: formatDateTime },
      {
        title: "Thao tác",
        key: "actions",
        render: (_: unknown, record: Alert) => (
          <Button size="small" onClick={() => setAssignModal(record)}>
            Giao việc
          </Button>
        ),
      },
    ],
    [statusMutation],
  );

  const grouped = useMemo(() => {
    const map: Record<string, Alert[]> = {};
    KANBAN_COLUMNS.forEach((c) => {
      map[c] = [];
    });
    data?.items.forEach((a) => {
      if (map[a.status]) map[a.status].push(a);
      else if (!map.new) map.new = [a];
    });
    return map;
  }, [data?.items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cảnh báo</h1>
          <p className="text-sm text-slate-500">Theo dõi và xử lý cảnh báo bảo mật</p>
        </div>
        <Segmented
          value={view}
          onChange={(v) => setView(v as "table" | "kanban")}
          options={[
            { value: "table", icon: <List size={14} />, label: "Bảng" },
            { value: "kanban", icon: <LayoutGrid size={14} />, label: "Kanban" },
          ]}
        />
      </div>

      <Card className="dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Tìm cảnh báo..."
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
            placeholder="Mức độ"
            allowClear
            options={SEVERITY_OPTIONS}
            value={severity}
            onChange={(v) => {
              setSeverity(v);
              setPage(1);
            }}
            className="min-w-[140px]"
          />
          {view === "table" && (
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
          )}
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
          <EmptyState description="Không có cảnh báo" />
        ) : view === "table" ? (
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
            scroll={{ x: 900 }}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {KANBAN_COLUMNS.map((col) => (
              <Col xs={24} sm={12} lg={6} key={col}>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-3 flex items-center justify-between">
                    <Tag>{STATUS_OPTIONS.find((s) => s.value === col)?.label ?? col}</Tag>
                    <span className="text-xs text-slate-500">{grouped[col]?.length ?? 0}</span>
                  </div>
                  <div className="max-h-[480px] space-y-2 overflow-y-auto">
                    {(grouped[col] ?? []).map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-slate-900"
                      >
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{alert.title}</span>
                          <SeverityBadge severity={alert.severity} />
                        </div>
                        <p className="mb-2 line-clamp-2 text-xs text-slate-500">
                          {alert.description ?? "—"}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{formatDateTime(alert.created_at)}</span>
                          <Select
                            size="small"
                            value={alert.status}
                            options={STATUS_OPTIONS}
                            onChange={(v) =>
                              statusMutation.mutate({ id: alert.id, newStatus: v })
                            }
                            className="min-w-[100px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title="Giao cảnh báo"
        open={!!assignModal}
        onCancel={() => setAssignModal(null)}
        onOk={() => {
          if (assignModal && assignUserId) {
            assignMutation.mutate({ id: assignModal.id, userId: assignUserId });
          }
        }}
        confirmLoading={assignMutation.isPending}
        okText="Giao"
        cancelText="Hủy"
      >
        <p className="mb-3 text-sm">{assignModal?.title}</p>
        <Select
          placeholder="Chọn người xử lý"
          className="w-full"
          options={usersData?.items.map((u) => ({
            value: u.id,
            label: `${u.full_name} (${u.email})`,
          }))}
          value={assignUserId}
          onChange={setAssignUserId}
          showSearch
          optionFilterProp="label"
        />
      </Modal>
    </div>
  );
}
