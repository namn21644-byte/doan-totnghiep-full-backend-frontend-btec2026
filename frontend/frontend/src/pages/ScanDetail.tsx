import { useCallback, useEffect, useMemo, useState } from "react";
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
  Tag,
} from "antd";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  StopCircle,
  RotateCcw,
} from "lucide-react";
import {
  cancelScan,
  getScan,
  getScanResults,
  retryScan,
  type PortFinding,
  type Scan,
} from "@/api/scans";
import EmptyState from "@/components/EmptyState";
import SeverityBadge from "@/components/SeverityBadge";
import useWebSocket, { type WsEvent } from "@/hooks/useWebSocket";
import { formatDateTime } from "@/utils/format";

const TERMINAL = new Set(["completed", "failed", "cancelled", "timeout"]);

export default function ScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const scanId = Number(id);
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [liveScan, setLiveScan] = useState<Partial<Scan> | null>(null);

  const { data: scan, isLoading } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: () => getScan(scanId),
    enabled: Number.isFinite(scanId),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s && TERMINAL.has(s) ? false : 5000;
    },
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["scan-results", scanId],
    queryFn: () => getScanResults(scanId),
    enabled: Number.isFinite(scanId) && scan?.status === "completed",
  });

  const handleScanEvent = useCallback(
    (event: WsEvent) => {
      const eventScanId = event.data.scan_id as number;
      if (eventScanId !== scanId) return;

      setLiveScan((prev) => ({
        ...prev,
        status: (event.data.status as string) ?? prev?.status,
        progress: (event.data.progress as number) ?? prev?.progress,
      }));

      if (
        event.event === "scan:completed" ||
        event.event === "scan:failed"
      ) {
        queryClient.invalidateQueries({ queryKey: ["scan", scanId] });
        queryClient.invalidateQueries({ queryKey: ["scan-results", scanId] });
      }
    },
    [queryClient, scanId],
  );

  useWebSocket({ onScanEvent: handleScanEvent });

  useEffect(() => {
    if (scan) setLiveScan(null);
  }, [scan]);

  const displayScan = useMemo(() => {
    if (!scan) return null;
    return { ...scan, ...liveScan };
  }, [scan, liveScan]);

  const cancelMutation = useMutation({
    mutationFn: () => cancelScan(scanId),
    onSuccess: () => {
      message.success("Đã hủy phiên quét");
      queryClient.invalidateQueries({ queryKey: ["scan", scanId] });
    },
    onError: () => message.error("Hủy phiên quét thất bại"),
  });

  const retryMutation = useMutation({
    mutationFn: () => retryScan(scanId),
    onSuccess: (newScan) => {
      message.success("Đã tạo phiên quét thử lại");
      window.location.href = `/scans/${newScan.id}`;
    },
    onError: () => message.error("Thử lại thất bại"),
  });

  const allPorts = useMemo(() => {
    if (!results?.results.length) return [];
    return results.results.flatMap((r) =>
      r.port_findings.map((pf) => ({ ...pf, ip: r.ip_address })),
    );
  }, [results]);

  function exportJson() {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-${scanId}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    if (!allPorts.length) return;
    const header = "IP,Port,Protocol,State,Service,Severity,Score\n";
    const rows = allPorts
      .map(
        (p) =>
          `${(p as PortFinding & { ip: string }).ip},${p.port},${p.protocol},${p.state},${p.service_name ?? ""},${p.risk_severity},${p.risk_score}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-${scanId}-ports.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading || !displayScan) {
    return <Skeleton active paragraph={{ rows: 10 }} />;
  }

  const isRunning = !TERMINAL.has(displayScan.status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/scans">
            <Button type="text" icon={<ArrowLeft size={18} />} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Phiên quét #{displayScan.id}</h1>
            <p className="text-sm text-slate-500">{displayScan.target_ip}</p>
          </div>
        </div>
        <Space wrap>
          {isRunning && (
            <Button
              danger
              icon={<StopCircle size={16} />}
              loading={cancelMutation.isPending}
              onClick={() => {
                Modal.confirm({
                  title: "Hủy phiên quét?",
                  okText: "Hủy quét",
                  cancelText: "Đóng",
                  onOk: () => cancelMutation.mutateAsync(),
                });
              }}
            >
              Hủy
            </Button>
          )}
          {TERMINAL.has(displayScan.status) && displayScan.status !== "running" && (
            <Button
              icon={<RotateCcw size={16} />}
              loading={retryMutation.isPending}
              onClick={() => retryMutation.mutate()}
            >
              Thử lại
            </Button>
          )}
          {displayScan.status === "completed" && (
            <>
              <Button icon={<Download size={16} />} onClick={exportJson}>
                JSON
              </Button>
              <Button icon={<Download size={16} />} onClick={exportCsv}>
                CSV
              </Button>
            </>
          )}
          <Button
            icon={<RefreshCw size={16} />}
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["scan", scanId] })
            }
          >
            Làm mới
          </Button>
        </Space>
      </div>

      <Card className="dark:bg-slate-900">
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <Tag color="blue">{displayScan.scan_type}</Tag>
            <Tag>{displayScan.status}</Tag>
          </div>
          <Progress
            percent={displayScan.progress}
            status={
              displayScan.status === "failed"
                ? "exception"
                : displayScan.status === "completed"
                  ? "success"
                  : "active"
            }
          />
          {displayScan.error_message && (
            <p className="mt-2 text-sm text-red-500">{displayScan.error_message}</p>
          )}
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic title="Cổng mở" value={displayScan.open_ports_count} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Critical" value={displayScan.risk_critical} valueStyle={{ color: "#dc2626" }} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="High" value={displayScan.risk_high} valueStyle={{ color: "#ea580c" }} />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic title="Medium" value={displayScan.risk_medium} valueStyle={{ color: "#d97706" }} />
          </Col>
        </Row>

        <Descriptions className="mt-4" bordered column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Bắt đầu">{formatDateTime(displayScan.started_at)}</Descriptions.Item>
          <Descriptions.Item label="Hoàn thành">{formatDateTime(displayScan.completed_at)}</Descriptions.Item>
          <Descriptions.Item label="Thời lượng">
            {displayScan.duration_seconds ? `${displayScan.duration_seconds}s` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Cổng quét">{displayScan.ports ?? "Mặc định"}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Kết quả quét" className="dark:bg-slate-900">
        {resultsLoading ? (
          <Skeleton active />
        ) : displayScan.status !== "completed" ? (
          <EmptyState
            description={
              isRunning
                ? "Đang quét — kết quả sẽ cập nhật khi hoàn thành"
                : "Chưa có kết quả"
            }
          />
        ) : allPorts.length ? (
          <Table
            rowKey="id"
            dataSource={allPorts}
            columns={[
              { title: "IP", dataIndex: "ip", key: "ip" },
              { title: "Cổng", dataIndex: "port" },
              { title: "Giao thức", dataIndex: "protocol" },
              { title: "Trạng thái", dataIndex: "state" },
              { title: "Dịch vụ", dataIndex: "service_name", render: (v: string) => v ?? "—" },
              {
                title: "Rủi ro",
                dataIndex: "risk_severity",
                render: (s: string) => <SeverityBadge severity={s} />,
              },
              { title: "Khuyến nghị", dataIndex: "recommendation", ellipsis: true, render: (v: string) => v ?? "—" },
            ]}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 900 }}
          />
        ) : (
          <EmptyState description="Không phát hiện cổng mở" />
        )}
      </Card>
    </div>
  );
}
