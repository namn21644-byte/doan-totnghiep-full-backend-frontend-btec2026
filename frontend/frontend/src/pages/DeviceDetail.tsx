import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Descriptions,
  Modal,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from "antd";
import {
  ArrowLeft,
  Key,
  RefreshCw,
  Wifi,
} from "lucide-react";
import {
  getDevice,
  getDeviceAlerts,
  getDeviceLogs,
  getDeviceScans,
  regenerateDeviceKey,
  testDeviceConnection,
} from "@/api/devices";
import { getScanResults, type PortFinding } from "@/api/scans";
import EmptyState from "@/components/EmptyState";
import SeverityBadge from "@/components/SeverityBadge";
import { formatDateTime } from "@/utils/format";

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const deviceId = Number(id);
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [apiKeyModal, setApiKeyModal] = useState<string | null>(null);

  const { data: device, isLoading } = useQuery({
    queryKey: ["device", deviceId],
    queryFn: () => getDevice(deviceId),
    enabled: Number.isFinite(deviceId),
  });

  const { data: scans } = useQuery({
    queryKey: ["device-scans", deviceId],
    queryFn: () => getDeviceScans(deviceId, { page_size: 10 }),
    enabled: activeTab === "scans" && Number.isFinite(deviceId),
  });

  const latestCompletedScan = scans?.items.find((s) => s.status === "completed");

  const { data: scanResults, isLoading: portsLoading } = useQuery({
    queryKey: ["device-ports", latestCompletedScan?.id],
    queryFn: () => getScanResults(latestCompletedScan!.id),
    enabled: activeTab === "ports" && !!latestCompletedScan,
  });

  const { data: alerts } = useQuery({
    queryKey: ["device-alerts", deviceId],
    queryFn: () => getDeviceAlerts(deviceId, { page_size: 20 }),
    enabled: activeTab === "alerts" && Number.isFinite(deviceId),
  });

  const { data: logs } = useQuery({
    queryKey: ["device-logs", deviceId],
    queryFn: () => getDeviceLogs(deviceId, { page_size: 30 }),
    enabled: activeTab === "logs" && Number.isFinite(deviceId),
  });

  const testMutation = useMutation({
    mutationFn: () => testDeviceConnection(deviceId),
    onSuccess: (result) => {
      message[result.reachable ? "success" : "warning"](result.detail);
    },
    onError: () => message.error("Kiểm tra kết nối thất bại"),
  });

  const regenMutation = useMutation({
    mutationFn: () => regenerateDeviceKey(deviceId),
    onSuccess: (result) => {
      setApiKeyModal(result.api_key);
      queryClient.invalidateQueries({ queryKey: ["device", deviceId] });
      message.success("Đã sinh lại API key");
    },
    onError: () => message.error("Sinh lại API key thất bại"),
  });

  const allPorts = useMemo(() => {
    if (!scanResults?.results.length) return [];
    return scanResults.results.flatMap((r) => r.port_findings);
  }, [scanResults]);

  const portColumns = [
    { title: "Cổng", dataIndex: "port", key: "port" },
    { title: "Giao thức", dataIndex: "protocol", key: "protocol" },
    { title: "Trạng thái", dataIndex: "state", key: "state" },
    { title: "Dịch vụ", dataIndex: "service_name", key: "service", render: (v: string) => v ?? "—" },
    {
      title: "Mức rủi ro",
      dataIndex: "risk_severity",
      key: "risk",
      render: (s: string) => <SeverityBadge severity={s} />,
    },
    { title: "Điểm", dataIndex: "risk_score", key: "score" },
  ];

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  if (!device) {
    return <EmptyState description="Không tìm thấy thiết bị" />;
  }

  const agentOnline =
    device.last_agent_at &&
    Date.now() - new Date(device.last_agent_at).getTime() < 5 * 60 * 1000;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/devices">
          <Button type="text" icon={<ArrowLeft size={18} />} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{device.name}</h1>
          <p className="text-sm text-slate-500">{device.ip_address}</p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="dark:bg-slate-900">
            <Statistic title="Điểm rủi ro" value={device.risk_score} precision={1} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="dark:bg-slate-900">
            <Statistic title="Cổng mở" value={device.open_ports_count} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="dark:bg-slate-900">
            <Statistic title="Cảnh báo" value={device.alerts_count} />
          </Card>
        </Col>
      </Row>

      <Card className="dark:bg-slate-900">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "overview",
              label: "Tổng quan",
              children: (
                <Descriptions bordered column={{ xs: 1, sm: 2 }}>
                  <Descriptions.Item label="IP">{device.ip_address}</Descriptions.Item>
                  <Descriptions.Item label="Hostname">{device.hostname ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Hệ điều hành">{device.os_type ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="MAC">{device.mac_address ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Vị trí">{device.location ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Phòng ban">{device.department ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Quản lý">{device.manager_name ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color="blue">{device.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Tags" span={2}>
                    {device.tags.length
                      ? device.tags.map((t) => (
                          <Tag key={t.id} color={t.color ?? "blue"}>
                            {t.name}
                          </Tag>
                        ))
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Quét gần nhất">
                    {formatDateTime(device.last_scan_at)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú" span={2}>
                    {device.notes ?? "—"}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: "scans",
              label: "Phiên quét",
              children: scans?.items.length ? (
                <Table
                  rowKey="id"
                  dataSource={scans.items}
                  columns={[
                    {
                      title: "ID",
                      dataIndex: "id",
                      render: (scanId: number) => (
                        <Link to={`/scans/${scanId}`}>#{scanId}</Link>
                      ),
                    },
                    { title: "Loại", dataIndex: "scan_type" },
                    { title: "Trạng thái", dataIndex: "status", render: (s: string) => <Tag>{s}</Tag> },
                    {
                      title: "Tiến độ",
                      dataIndex: "progress",
                      render: (p: number) => <Progress percent={p} size="small" />,
                    },
                    { title: "Thời gian", dataIndex: "created_at", render: formatDateTime },
                  ]}
                  pagination={false}
                />
              ) : (
                <EmptyState description="Chưa có phiên quét" />
              ),
            },
            {
              key: "ports",
              label: "Cổng",
              children: portsLoading ? (
                <Skeleton active />
              ) : allPorts.length ? (
                <>
                  {latestCompletedScan && (
                    <p className="mb-3 text-sm text-slate-500">
                      Từ phiên quét #{latestCompletedScan.id} ({formatDateTime(latestCompletedScan.completed_at)})
                    </p>
                  )}
                  <Table<PortFinding>
                    rowKey="id"
                    dataSource={allPorts}
                    columns={portColumns}
                    pagination={{ pageSize: 15 }}
                  />
                </>
              ) : (
                <EmptyState description="Chưa có dữ liệu cổng từ phiên quét hoàn thành" />
              ),
            },
            {
              key: "alerts",
              label: "Cảnh báo",
              children: alerts?.items.length ? (
                <Table
                  rowKey="id"
                  dataSource={alerts.items}
                  columns={[
                    { title: "Tiêu đề", dataIndex: "title" },
                    {
                      title: "Mức độ",
                      dataIndex: "severity",
                      render: (s: string) => <SeverityBadge severity={s} />,
                    },
                    { title: "Trạng thái", dataIndex: "status", render: (s: string) => <Tag>{s}</Tag> },
                    { title: "Thời gian", dataIndex: "created_at", render: formatDateTime },
                  ]}
                  pagination={false}
                />
              ) : (
                <EmptyState description="Không có cảnh báo" />
              ),
            },
            {
              key: "logs",
              label: "Log",
              children: logs?.items.length ? (
                <Table
                  rowKey="id"
                  dataSource={logs.items}
                  columns={[
                    { title: "Loại", dataIndex: "log_type", width: 100 },
                    {
                      title: "Mức",
                      dataIndex: "severity",
                      render: (s: string) => <SeverityBadge severity={s} />,
                    },
                    { title: "Nội dung", dataIndex: "message", ellipsis: true },
                    { title: "Thời gian", dataIndex: "logged_at", render: formatDateTime, width: 180 },
                  ]}
                  pagination={false}
                />
              ) : (
                <EmptyState description="Không có log" />
              ),
            },
            {
              key: "agent",
              label: "Agent",
              children: (
                <div className="space-y-4">
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Trạng thái agent">
                      <Tag color={agentOnline ? "green" : "red"}>
                        {agentOnline ? "Online" : "Offline"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Heartbeat gần nhất">
                      {formatDateTime(device.last_agent_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="API key prefix">
                      {device.api_key_prefix ?? "—"}
                    </Descriptions.Item>
                  </Descriptions>
                  <Space wrap>
                    <Button
                      icon={<Wifi size={16} />}
                      loading={testMutation.isPending}
                      onClick={() => testMutation.mutate()}
                    >
                      Kiểm tra kết nối
                    </Button>
                    <Button
                      icon={<Key size={16} />}
                      loading={regenMutation.isPending}
                      onClick={() => {
                        Modal.confirm({
                          title: "Sinh lại API key?",
                          content: "Key cũ sẽ không còn hiệu lực. Agent cần cập nhật key mới.",
                          okText: "Xác nhận",
                          cancelText: "Hủy",
                          onOk: () => regenMutation.mutateAsync(),
                        });
                      }}
                    >
                      Sinh lại API key
                    </Button>
                    <Button
                      icon={<RefreshCw size={16} />}
                      onClick={() =>
                        queryClient.invalidateQueries({ queryKey: ["device", deviceId] })
                      }
                    >
                      Làm mới
                    </Button>
                  </Space>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="API Key mới"
        open={!!apiKeyModal}
        onCancel={() => setApiKeyModal(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setApiKeyModal(null)}>
            Đã lưu
          </Button>,
        ]}
      >
        <p className="mb-2 text-sm text-slate-500">
          Sao chép key ngay — sẽ không hiển thị lại.
        </p>
        <code className="block break-all rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">
          {apiKeyModal}
        </code>
      </Modal>
    </div>
  );
}
