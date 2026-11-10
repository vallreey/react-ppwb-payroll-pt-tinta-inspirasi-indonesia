import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { GuestRoute, ProtectedRoute } from "./components/RouteGuards";
import { useLayoutHeader } from "./context/LayoutContext";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import TrackingPage from "./TrackingPage.jsx";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PayrollPage = lazy(() => import("./PayrollPage.jsx"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const AttendanceRecordPage = lazy(() => import("./pages/AttendanceRecordPage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const EmployeeDetailPage = lazy(() => import("./pages/EmployeeDetailPage"));
const EmployeeFormPage = lazy(() => import("./pages/EmployeeFormPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const UserFormPage = lazy(() => import("./pages/UserFormPage"));
const UserApprovalsPage = lazy(() => import("./pages/UserApprovalsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const LeavePage = lazy(() => import("./pages/LeavePage"));
const LeaveRequestPage = lazy(() => import("./pages/LeaveRequestPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

const MANAGERS = ["super_admin", "hrd", "supervisor", "direktur"];
const LEAVE_MANAGERS = ["super_admin", "hrd"];

function TrackingRoute() {
  const setHeader = useLayoutHeader();
  useDocumentTitle("Tracking Lokasi");

  useEffect(() => {
    setHeader({
      title: "Tracking Lokasi",
      subtitle: "Pantau lokasi dan pergerakan karyawan secara real-time",
    });
  }, [setHeader]);

  return <TrackingPage />;
}

function PageLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500"
    >
      <span
        className="mr-3 size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
        aria-hidden="true"
      />
      Memuat halaman…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/penggajian" element={<PayrollPage />} />
            <Route path="/absensi" element={<AttendancePage />} />
            <Route path="/absensi/catat" element={<AttendanceRecordPage />} />
            <Route path="/tracking-lokasi" element={<TrackingRoute />} />
            <Route path="/profil" element={<ProfilePage />} />

            <Route element={<ProtectedRoute roles={MANAGERS} />}>
              <Route path="/karyawan" element={<EmployeesPage />} />
              <Route path="/karyawan/:id" element={<EmployeeDetailPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={["super_admin", "hrd"]} />}>
              <Route path="/karyawan/baru" element={<EmployeeFormPage />} />
              <Route path="/karyawan/:id/ubah" element={<EmployeeFormPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={LEAVE_MANAGERS} />}>
              <Route path="/izin-cuti" element={<LeavePage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute roles={["karyawan", "supervisor", "hrd"]} />
              }
            >
              <Route
                path="/pengajuan-izin-cuti"
                element={<LeaveRequestPage />}
              />
            </Route>

            <Route element={<ProtectedRoute roles={["super_admin"]} />}>
              <Route path="/pengguna" element={<UsersPage />} />
              <Route path="/pengguna/baru" element={<UserFormPage />} />
              <Route path="/pengguna/:id/ubah" element={<UserFormPage />} />
              <Route path="/persetujuan-akun" element={<UserApprovalsPage />} />
              <Route path="/pengaturan" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
