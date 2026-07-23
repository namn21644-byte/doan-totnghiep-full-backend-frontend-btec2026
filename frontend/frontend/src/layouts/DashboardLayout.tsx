import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  App as AntApp,
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Menu,
  Tooltip,
} from "antd";
import {
  Bell,
  Crosshair,
  LayoutDashboard,
  MonitorSmartphone,
  Radar,
  ShieldAlert,
  FileText,
  ScrollText,
  Settings,
  Users,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useNotificationStore } from "@/store/notifications";
import { logoutRequest } from "@/api/auth";
import useWebSocket from "@/hooks/useWebSocket";

const { Header, Sider, Content } = Layout;

const NAV_ITEMS = [
  { key: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { key: "/devices", icon: <MonitorSmartphone size={18} />, label: "Thiết bị" },
  { key: "/scans", icon: <Radar size={18} />, label: "Phiên quét" },
  { key: "/attack-simulation", icon: <Crosshair size={18} />, label: "Mô phỏng tấn công" },
  { key: "/alerts", icon: <ShieldAlert size={18} />, label: "Cảnh báo" },
  { key: "/logs", icon: <ScrollText size={18} />, label: "Log" },
  { key: "/reports", icon: <FileText size={18} />, label: "Báo cáo" },
  { key: "/users", icon: <Users size={18} />, label: "Người dùng" },
  { key: "/settings", icon: <Settings size={18} />, label: "Cài đặt" },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = AntApp.useApp();
  const { user, refreshToken, clear } = useAuthStore();
  const { mode, toggle } = useThemeStore();
  const unreadAlerts = useNotificationStore((s) => s.unreadAlerts);
  const resetAlerts = useNotificationStore((s) => s.resetAlerts);

  useWebSocket();

  async function handleLogout() {
    try {
      if (refreshToken) await logoutRequest(refreshToken);
    } catch {
      // Ignore network errors on logout; clear local session anyway.
    } finally {
      clear();
      message.success("Đã đăng xuất");
      navigate("/login", { replace: true });
    }
  }

  const isDark = mode === "dark";

  const selectedKey =
    NAV_ITEMS.find(
      (item) =>
        location.pathname === item.key ||
        (item.key !== "/dashboard" && location.pathname.startsWith(item.key)),
    )?.key ?? location.pathname;

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        theme={isDark ? "dark" : "light"}
        width={230}
      >
        <div className="flex h-16 items-center gap-2 px-4">
          <ShieldCheck className="h-7 w-7 shrink-0 text-brand-500" />
          {!collapsed && (
            <span className="text-lg font-semibold">NetworkScan</span>
          )}
        </div>
        <Menu
          theme={isDark ? "dark" : "light"}
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <Button
            type="text"
            onClick={() => setCollapsed((c) => !c)}
            className="text-base"
          >
            ☰
          </Button>

          <div className="flex items-center gap-4">
            <Tooltip title={isDark ? "Chế độ sáng" : "Chế độ tối"}>
              <Button
                type="text"
                icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
                onClick={toggle}
              />
            </Tooltip>

            <Tooltip title="Cảnh báo mới">
              <Badge count={unreadAlerts} overflowCount={99}>
                <Button
                  type="text"
                  icon={<Bell size={18} />}
                  onClick={() => {
                    resetAlerts();
                    navigate("/alerts");
                  }}
                />
              </Badge>
            </Tooltip>

            <Dropdown
              menu={{
                items: [
                  {
                    key: "logout",
                    icon: <LogOut size={16} />,
                    label: "Đăng xuất",
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <div className="flex cursor-pointer items-center gap-2">
                <Avatar className="bg-brand-600">
                  {user?.full_name?.charAt(0) ?? "U"}
                </Avatar>
                <div className="hidden text-left leading-tight sm:block">
                  <div className="text-sm font-medium">{user?.full_name}</div>
                  <div className="text-xs text-slate-500">
                    {user?.roles?.join(", ")}
                  </div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="bg-slate-50 p-6 dark:bg-slate-950">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
