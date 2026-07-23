import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  App as AntApp,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
} from "antd";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import {
  deleteReport,
  downloadReport,
  generateReport,
  listReports,
  type Report,
} from "@/api/reports";
import EmptyState from "@/components/EmptyState";
import { useAuthStore } from "@/store/auth";
import { formatDateTime } from "@/utils/format";

const REPORT_TYPES = [
  { value: "system_overview", label: "Tổng quan hệ thống" },
  { value: "scan_result", label: "Kết quả quét" },
  { value: "device", label: "Thiết bị" },
  { value: "risk", label: "Rủi ro" },
  { value: "alert", label: "Cảnh báo" },
  { value: "scan_compare", label: "So sánh quét" },
  { value: "user_activity", label: "Hoạt động người dùng" },
];

const FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
];

interface ReportForm {
  report_type: string;
  title: string;
  format: string;
}

const STATUS_COLORS: Record<string, string> = {
  queued: "default",
  generating: "processing",
  completed: "green",
  failed: "red",
};

export default function ReportsPage() {
  const { message, modal } = AntApp.useApp();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roles?.includes("admin");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);

  const { control, handleSubmit, reset } = useForm<ReportForm>({
    defaultValues: {
      report_type: "system_overview",
      title: "",
      format: "pdf",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", page, pageSize],
    queryFn: () => listReports({ page, page_size: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      message.success("Đã tạo yêu cầu báo cáo");
      setModalOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message ?? "Tạo báo cáo thất bại");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReport,
    onSuccess: () => {
      message.success("Đã xóa báo cáo");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: () => message.error("Xóa báo cáo thất bại"),
  });

  async function handleDownload(report: Report) {
    try {
      const blob = await downloadReport(report.id);
      const file = report.files[0];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file?.file_name ?? `report-${report.id}.${report.format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error("Tải báo cáo thất bại");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Báo cáo</h1>
          <p className="text-sm text-slate-500">Tạo và tải báo cáo PDF/Excel</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          Tạo báo cáo
        </Button>
      </div>

      <Card className="dark:bg-slate-900">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !data?.items.length ? (
          <EmptyState
            description="Chưa có báo cáo"
            action={
              <Button type="primary" onClick={() => setModalOpen(true)}>
                Tạo báo cáo đầu tiên
              </Button>
            }
          />
        ) : (
          <Table<Report>
            rowKey="id"
            dataSource={data.items}
            columns={[
              { title: "Tiêu đề", dataIndex: "title", ellipsis: true },
              { title: "Loại", dataIndex: "report_type" },
              { title: "Định dạng", dataIndex: "format", render: (f: string) => f.toUpperCase() },
              {
                title: "Trạng thái",
                dataIndex: "status",
                render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
              },
              { title: "Tạo lúc", dataIndex: "created_at", render: formatDateTime },
              {
                title: "Thao tác",
                key: "actions",
                render: (_: unknown, record: Report) => (
                  <Space>
                    {record.status === "completed" && (
                      <Button
                        size="small"
                        icon={<Download size={14} />}
                        onClick={() => handleDownload(record)}
                      >
                        Tải
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        size="small"
                        danger
                        icon={<Trash2 size={14} />}
                        onClick={() => {
                          modal.confirm({
                            title: "Xóa báo cáo?",
                            okText: "Xóa",
                            cancelText: "Hủy",
                            okButtonProps: { danger: true },
                            onOk: () => deleteMutation.mutateAsync(record.id),
                          });
                        }}
                      />
                    )}
                  </Space>
                ),
              },
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
        title={
          <Space>
            <FileText size={18} />
            Tạo báo cáo mới
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          onFinish={handleSubmit((values) => createMutation.mutate(values))}
        >
          <Form.Item label="Loại báo cáo" required>
            <Controller
              name="report_type"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select {...field} options={REPORT_TYPES} />
              )}
            />
          </Form.Item>
          <Form.Item label="Tiêu đề" required>
            <Controller
              name="title"
              control={control}
              rules={{ required: "Nhập tiêu đề báo cáo" }}
              render={({ field, fieldState }) => (
                <>
                  <Input {...field} placeholder="Báo cáo tổng quan tháng 7" />
                  {fieldState.error && (
                    <span className="text-xs text-red-500">
                      {fieldState.error.message}
                    </span>
                  )}
                </>
              )}
            />
          </Form.Item>
          <Form.Item label="Định dạng" required>
            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select {...field} options={FORMAT_OPTIONS} />
              )}
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              Tạo
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
