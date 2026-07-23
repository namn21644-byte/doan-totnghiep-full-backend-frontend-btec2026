import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  App as AntApp,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Select,
  Steps,
} from "antd";
import { ArrowLeft, ArrowRight, Radar } from "lucide-react";
import { listDevices } from "@/api/devices";
import { createScan } from "@/api/scans";

interface ScanFormValues {
  target_ip: string;
  device_id?: number | null;
  scan_type: string;
  ports?: string;
  timing?: string;
  skip_ping?: boolean;
}

const SCAN_TYPES = [
  { value: "quick", label: "Quick — Top 100 cổng phổ biến" },
  { value: "standard", label: "Standard — Quét TCP mặc định" },
  { value: "full", label: "Full — Tất cả 65535 cổng" },
  { value: "custom", label: "Custom — Tùy chỉnh cổng" },
];

export default function ScanCreatePage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [step, setStep] = useState(0);

  const { control, handleSubmit, watch, trigger } = useForm<ScanFormValues>({
    defaultValues: {
      target_ip: "",
      device_id: null,
      scan_type: "standard",
      ports: "",
      timing: "T3",
      skip_ping: false,
    },
  });

  const values = watch();

  const { data: devicesData } = useQuery({
    queryKey: ["devices-select"],
    queryFn: () => listDevices({ page_size: 100, status: "active" }),
  });

  const createMutation = useMutation({
    mutationFn: createScan,
    onSuccess: (scan) => {
      message.success("Tạo phiên quét thành công");
      navigate(`/scans/${scan.id}`);
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message ?? "Tạo phiên quét thất bại");
    },
  });

  async function nextStep() {
    let valid = true;
    if (step === 0) valid = await trigger(["target_ip"]);
    if (step === 1) valid = await trigger(["scan_type"]);
    if (step === 2 && values.scan_type === "custom") {
      valid = await trigger(["ports"]);
    }
    if (valid) setStep((s) => Math.min(s + 1, 3));
  }

  function onSubmit(data: ScanFormValues) {
    createMutation.mutate({
      target_ip: data.target_ip,
      device_id: data.device_id ?? null,
      scan_type: data.scan_type,
      ports: data.scan_type === "custom" ? data.ports : null,
      scan_params: {
        timing: data.timing,
        skip_ping: data.skip_ping,
      },
    });
  }

  const deviceOptions =
    devicesData?.items.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.ip_address})`,
    })) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tạo phiên quét mới</h1>
        <p className="text-sm text-slate-500">
          Thiết lập mục tiêu, loại quét và xác nhận trước khi chạy
        </p>
      </div>

      <Steps
        current={step}
        items={[
          { title: "Mục tiêu" },
          { title: "Loại quét" },
          { title: "Cấu hình" },
          { title: "Xác nhận" },
        ]}
      />

      <Card className="dark:bg-slate-900">
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          {step === 0 && (
            <>
              <Form.Item label="Địa chỉ IP mục tiêu" required>
                <Controller
                  name="target_ip"
                  control={control}
                  rules={{
                    required: "Vui lòng nhập IP",
                    pattern: {
                      value: /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/,
                      message: "IP không hợp lệ",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input {...field} placeholder="192.168.1.10" size="large" />
                      {fieldState.error && (
                        <span className="text-xs text-red-500">
                          {fieldState.error.message}
                        </span>
                      )}
                    </>
                  )}
                />
              </Form.Item>
              <Form.Item label="Liên kết thiết bị (tùy chọn)">
                <Controller
                  name="device_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      allowClear
                      placeholder="Chọn thiết bị"
                      options={deviceOptions}
                      showSearch
                      optionFilterProp="label"
                    />
                  )}
                />
              </Form.Item>
            </>
          )}

          {step === 1 && (
            <Form.Item label="Loại quét" required>
              <Controller
                name="scan_type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select {...field} options={SCAN_TYPES} size="large" />
                )}
              />
            </Form.Item>
          )}

          {step === 2 && (
            <>
              {values.scan_type === "custom" && (
                <Form.Item label="Danh sách cổng" required>
                  <Controller
                    name="ports"
                    control={control}
                    rules={{ required: "Nhập cổng cho custom scan" }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input {...field} placeholder="22,80,443 hoặc 1-1024" />
                        {fieldState.error && (
                          <span className="text-xs text-red-500">
                            {fieldState.error.message}
                          </span>
                        )}
                      </>
                    )}
                  />
                </Form.Item>
              )}
              <Form.Item label="Timing template">
                <Controller
                  name="timing"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={[
                        { value: "T2", label: "T2 — Chậm, ít phát hiện" },
                        { value: "T3", label: "T3 — Cân bằng (mặc định)" },
                        { value: "T4", label: "T4 — Nhanh" },
                      ]}
                    />
                  )}
                />
              </Form.Item>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-brand-50 p-4 dark:bg-slate-800">
                <Radar className="h-8 w-8 text-brand-600" />
                <div>
                  <p className="font-medium">Sẵn sàng quét</p>
                  <p className="text-sm text-slate-500">
                    Phiên quét sẽ được đưa vào hàng đợi và chạy qua scan-service
                  </p>
                </div>
              </div>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="IP mục tiêu">{values.target_ip}</Descriptions.Item>
                <Descriptions.Item label="Loại quét">{values.scan_type}</Descriptions.Item>
                {values.ports && (
                  <Descriptions.Item label="Cổng">{values.ports}</Descriptions.Item>
                )}
                <Descriptions.Item label="Timing">{values.timing}</Descriptions.Item>
                <Descriptions.Item label="Thiết bị">
                  {deviceOptions.find((d) => d.value === values.device_id)?.label ?? "—"}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button
              disabled={step === 0}
              icon={<ArrowLeft size={16} />}
              onClick={() => setStep((s) => s - 1)}
            >
              Quay lại
            </Button>
            {step < 3 ? (
              <Button type="primary" icon={<ArrowRight size={16} />} onClick={nextStep}>
                Tiếp theo
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}
                icon={<Radar size={16} />}
              >
                Bắt đầu quét
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
