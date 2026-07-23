import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { App as AntApp, Button, Card, Checkbox, Form, Input } from "antd";
import { ShieldCheck, Lock, Mail, Radar } from "lucide-react";
import { loginRequest } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@networkscan.local" },
  { label: "Analyst", email: "analyst@networkscan.local" },
  { label: "Viewer", email: "viewer@networkscan.local" },
];

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const setSession = useAuthStore((s) => s.setSession);
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: LoginFormValues) {
    setLoading(true);
    try {
      const result = await loginRequest(values.email, values.password);
      setSession(
        result.tokens.access_token,
        result.tokens.refresh_token,
        result.user,
      );
      message.success("Đăng nhập thành công");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const detail =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Đăng nhập thất bại";
      message.error(detail);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(email: string) {
    form.setFieldsValue({ email, password: "" });
    message.info("Đã điền email demo. Mật khẩu xem trong README.");
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Left brand / illustration panel */}
      <div className="cyber-grid relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-9 w-9 text-brand-500" />
          <span className="text-xl font-semibold tracking-tight">
            NetworkScan
          </span>
        </div>
        <div className="relative z-10 max-w-md">
          <Radar className="mb-6 h-16 w-16 text-brand-500" />
          <h1 className="text-3xl font-bold leading-tight">
            Hệ thống dò quét mạng TCP ứng dụng Nmap
          </h1>
          <p className="mt-4 text-slate-400">
            Phát hiện cổng mở, nhận diện dịch vụ và đánh giá rủi ro bảo mật
            trong hệ thống mạng nội bộ của bạn.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Đồ án tốt nghiệp &middot; Chỉ quét thiết bị được cấp quyền.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-white">Đăng nhập</h2>
            <p className="mt-1 text-sm text-slate-400">
              Truy cập bảng điều khiển quản trị
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label={<span className="text-slate-300">Email</span>}
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                size="large"
                prefix={<Mail className="h-4 w-4 text-slate-500" />}
                placeholder="admin@networkscan.local"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-slate-300">Mật khẩu</span>}
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password
                size="large"
                prefix={<Lock className="h-4 w-4 text-slate-500" />}
                placeholder="••••••••"
              />
            </Form.Item>

            <div className="mb-4 flex items-center justify-between">
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>
                  <span className="text-slate-300">Ghi nhớ đăng nhập</span>
                </Checkbox>
              </Form.Item>
              <Link to="/forgot-password" className="text-sm text-brand-500 hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-brand-500 hover:underline">
              Đăng ký
            </Link>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-center text-xs uppercase tracking-wide text-slate-500">
              Tài khoản demo
            </p>
            <div className="flex justify-center gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.email}
                  size="small"
                  onClick={() => fillDemo(acc.email)}
                >
                  {acc.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
