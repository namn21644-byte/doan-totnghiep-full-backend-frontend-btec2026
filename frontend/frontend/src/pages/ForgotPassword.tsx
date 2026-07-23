import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { App as AntApp, Button, Card, Form, Input, Steps } from "antd";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import {
  forgotPasswordRequest,
  resetPasswordRequest,
  resendOtpRequest,
} from "@/api/auth";

interface EmailForm {
  email: string;
}

interface ResetForm {
  otp_code: string;
  new_password: string;
  confirm_password: string;
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailForm>();
  const resetForm = useForm<ResetForm>();

  async function onSendOtp(values: EmailForm) {
    setLoading(true);
    try {
      await forgotPasswordRequest(values.email);
      setEmail(values.email);
      setStep(1);
      message.success("Nếu email tồn tại, mã OTP đã được gửi");
    } catch (err) {
      const detail =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Gửi yêu cầu thất bại";
      message.error(detail);
    } finally {
      setLoading(false);
    }
  }

  async function onReset(values: ResetForm) {
    if (values.new_password !== values.confirm_password) {
      message.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordRequest({
        email,
        otp_code: values.otp_code,
        new_password: values.new_password,
      });
      message.success("Đặt lại mật khẩu thành công");
      navigate("/login", { replace: true });
    } catch (err) {
      const detail =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Đặt lại mật khẩu thất bại";
      message.error(detail);
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    try {
      await resendOtpRequest({ email, purpose: "reset_password" });
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
          <h1 className="text-2xl font-semibold text-white">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-slate-400">Khôi phục quyền truy cập tài khoản</p>
        </div>

        <Steps
          size="small"
          current={step}
          className="mb-6"
          items={[{ title: "Email" }, { title: "Đặt lại MK" }]}
        />

        {step === 0 ? (
          <Form layout="vertical" onFinish={emailForm.handleSubmit(onSendOtp)}>
            <Form.Item label={<span className="text-slate-300">Email đăng ký</span>} required>
              <Controller
                name="email"
                control={emailForm.control}
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
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Gửi mã OTP
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={resetForm.handleSubmit(onReset)}>
            <Form.Item label={<span className="text-slate-300">Mã OTP</span>} required>
              <Controller
                name="otp_code"
                control={resetForm.control}
                rules={{ required: "Nhập mã OTP" }}
                render={({ field, fieldState }) => (
                  <>
                    <Input {...field} size="large" placeholder="123456" />
                    {fieldState.error && (
                      <span className="text-xs text-red-500">{fieldState.error.message}</span>
                    )}
                  </>
                )}
              />
            </Form.Item>
            <Form.Item label={<span className="text-slate-300">Mật khẩu mới</span>} required>
              <Controller
                name="new_password"
                control={resetForm.control}
                rules={{ required: true, minLength: { value: 8, message: "Tối thiểu 8 ký tự" } }}
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
                control={resetForm.control}
                rules={{ required: "Xác nhận mật khẩu" }}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<Lock size={16} />} size="large" />
                )}
              />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Đặt lại mật khẩu
            </Button>
            <Button type="link" block onClick={resendOtp} className="mt-2">
              Gửi lại OTP
            </Button>
          </Form>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/login" className="text-brand-500 hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </Card>
    </div>
  );
}
