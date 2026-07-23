import { api, type ApiResponse } from "./client";
import type { AuthUser } from "@/store/auth";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResult {
  tokens: TokenPair;
  user: AuthUser;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResult> {
  const res = await api.post<ApiResponse<LoginResult>>("/auth/login", {
    email,
    password,
  });
  return res.data.data;
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await api.post("/auth/logout", { refresh_token: refreshToken });
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await api.get<ApiResponse<AuthUser>>("/auth/me");
  return res.data.data;
}

export async function registerRequest(payload: {
  email: string;
  fullName: string;
  password: string;
}): Promise<void> {
  await api.post("/auth/register", payload);
}

export async function verifyOtpRequest(payload: {
  email: string;
  otp_code: string;
}): Promise<AuthUser> {
  const res = await api.post<ApiResponse<AuthUser>>("/auth/verify-otp", payload);
  return res.data.data;
}

export async function resendOtpRequest(payload: {
  email: string;
  purpose?: string;
}): Promise<void> {
  await api.post("/auth/resend-otp", payload);
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await api.post("/auth/forgot-password", { email });
}

export async function resetPasswordRequest(payload: {
  email: string;
  otp_code: string;
  new_password: string;
}): Promise<void> {
  await api.post("/auth/reset-password", payload);
}
