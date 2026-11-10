import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

const FullScreenLoading = () => (
  <div role="status" className="flex min-h-screen items-center justify-center text-sm text-gray-500">
    <span className="mr-3 size-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" aria-hidden="true" />
    Memuat aplikasi…
  </div>
);

export function ProtectedRoute({ roles }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div role="alert" className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
        <h1 className="text-lg font-semibold text-gray-900">Akses ditolak</h1>
        <p className="mt-2 text-sm text-gray-600">Peran Anda tidak memiliki hak untuk membuka halaman ini.</p>
        <Button to="/dashboard" className="mt-5">Kembali ke Dashboard</Button>
      </div>
    );
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { status, user } = useAuth();
  if (status === 'loading') return <FullScreenLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
