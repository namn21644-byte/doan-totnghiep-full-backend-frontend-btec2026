import { useEffect } from "react";

import { Navigate, Route, Routes } from "react-router-dom";

import { App as AntApp, ConfigProvider, theme as antdTheme } from "antd";

import { useThemeStore } from "@/store/theme";

import { useAuthStore } from "@/store/auth";

import LoginPage from "@/pages/Login";

import RegisterPage from "@/pages/Register";

import ForgotPasswordPage from "@/pages/ForgotPassword";

import DashboardPage from "@/pages/Dashboard";

import DevicesPage from "@/pages/Devices";

import DeviceDetailPage from "@/pages/DeviceDetail";

import ScansPage from "@/pages/Scans";

import ScanCreatePage from "@/pages/ScanCreate";

import ScanDetailPage from "@/pages/ScanDetail";

import AlertsPage from "@/pages/Alerts";

import LogsPage from "@/pages/Logs";

import ReportsPage from "@/pages/Reports";

import UsersPage from "@/pages/Users";

import SettingsPage from "@/pages/Settings";

import RiskRulesPage from "@/pages/RiskRules";

import AttackSimulationPage from "@/pages/AttackSimulation";

import DashboardLayout from "@/layouts/DashboardLayout";



function ProtectedRoute({ children }: { children: JSX.Element }) {

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {

    return <Navigate to="/login" replace />;

  }

  return children;

}



export default function App() {

  const mode = useThemeStore((s) => s.mode);



  useEffect(() => {

    const root = document.documentElement;

    if (mode === "dark") {

      root.classList.add("dark");

    } else {

      root.classList.remove("dark");

    }

  }, [mode]);



  return (

    <ConfigProvider

      theme={{

        algorithm:

          mode === "dark"

            ? antdTheme.darkAlgorithm

            : antdTheme.defaultAlgorithm,

        token: { colorPrimary: "#2563eb", borderRadius: 8 },

      }}

    >

      <AntApp>

        <Routes>

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route

            path="/"

            element={

              <ProtectedRoute>

                <DashboardLayout />

              </ProtectedRoute>

            }

          >

            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="devices" element={<DevicesPage />} />

            <Route path="devices/:id" element={<DeviceDetailPage />} />

            <Route path="scans" element={<ScansPage />} />

            <Route path="scans/create" element={<ScanCreatePage />} />

            <Route path="scans/:id" element={<ScanDetailPage />} />

            <Route path="alerts" element={<AlertsPage />} />

            <Route path="logs" element={<LogsPage />} />

            <Route path="reports" element={<ReportsPage />} />

            <Route path="users" element={<UsersPage />} />

            <Route path="settings" element={<SettingsPage />} />

            <Route path="risk-rules" element={<RiskRulesPage />} />

            <Route path="attack-simulation" element={<AttackSimulationPage />} />

          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>

      </AntApp>

    </ConfigProvider>

  );

}

