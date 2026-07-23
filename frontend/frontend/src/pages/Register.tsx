import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { App as AntApp, Button, Card, Form, Input, Steps } from "antd";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";
import {
  registerRequest,
  resendOtpRequest,
  verifyOtpRequest,
} from "@/api/auth";

interface RegisterForm {
  email: string;
  full_name: string;
  password: string;
  confirm_password: string;
}

interface OtpForm {
  otp_code: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const registerForm = useForm<RegisterForm>();
  const otpForm = useForm<OtpForm>();

  async function onRegister(values: RegisterForm) {
    if (values.password !== values.confirm_password) {
      message.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await registerRequest({
        email: values.email,
        fullName: values.full_name,
        password: values.password,
      });
      setEmail(values.email);
      setStep(1);
      message.success("Đăng ký thành công — kiểm tra email để lấy OTP");
    } catch (err) {
      const detail =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Đăng ký thất bại";
      message.error(detail);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(values: OtpForm) {
    setLoading(true);
    try {
      await verifyOtpRequest({ email, otp_code: values.otp_code });
      message.success("Xác thực email thành công — vui lòng đăng nhập");
      navigate("/login", { replace: true });
    } catch (err) {
      const detail =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "OTP không hợp lệ";
      message.error(detail);
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    try {
      await resendOtpRequest({ email, purpose: "register" });
      message.success("Đã gửi lại mã OTP");
    } catch {
      message.error("Gửi lại OTP thất bại");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-brand-500" />
          <h1 className="text-2xl font-semibold text-white">Đăng ký</h1>
          <p className="mt-1 text-sm text-slate-400">Tạo tài khoản NetworkScan</p>
        </div>

        <Steps
          size="small"
          current={step}
          className="mb-6"
          items={[{ title: "Thông tin" }, { title: "Xác thực OTP" }]}
        />

        {step === 0 ? (
          <Form layout="vertical" onFinish={registerForm.handleSubmit(onRegister)}>
            <Form.Item label={<span className="text-slate-300">Họ tên</span>} required>
              <Controller
                name="full_name"
                control={registerForm.control}
                rules={{ required: "Nhập họ tên" }}
                render={({ field, fieldState }) => (
                  <>
                    <Input {...field} prefix={<User size={16} />} size="large" />
                    {fieldState.error && (
                      <span className="text-xs text-red-500">{fieldState.error.message}</span>
                    )}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item label={<span className="text-slate-300">Email</span>} required>
              <Controller
                name="email"
                control={registerForm.control}
                rules={{ required: "Nhập email" }}
                render={({ field, fieldState }) => (
                  <>
                    <Input {...field} prefix={<Mail size={16} />} size="large" type="email" />
                    {fieldState.error && (
                      <span className="text-xs text-red-500">{fieldState.error.message}</span>
                    )}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item label={<span className="text-slate-300">Mật khẩu</span>} required>
              <Controller
                name="password"
                control={registerForm.control}
                rules={{ required: "Nhập mật khẩu", minLength: { value: 8, message: "Tối thiểu 8 ký tự" } }}
                render={({ field, fieldState }) => (
                  <>
                    <Input.Password {...field} prefix={<Lock size={16} />} size="large" />
                    {fieldState.error && (
                      <span className="text-xs text-red-500">{fieldState.error.message}</span>
                    )}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item label={<span className="text-slate-300">Xác nhận mật khẩu</span>} required>
              <Controller
                name="confirm_password"
                control={registerForm.control}
                rules={{ required: "Xác nhận mật khẩu" }}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<Lock size={16} />} size="large" />
                )}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Đăng ký
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={otpForm.handleSubmit(onVerifyOtp)}>
            <p className="mb-4 text-sm text-slate-400">
              Nhập mã OTP đã gửi tới <strong className="text-white">{email}</strong>
            </p>
            <Form.Item label={<span className="text-slate-300">Mã OTP</span>} required>
              <Controller
                name="otp_code"
                control={otpForm.control}
                rules={{ required: "Nhập mã OTP" }}
                render={({ field, fieldState }) => (
                  <>
                    <Input {...field} size="large" placeholder="123456" maxLength={10} />
                    {fieldState.error && (
                      <span className="text-xs text-red-500">{fieldState.error.message}</span>
                    )}
                  </>
                )}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Xác thực
            </Button>
            <Button type="link" block onClick={resendOtp} className="mt-2">
              Gửi lại OTP
            </Button>
          </Form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-brand-500 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
}
