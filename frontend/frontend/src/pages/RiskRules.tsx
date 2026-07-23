import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from "antd";
import { ArrowLeft, Pencil, Plus, Trash2, Upload as UploadIcon } from "lucide-react";
import {
  createRiskRule,
  deleteRiskRule,
  importRiskRules,
  listRiskRules,
  updateRiskRule,
  type RiskRule,
} from "@/api/risks";
import EmptyState from "@/components/EmptyState";
import SeverityBadge from "@/components/SeverityBadge";
import { useAuthStore } from "@/store/auth";
import { SEVERITY_OPTIONS } from "@/utils/severity";

interface RuleFormValues {
  name: string;
  port?: number | null;
  protocol?: string | null;
  service?: string | null;
  severity: string;
  base_score: number;
  description?: string | null;
  impact?: string | null;
  recommendation?: string | null;
  is_active: boolean;
}

export default function RiskRulesPage() {
  const { message, modal } = AntApp.useApp();
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((s) => s.user?.roles?.includes("admin"));

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRule, setEditRule] = useState<RiskRule | null>(null);

  const { control, handleSubmit, reset, setValue } = useForm<RuleFormValues>({
    defaultValues: {
      name: "",
      severity: "medium",
      base_score: 5,
      is_active: true,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["risk-rules", page, pageSize, search],
    queryFn: () => listRiskRules({ page, page_size: pageSize, search }),
  });

  const createMutation = useMutation({
    mutationFn: createRiskRule,
    onSuccess: () => {
      message.success("Tạo quy tắc thành công");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["risk-rules"] });
    },
    onError: () => message.error("Tạo quy tắc thất bại"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RuleFormValues> }) =>
      updateRiskRule(id, payload),
    onSuccess: () => {
      message.success("Cập nhật quy tắc thành công");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["risk-rules"] });
    },
    onError: () => message.error("Cập nhật thất bại"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRiskRule,
    onSuccess: () => {
      message.success("Đã xóa quy tắc");
      queryClient.invalidateQueries({ queryKey: ["risk-rules"] });
    },
  });

  const importMutation = useMutation({
    mutationFn: importRiskRules,
    onSuccess: (result) => {
      message.success(
        `Import: ${result.created} mới, ${result.updated} cập nhật, ${result.skipped} bỏ qua`,
      );
      queryClient.invalidateQueries({ queryKey: ["risk-rules"] });
    },
    onError: () => message.error("Import thất bại"),
  });

  function closeModal() {
    setModalOpen(false);
    setEditRule(null);
    reset();
  }

  function openEdit(rule: RiskRule) {
    setEditRule(rule);
    setValue("name", rule.name);
    setValue("port", rule.port);
    setValue("protocol", rule.protocol);
    setValue("service", rule.service);
    setValue("severity", rule.severity);
    setValue("base_score", rule.base_score);
    setValue("description", rule.description);
    setValue("impact", rule.impact);
    setValue("recommendation", rule.recommendation);
    setValue("is_active", rule.is_active);
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/settings">
            <Button type="text" icon={<ArrowLeft size={18} />} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Quy tắc rủi ro</h1>
            <p className="text-sm text-slate-500">CRUD quy tắc đánh giá rủi ro cổng/dịch vụ</p>
          </div>
        </div>
        {isAdmin && (
          <Space>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={(file) => {
                importMutation.mutate(file);
                return false;
              }}
            >
              <Button icon={<UploadIcon size={16} />} loading={importMutation.isPending}>
                Import JSON
              </Button>
            </Upload>
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                reset();
                setEditRule(null);
                setModalOpen(true);
              }}
            >
              Thêm quy tắc
            </Button>
          </Space>
        )}
      </div>

      <Card className="dark:bg-slate-900">
        <div className="mb-4">
          <Input.Search
            placeholder="Tìm quy tắc..."
            onSearch={(v) => {
              setSearch(v);
              setPage(1);
            }}
            className="max-w-xs"
            allowClear
          />
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !data?.items.length ? (
          <EmptyState description="Chưa có quy tắc rủi ro" />
        ) : (
          <Table<RiskRule>
            rowKey="id"
            dataSource={data.items}
            columns={[
              { title: "Tên", dataIndex: "name" },
              { title: "Cổng", dataIndex: "port", render: (v: number) => v ?? "—" },
              { title: "Dịch vụ", dataIndex: "service", render: (v: string) => v ?? "—" },
              {
                title: "Mức",
                dataIndex: "severity",
                render: (s: string) => <SeverityBadge severity={s} />,
              },
              { title: "Điểm", dataIndex: "base_score" },
              {
                title: "Kích hoạt",
                dataIndex: "is_active",
                render: (v: boolean) => (
                  <Tag color={v ? "green" : "default"}>{v ? "Có" : "Không"}</Tag>
                ),
              },
              ...(isAdmin
                ? [
                    {
                      title: "Thao tác",
                      key: "actions",
                      render: (_: unknown, record: RiskRule) => (
                        <Space>
                          <Button
                            size="small"
                            icon={<Pencil size={14} />}
                            onClick={() => openEdit(record)}
                          />
                          <Button
                            size="small"
                            danger
                            icon={<Trash2 size={14} />}
                            onClick={() => {
                              modal.confirm({
                                title: "Xóa quy tắc?",
                                okText: "Xóa",
                                cancelText: "Hủy",
                                okButtonProps: { danger: true },
                                onOk: () => deleteMutation.mutateAsync(record.id),
                              });
                            }}
                          />
                        </Space>
                      ),
                    },
                  ]
                : []),
            ]}
            pagination={{
              current: page,
              pageSize,
              total: data.meta.total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        )}
      </Card>

      <Modal
        title={editRule ? "Sửa quy tắc" : "Thêm quy tắc"}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit((values) => {
            if (editRule) {
              updateMutation.mutate({ id: editRule.id, payload: values });
            } else {
              createMutation.mutate(values);
            }
          })}
        >
          <Form.Item label="Tên quy tắc" required>
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Cổng">
              <Controller
                name="port"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} className="w-full" min={1} max={65535} />
                )}
              />
            </Form.Item>
            <Form.Item label="Giao thức">
              <Controller
                name="protocol"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    allowClear
                    options={[
                      { value: "tcp", label: "TCP" },
                      { value: "udp", label: "UDP" },
                    ]}
                  />
                )}
              />
            </Form.Item>
          </div>
          <Form.Item label="Dịch vụ">
            <Controller
              name="service"
              control={control}
              render={({ field }) => (
                <Input {...field} value={field.value ?? ""} placeholder="ssh, http..." />
              )}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Mức rủi ro" required>
              <Controller
                name="severity"
                control={control}
                render={({ field }) => (
                  <Select {...field} options={SEVERITY_OPTIONS} />
                )}
              />
            </Form.Item>
            <Form.Item label="Điểm cơ sở">
              <Controller
                name="base_score"
                control={control}
                render={({ field }) => (
                  <InputNumber {...field} className="w-full" min={0} max={10} step={0.1} />
                )}
              />
            </Form.Item>
          </div>
          <Form.Item label="Mô tả">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} value={field.value ?? ""} rows={2} />
              )}
            />
          </Form.Item>
          <Form.Item label="Khuyến nghị">
            <Controller
              name="recommendation"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} value={field.value ?? ""} rows={2} />
              )}
            />
          </Form.Item>
          <Form.Item label="Kích hoạt">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} />
              )}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={closeModal}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              Lưu
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
