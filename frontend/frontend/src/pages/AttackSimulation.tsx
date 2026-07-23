import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
} from "antd";
import {
  Crosshair,
  Play,
  ShieldAlert,
  Radio,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  getRunStatus,
  listScenarios,
  runScenario,
  type AttackRun,
  type AttackScenario,
} from "@/api/demoAttack";
import SeverityBadge from "@/components/SeverityBadge";
import useWebSocket, { type WsEvent } from "@/hooks/useWebSocket";
import { useAuthStore } from "@/store/auth";

const { Title, Paragraph, Text } = Typography;

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-red-500/60",
  high: "border-orange-500/60",
  medium: "border-amber-500/60",
  low: "border-green-500/60",
};

function canRunSimulation(roles: string[]) {
  return roles.some((r) => r === "admin" || r === "analyst");
}

export default function AttackSimulationPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const roles = useAuthStore((s) => s.user?.roles ?? []);

  const [activeRun, setActiveRun] = useState<AttackRun | null>(null);
  const [feed, setFeed] = useState<string[]>([]);

  const { data: scenarios, isLoading } = useQuery({
    queryKey: ["attack-scenarios"],
    queryFn: listScenarios,
  });

  const pushFeed = useCallback((line: string) => {
    setFeed((prev) => [line, ...prev].slice(0, 30));
  }, []);

  const onAttackEvent = useCallback(
    (ev: WsEvent) => {
      const d = ev.data;
      if (ev.event === "attack:step") {
        pushFeed(`▶ Bước: ${d.step_key} (${d.status})`);
      }
      if (ev.event === "attack:progress") {
        setActiveRun((prev) =>
          prev && prev.run_id === d.run_id
            ? {
                ...prev,
                progress: (d.progress as number) ?? prev.progress,
                status: (d.status as string) ?? prev.status,
                current_step: (d.current_step as string) ?? prev.current_step,
              }
            : prev,
        );
      }
      if (ev.event === "attack:completed") {
        message.success("Mô phỏng tấn công hoàn tất");
        pushFeed("✓ Mô phỏng hoàn tất — xem Cảnh báo / Log / Quét");
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
        queryClient.invalidateQueries({ queryKey: ["logs"] });
        queryClient.invalidateQueries({ queryKey: ["scans"] });
      }
    },
    [message, pushFeed, queryClient],
  );

  const { connected } = useWebSocket({ onAttackEvent });

  const runMutation = useMutation({
    mutationFn: (scenarioId: string) => runScenario(scenarioId),
    onSuccess: (run) => {
      setActiveRun(run);
      setFeed([]);
      pushFeed(`🚀 Bắt đầu: ${run.scenario_name}`);
      message.info("Đang chạy mô phỏng — theo dõi realtime bên phải");
    },
    onError: () => message.error("Không thể khởi chạy mô phỏng"),
  });

  // Poll run status while active
  useEffect(() => {
    if (!activeRun || activeRun.status === "completed" || activeRun.status === "failed") {
      return;
    }
    const timer = setInterval(async () => {
      try {
        const updated = await getRunStatus(activeRun.run_id);
        setActiveRun(updated);
        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(timer);
        }
      } catch {
        /* ignore poll errors */
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [activeRun]);

  function handleRun(scenario: AttackScenario) {
    if (!canRunSimulation(roles)) {
      message.warning("Chỉ Admin/Analyst mới được chạy mô phỏng");
      return;
    }
    if (activeRun?.status === "running") {
      message.warning("Đang có mô phỏng khác đang chạy");
      return;
    }
    runMutation.mutate(scenario.id);
  }

  const stepItems =
    activeRun?.steps.map((s) => ({
      title: s.label,
      status:
        s.status === "completed"
          ? ("finish" as const)
          : s.status === "running"
            ? ("process" as const)
            : ("wait" as const),
      icon:
        s.status === "completed" ? (
          <CheckCircle2 size={16} className="text-green-500" />
        ) : s.status === "running" ? (
          <Loader2 size={16} className="animate-spin text-blue-500" />
        ) : undefined,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Title level={2} className="!mb-1 flex items-center gap-2">
            <Crosshair className="text-red-500" size={28} />
            Attack Simulation Lab
          </Title>
          <Paragraph type="secondary" className="!mb-0 max-w-2xl">
            Phòng lab mô phỏng tấn công cho demo SOC. Mọi sự kiện đều gắn nhãn{" "}
            <Tag color="volcano">SIMULATION</Tag> — không phải tấn công thật.
          </Paragraph>
        </div>
        <Space>
          <Tag icon={<Radio size={12} />} color={connected ? "green" : "default"}>
            WebSocket {connected ? "OK" : "..."}
          </Tag>
        </Space>
      </div>

      <Alert
        type="warning"
        showIcon
        message="Chế độ mô phỏng"
        description="Kết quả phản ánh kịch bản demo để trình bày khả năng phát hiện, ghi log và sinh cảnh báo. Không thay thế kiểm thử xâm nhập thực tế."
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Row gutter={[16, 16]}>
            {(scenarios ?? []).map((scenario) => (
              <Col xs={24} md={12} key={scenario.id}>
                <Card
                  className={`h-full border-2 dark:bg-slate-900 ${SEVERITY_BORDER[scenario.severity] ?? ""}`}
                  title={
                    <Space direction="vertical" size={0}>
                      <Text strong>{scenario.name}</Text>
                      <SeverityBadge severity={scenario.severity} />
                    </Space>
                  }
                  extra={
                    <Tag>{scenario.duration_seconds}s</Tag>
                  }
                >
                  <Paragraph className="text-sm text-slate-500 dark:text-slate-400">
                    {scenario.description}
                  </Paragraph>
                  <div className="mb-3 flex flex-wrap gap-1">
                    {scenario.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                  <Text type="secondary" className="text-xs">
                    Mục tiêu: {scenario.target_device_name}
                  </Text>
                  <Button
                    type="primary"
                    danger
                    block
                    className="mt-4"
                    icon={<Play size={16} />}
                    loading={runMutation.isPending && runMutation.variables === scenario.id}
                    disabled={!canRunSimulation(roles) || activeRun?.status === "running"}
                    onClick={() => handleRun(scenario)}
                  >
                    Chạy mô phỏng
                  </Button>
                </Card>
              </Col>
            ))}
            {isLoading && (
              <Col span={24}>
                <Card loading />
              </Col>
            )}
          </Row>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title="Tiến trình realtime"
            className="dark:bg-slate-900"
            extra={
              activeRun ? (
                <Tag color={activeRun.status === "completed" ? "green" : "processing"}>
                  {activeRun.status}
                </Tag>
              ) : null
            }
          >
            {activeRun ? (
              <Space direction="vertical" className="w-full" size="middle">
                <div>
                  <Text strong>{activeRun.scenario_name}</Text>
                  <Progress
                    percent={activeRun.progress}
                    status={
                      activeRun.status === "failed"
                        ? "exception"
                        : activeRun.status === "completed"
                          ? "success"
                          : "active"
                    }
                  />
                  <Text type="secondary" className="text-xs">
                    {activeRun.message}
                  </Text>
                </div>

                <Steps
                  direction="vertical"
                  size="small"
                  items={stepItems}
                  current={stepItems.findIndex((s) => s.status === "process")}
                />

                {activeRun.status === "completed" && (
                  <Space wrap>
                    <Button
                      size="small"
                      icon={<ShieldAlert size={14} />}
                      onClick={() => navigate("/alerts")}
                    >
                      Xem cảnh báo ({activeRun.created_alert_ids.length})
                    </Button>
                    <Button size="small" onClick={() => navigate("/logs")}>
                      Xem log ({activeRun.created_log_ids.length})
                    </Button>
                    {activeRun.scan_id && (
                      <Button
                        size="small"
                        onClick={() => navigate(`/scans/${activeRun.scan_id}`)}
                      >
                        Kết quả quét #{activeRun.scan_id}
                      </Button>
                    )}
                  </Space>
                )}
              </Space>
            ) : (
              <Paragraph type="secondary" className="text-center py-8">
                Chọn kịch bản và bấm &quot;Chạy mô phỏng&quot; để bắt đầu
              </Paragraph>
            )}
          </Card>

          <Card title="SOC feed" className="mt-4 dark:bg-slate-900">
            {feed.length === 0 ? (
              <Text type="secondary" className="text-sm">
                Sự kiện mô phỏng sẽ hiện tại đây...
              </Text>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm font-mono">
                {feed.map((line, i) => (
                  <li
                    key={`${i}-${line.slice(0, 20)}`}
                    className="border-b border-slate-100 pb-1 dark:border-slate-800"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
