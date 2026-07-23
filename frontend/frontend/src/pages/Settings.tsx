import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Skeleton,
  Space,
  Switch,
  Tabs,
} from "antd";
import { Save, Shield } from "lucide-react";
import { getSettings, listAuditLogs, updateSettings, type Setting } from "@/api/settings";
import EmptyState from "@/components/EmptyState";
import { useAuthStore } from "@/store/auth";
import { formatDateTime } from "@/utils/format";

type SettingsForm = Record<string, string | boolean | number | null>;

export default function SettingsPage() {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles?.includes("admin");

  const { register, handleSubmit, reset, watch, setValue } = useForm<SettingsForm>();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
    enabled: isAdmin,
  });

  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => listAuditLogs({ page_size: 30 }),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (settings) {
      const defaults: SettingsForm = {};
      settings.forEach((s: Setting) => {
        if (s.value === "true" || s.value === "false") {
          defaults[s.key] = s.value === "true";
        } else if (s.value !== null && s.value !== "" && !Number.isNaN(Number(s.value))) {
          defaults[s.key] = Number(s.value);
        } else {
          defaults[s.key] = s.value ?? "";
        }
      });
      reset(defaults);
    }
  }, [settings, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: SettingsForm) => {
      const payload: Record<string, string | null> = {};
      Object.entries(values).forEach(([key, val]) => {
        if (typeof val === "boolean") payload[key] = val ? "true" : "false";
        else if (val === null || val === undefined) payload[key] = null;
        else payload[key] = String(val);
      });
      return updateSettings(payload);
    },
    onSuccess: () => {
      message.success("Lưu cài đặt thành công");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: () => message.error("Lưu cài đặt thất bại"),
  });

  if (!isAdmin) {
    return (
      <EmptyState
        description="Chỉ admin mới có quyền truy cập cài đặt hệ thống"
        action={
          <Link to="/dashboard">
            <Button type="primary">Về Dashboard</Button>
          </Link>
        }
      />
    );
  }

  function renderField(setting: Setting) {
    const value = watch(setting.key);
    const isBool = setting.value === "true" || setting.value === "false";
    const isNum =
      !isBool &&
      setting.value !== null &&
      setting.value !== "" &&
      !Number.isNaN(Number(setting.value));

    if (isBool) {
      return (
        <Form.Item
          key={setting.key}
          label={setting.description ?? setting.key}
          extra={setting.key}
        >
          <Switch
            checked={!!value}
            onChange={(checked) => setValue(setting.key, checked)}
          />
        </Form.Item>
      );
    }

    if (isNum) {
      return (
        <Form.Item
          key={setting.key}
          label={setting.description ?? setting.key}
          extra={setting.key}
        >
          <InputNumber
            className="w-full"
            value={value as number}
            onChange={(n) => setValue(setting.key, n)}
          />
        </Form.Item>
      );
    }

    return (
      <Form.Item
        key={setting.key}
        label={setting.description ?? setting.key}
        extra={setting.key}
      >
        <Input
          {...register(setting.key)}
          defaultValue={setting.value ?? ""}
        />
      </Form.Item>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Cài đặt</h1>
          <p className="text-sm text-slate-500">Cấu hình hệ thống và xem audit log</p>
        </div>
        <Link to="/risk-rules">
          <Button icon={<Shield size={16} />}>Quy tắc rủi ro</Button>
        </Link>
      </div>

      <Card className="dark:bg-slate-900">
        <Tabs
          items={[
            {
              key: "settings",
              label: "Cài đặt hệ thống",
              children: isLoading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
              ) : (
                <Form
                  layout="vertical"
                  onFinish={handleSubmit((v) => saveMutation.mutate(v))}
                >
                  {settings?.map(renderField)}
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<Save size={16} />}
                    loading={saveMutation.isPending}
                  >
                    Lưu thay đổi
                  </Button>
                </Form>
              ),
            },
            {
              key: "audit",
              label: "Audit log",
              children: auditLoading ? (
                <Skeleton active />
              ) : !auditLogs?.items.length ? (
                <EmptyState description="Chưa có audit log" />
              ) : (
                <div className="space-y-2">
                  {auditLogs.items.map((log) => (
                    <div
                      key={log.id}
                      className="rounded border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Space>
                          <span className="font-medium">{log.action}</span>
                          {log.resource_type && (
                            <span className="text-xs text-slate-500">
                              {log.resource_type} #{log.resource_id}
                            </span>
                          )}
                        </Space>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                      {log.ip_address && (
                        <p className="mt-1 text-xs text-slate-500">IP: {log.ip_address}</p>
                      )}
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
