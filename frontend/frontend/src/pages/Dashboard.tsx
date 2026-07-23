import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, List, Row, Skeleton, Statistic, Tag } from "antd";
import {
  MonitorSmartphone,
  Radar,
  ShieldAlert,
  Network,
  Activity,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, type ApiResponse } from "@/api/client";
import {
  getDashboardSummary,
  getRecentAlerts,
  getRecentScans,
  getRiskDistribution,
  getScanTrend,
  getTopRiskyDevices,
} from "@/api/dashboard";
import SeverityBadge from "@/components/SeverityBadge";
import { formatDateTime } from "@/utils/format";
import { severityColor } from "@/utils/severity";

interface HealthData {
  status: string;
  version: string;
  dependencies: { mysql: string; redis: string };
}

function StatCard({
  title,
  value,
  icon,
  suffix,
  loading,
}: {
  title: string;
  value: number | string;
  icon: ReactNode;
  suffix?: string;
  loading?: boolean;
}) {
  return (
    <Card className="dark:bg-slate-900">
      {loading ? (
        <Skeleton active paragraph={false} />
      ) : (
        <div className="flex items-center justify-between">
          <Statistic title={title} value={value} suffix={suffix} />
          <div className="rounded-lg bg-brand-50 p-3 text-brand-600 dark:bg-slate-800">
            {icon}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<HealthData>>("/health");
      return res.data.data;
    },
    refetchInterval: 15_000,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
  });

  const { data: riskDist, isLoading: riskLoading } = useQuery({
    queryKey: ["dashboard", "risk-distribution"],
    queryFn: getRiskDistribution,
  });

  const { data: scanTrend, isLoading: trendLoading } = useQuery({
    queryKey: ["dashboard", "scan-trend"],
    queryFn: () => getScanTrend(7),
  });

  const { data: topDevices } = useQuery({
    queryKey: ["dashboard", "top-risky"],
    queryFn: () => getTopRiskyDevices(5),
  });

  const { data: recentAlerts } = useQuery({
    queryKey: ["dashboard", "recent-alerts"],
    queryFn: () => getRecentAlerts(5),
  });

  const { data: recentScans } = useQuery({
    queryKey: ["dashboard", "recent-scans"],
    queryFn: () => getRecentScans(5),
  });

  const pieData =
    riskDist?.map((item) => ({
      name: item.severity,
      value: item.count,
      color: item.color ?? severityColor(item.severity),
    })) ?? [];

  const barData =
    scanTrend?.map((item) => ({
      day: new Date(item.date).toLocaleDateString("vi-VN", { weekday: "short" }),
      scans: item.scans,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Tổng quan tình trạng an toàn hệ thống mạng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Trạng thái hệ thống:</span>
          <Tag color={health?.status === "ok" ? "green" : "orange"}>
            {health?.status?.toUpperCase() ?? "..."}
          </Tag>
          <Tag color={health?.dependencies.mysql === "up" ? "blue" : "red"}>
            MySQL: {health?.dependencies.mysql ?? "?"}
          </Tag>
          <Tag color={health?.dependencies.redis === "up" ? "blue" : "red"}>
            Redis: {health?.dependencies.redis ?? "?"}
          </Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng thiết bị"
            value={summary?.total_devices ?? 0}
            icon={<MonitorSmartphone size={22} />}
            loading={summaryLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Phiên quét"
            value={summary?.total_scans ?? 0}
            icon={<Radar size={22} />}
            loading={summaryLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Cổng đang mở"
            value={summary?.open_ports ?? 0}
            icon={<Network size={22} />}
            loading={summaryLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Cảnh báo Critical"
            value={summary?.critical_alerts ?? 0}
            icon={<ShieldAlert size={22} />}
            loading={summaryLoading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="Phân bố mức độ rủi ro" className="dark:bg-slate-900">
            {riskLoading ? (
              <Skeleton active />
            ) : pieData.length ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {pieData.map((s) => (
                    <span key={s.name} className="flex items-center gap-1 text-xs">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Số lần quét theo ngày"
            className="dark:bg-slate-900"
            extra={<Activity size={18} className="text-brand-600" />}
          >
            {trendLoading ? (
              <Skeleton active />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <ReTooltip />
                  <Bar dataKey="scans" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Top thiết bị rủi ro" className="dark:bg-slate-900">
            <List
              dataSource={topDevices ?? []}
              locale={{ emptyText: "Chưa có dữ liệu" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Link to={`/devices/${item.id}`} className="text-brand-600">
                        {item.name}
                      </Link>
                    }
                    description={`${item.ip_address} · ${item.open_ports_count} cổng · ${item.alerts_count} cảnh báo`}
                  />
                  <Tag color="red">{item.risk_score.toFixed(1)}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Cảnh báo gần đây" className="dark:bg-slate-900">
            <List
              dataSource={recentAlerts ?? []}
              locale={{ emptyText: "Không có cảnh báo" }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={formatDateTime(item.created_at)}
                  />
                  <SeverityBadge severity={item.severity} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Phiên quét gần đây" className="dark:bg-slate-900">
        <List
          dataSource={recentScans ?? []}
          locale={{ emptyText: "Chưa có phiên quét" }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Link key="view" to={`/scans/${item.id}`}>
                  Xem
                </Link>,
              ]}
            >
              <List.Item.Meta
                title={`${item.target_ip} (${item.scan_type})`}
                description={`${item.status} · ${item.progress}% · ${formatDateTime(item.created_at)}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
