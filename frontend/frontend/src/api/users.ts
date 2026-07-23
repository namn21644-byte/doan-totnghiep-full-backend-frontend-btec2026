import { api, type ApiResponse } from "./client";
import type { PaginatedResult } from "./devices";

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_email_verified: boolean;
  roles: string[];
  last_login_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface UserCreatePayload {
  email: string;
  full_name: string;
  password: string;
  roles?: string[];
  is_active?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  full_name?: string;
  password?: string;
  roles?: string[];
  is_active?: boolean;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  role?: string;
}

export async function listUsers(
  params: UserListParams = {},
): Promise<PaginatedResult<User>> {
  const res = await api.get<ApiResponse<User[]>>("/users", { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { page: 1, page_size: 20, total: 0 },
  };
}

export async function getUser(id: number): Promise<User> {
  const res = await api.get<ApiResponse<User>>(`/users/${id}`);
  return res.data.data;
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  const res = await api.post<ApiResponse<User>>("/users", payload);
  return res.data.data;
}

export async function updateUser(
  id: number,
  payload: UserUpdatePayload,
): Promise<User> {
  const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
  return res.data.data;
}

export async function updateUserStatus(
  id: number,
  isActive: boolean,
): Promise<User> {
  const res = await api.patch<ApiResponse<User>>(`/users/${id}/status`, {
    is_active: isActive,
  });
  return res.data.data;
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}
