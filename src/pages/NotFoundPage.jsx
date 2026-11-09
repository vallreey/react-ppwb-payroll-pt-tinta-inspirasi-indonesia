import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Button from '../components/Button';

export default function NotFoundPage() {
  useDocumentTitle('Halaman tidak ditemukan');
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="text-xl font-semibold text-gray-900">Halaman tidak ditemukan</h1>
      <p className="text-sm text-gray-600">Alamat yang Anda buka tidak ada atau sudah dipindahkan.</p>
      <Button to="/dashboard" className="mt-3">Kembali ke Dashboard</Button>
    </main>
  );
}
