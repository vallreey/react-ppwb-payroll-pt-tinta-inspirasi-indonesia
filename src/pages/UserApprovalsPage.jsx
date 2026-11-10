import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { userService } from '../services/userService';
import { formatDateTime } from '../utils/format';
import Button from '../components/Button';
import Tabs from '../components/Tabs';
import PageHeader from '../components/PageHeader';
import { useConfirm } from '../hooks/useConfirm';
import { EmptyState, ErrorState, TableSkeleton } from '../components/StateViews';
import { thClass } from '../components/ui';

const TAB_DEFS = [['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak']];

export default function UserApprovalsPage() {
  useDocumentTitle('Persetujuan Akun');
  const { user: me } = useAuth();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [tab, setTab] = useState('pending');
  const { data, loading, error, reload } = useFetch(() => userService.list(), []);

  const users = (data?.users ?? []).filter((u) => u.employee && u.role === 'karyawan');
  const counts = Object.fromEntries(TAB_DEFS.map(([k]) => [k, users.filter((u) => u.status_persetujuan === k).length]));
  const rows = users.filter((u) => u.status_persetujuan === tab);
  const nameOf = (id) => data?.users.find((u) => u.id_pengguna === id)?.nama_tampil ?? '-';

  const decide = async (u, approve) => {
    if (!(await confirm({ title: approve ? 'Setujui akun?' : 'Tolak akun?', message: `${approve ? 'Setujui' : 'Tolak'} akun ${u.nama_tampil}?`, confirmLabel: approve ? 'Setujui' : 'Tolak', tone: approve ? 'primary' : 'danger' }))) return;
    try {
      await (approve ? userService.approve(u.id_pengguna, me) : userService.reject(u.id_pengguna, me));
      toast.success(approve ? 'Akun disetujui.' : 'Akun ditolak.');
      reload();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader title="Persetujuan Pendaftaran Akun" subtitle="Setujui atau tolak akun karyawan yang baru mendaftar." actions={<Button to="/pengguna" variant="outline">Kembali ke Pengguna</Button>} />
      <section className="rounded-2xl bg-white shadow-card">
        <Tabs label="Status persetujuan" active={tab} onChange={setTab} tabs={TAB_DEFS.map(([id, label]) => ({ id, label: `${label} (${counts[id]})` }))} />
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-5">
          <div className="overflow-x-auto rounded-xl border border-gray-100" aria-busy={loading}>
            {loading && <TableSkeleton rows={4} cols={5} />}
            {error && <ErrorState error={error} onRetry={reload} />}
            {!loading && !error && (
              <table className="w-full min-w-[640px] text-left text-xs">
                <caption className="sr-only">Pendaftaran akun</caption>
                <thead><tr className="bg-slate-100 text-gray-900">
                  {['Nama', 'NIK', 'Email', 'Tanggal Daftar'].map((h) => <th key={h} scope="col" className={thClass}>{h}</th>)}
                  <th scope="col" className={`${thClass} text-right`}>{tab === 'pending' ? 'Aksi' : 'Diproses Oleh'}</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.length === 0 && <tr><td colSpan={5}><EmptyState>Tidak ada data pada tab ini.</EmptyState></td></tr>}
                  {rows.map((u) => (
                    <tr key={u.id_pengguna}>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.nama_tampil}</td>
                      <td className="px-4 py-3 text-gray-600">{u.employee?.nik ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDateTime(u.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {tab === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => decide(u, true)} className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-1.5 font-medium text-green-700 hover:bg-green-100">Setujui</button>
                            <button type="button" onClick={() => decide(u, false)} className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 font-medium text-red-700 hover:bg-red-100">Tolak</button>
                          </div>
                        ) : (
                          <span className="text-gray-600">{nameOf(u.approved_by)}<span className="block text-xs text-gray-400">{u.approved_at && formatDateTime(u.approved_at)}</span></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
      {confirmDialog}
    </>
  );
}
