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
  Switch,
  Table,
  Tag,
} from "antd";
import { Pencil, Plus, Trash2, UserCog } from "lucide-react";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  updateUserStatus,
  type User,
} from "@/api/users";
import EmptyState from "@/components/EmptyState";
import { useAuthStore } from "@/store/auth";
import { formatDateTime } from "@/utils/format";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "analyst", label: "Analyst" },
  { value: "viewer", label: "Viewer" },
];

interface UserFormValues {
  email: string;
  full_name: string;
  password?: string;
  roles: string[];
  is_active: boolean;
}

export default function UsersPage() {
  const { message, modal } = AntApp.useApp();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.roles?.includes("admin");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { control, handleSubmit, reset, setValue } = useForm<UserFormValues>({
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      roles: ["viewer"],
      is_active: true,
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, pageSize, search],
    queryFn: () => listUsers({ page, page_size: pageSize, search }),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success("Tạo người dùng thành công");
      setCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      message.error(err.response?.data?.message ?? "Tạo người dùng thất bại");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<UserFormValues> }) =>
      updateUser(id, payload),
    onSuccess: () => {
      message.success("Cập nhật thành công");
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => message.error("Cập nhật thất bại"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      updateUserStatus(id, active),
    onSuccess: () => {
      message.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success("Đã xóa người dùng");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: () => message.error("Xóa thất bại"),
  });

  function openEdit(user: User) {
    setEditUser(user);
    setValue("email", user.email);
    setValue("full_name", user.full_name);
    setValue("roles", user.roles);
    setValue("is_active", user.is_active);
    setValue("password", "");
  }

  const formModal = (open: boolean, onClose: () => void, isEdit: boolean) => (
    <Modal
      title={isEdit ? "Sửa người dùng" : "Thêm người dùng"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        layout="vertical"
        onFinish={handleSubmit((values) => {
          if (isEdit && editUser) {
            const payload: Partial<UserFormValues> = {
              email: values.email,
              full_name: values.full_name,
              roles: values.roles,
              is_active: values.is_active,
            };
            if (values.password) payload.password = values.password;
            updateMutation.mutate({ id: editUser.id, payload });
          } else {
            createMutation.mutate({
              email: values.email,
              full_name: values.full_name,
              password: values.password!,
              roles: values.roles,
              is_active: values.is_active,
            });
          }
        })}
      >
        <Form.Item label="Email" required>
          <Controller
            name="email"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <Input {...field} type="email" />}
          />
        </Form.Item>
        <Form.Item label="Họ tên" required>
          <Controller
            name="full_name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => <Input {...field} />}
          />
        </Form.Item>
        <Form.Item label={isEdit ? "Mật khẩu mới (để trống nếu không đổi)" : "Mật khẩu"} required={!isEdit}>
          <Controller
            name="password"
            control={control}
            rules={isEdit ? {} : { required: "Nhập mật khẩu", minLength: { value: 8, message: "Tối thiểu 8 ký tự" } }}
            render={({ field, fieldState }) => (
              <>
                <Input.Password {...field} />
                {fieldState.error && (
                  <span className="text-xs text-red-500">{fieldState.error.message}</span>
                )}
              </>
            )}
          />
        </Form.Item>
        <Form.Item label="Vai trò">
          <Controller
            name="roles"
            control={control}
            render={({ field }) => (
              <Select {...field} mode="multiple" options={ROLE_OPTIONS} />
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
          <Button onClick={onClose}>Hủy</Button>
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
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Người dùng</h1>
          <p className="text-sm text-slate-500">Quản lý tài khoản và phân quyền</p>
        </div>
        {isAdmin && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Thêm người dùng
          </Button>
        )}
      </div>

      <Card className="dark:bg-slate-900">
        <div className="mb-4 flex gap-3">
          <Input.Search
            placeholder="Tìm theo email, tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
          <EmptyState description="Không có người dùng" />
        ) : (
          <Table<User>
            rowKey="id"
            dataSource={data.items}
            columns={[
              { title: "Email", dataIndex: "email" },
              { title: "Họ tên", dataIndex: "full_name" },
              {
                title: "Vai trò",
                dataIndex: "roles",
                render: (roles: string[]) =>
                  roles.map((r) => (
                    <Tag key={r} color="blue">
                      {r}
                    </Tag>
                  )),
              },
              {
                title: "Trạng thái",
                dataIndex: "is_active",
                render: (active: boolean, record: User) =>
                  isAdmin ? (
                    <Switch
                      checked={active}
                      onChange={(v) => statusMutation.mutate({ id: record.id, active: v })}
                      disabled={record.id === currentUser?.id}
                    />
                  ) : (
                    <Tag color={active ? "green" : "red"}>{active ? "Hoạt động" : "Khóa"}</Tag>
                  ),
              },
              {
                title: "Đăng nhập gần nhất",
                dataIndex: "last_login_at",
                render: formatDateTime,
              },
              ...(isAdmin
                ? [
                    {
                      title: "Thao tác",
                      key: "actions",
                      render: (_: unknown, record: User) => (
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
                            disabled={record.id === currentUser?.id}
                            onClick={() => {
                              modal.confirm({
                                title: "Xóa người dùng?",
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

      {!isAdmin && (
        <Card className="border-dashed dark:bg-slate-900">
          <Space>
            <UserCog size={18} className="text-slate-400" />
            <span className="text-sm text-slate-500">
              Chỉ admin mới có thể tạo, sửa và xóa người dùng.
            </span>
          </Space>
        </Card>
      )}

      {formModal(createOpen, () => setCreateOpen(false), false)}
      {formModal(!!editUser, () => setEditUser(null), true)}
    </div>
  );
}
