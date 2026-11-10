import { useEffect, useMemo, useState } from 'react'
import './PayrollPage.css'
import PageHeader from './components/PageHeader'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import profileImage from './assets/profile.png'
import walletIcon from './assets/dompet.png'
import employeesIcon from './assets/gaji-karyawan.png'
import averageIcon from './assets/money.png'
import paymentStatusIcon from './assets/checklist.png'
import salaryIllustration from './assets/penggajian-page-image.png'
import searchIcon from './assets/search.png'
import viewIcon from './assets/eyes.png'
import calendarIcon from './assets/date.png'
import { fetchPayrollData } from './services/payrollService'

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const pageSize = 5

function formatCurrency(value) {
  return currency.format(value).replace(/\u00a0/g, ' ')
}

function PayrollStatus({ status }) {
  const statusClass = status === 'Selesai' ? 'completed' : status === 'Siap Diambil' ? 'ready' : 'processing'
  return <span className={`payroll-status payroll-status--${statusClass}`}>{status}</span>
}

function PayrollDetailDialog({ payment, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="payroll-dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="payroll-dialog" role="dialog" aria-modal="true" aria-labelledby="payroll-dialog-title">
        <header className="payroll-dialog__heading">
          <div>
            <h2 id="payroll-dialog-title">Detail Penggajian</h2>
            <p>Rincian pembayaran karyawan</p>
          </div>
          <button type="button" className="payroll-dialog__close" aria-label="Tutup detail penggajian" onClick={onClose}>×</button>
        </header>
        <div className="payroll-dialog__employee">
          <img src={profileImage} alt="" />
          <div><strong>{payment.employee.name}</strong><span>{payment.division}</span></div>
          <PayrollStatus status={payment.status} />
        </div>
        <dl className="payroll-dialog__data">
          <div><dt>Periode</dt><dd>{payment.period}</dd></div>
          <div><dt>Nominal gaji</dt><dd>{formatCurrency(payment.nominal)}</dd></div>
          <div><dt>Tanggal pembayaran</dt><dd>{payment.paidAt || 'Menunggu proses pembayaran'}</dd></div>
          <div><dt>Status</dt><dd>{payment.status}</dd></div>
        </dl>
        <button type="button" className="payroll-button payroll-button--primary payroll-dialog__done" onClick={onClose}>Tutup</button>
      </section>
    </div>
  )
}

function PayrollPage() {
  useDocumentTitle('Penggajian')
  const [payroll, setPayroll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('Juni 2026')
  const [query, setQuery] = useState('')
  const [division, setDivision] = useState('Semua Divisi')
  const [statusFilter, setStatusFilter] = useState('Semua Status')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [claimRequested, setClaimRequested] = useState(false)
  const [claimMessage, setClaimMessage] = useState('')
  const [showAllActivities, setShowAllActivities] = useState(false)

  async function loadPayroll() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPayrollData()
      setPayroll(data)
      setPeriod((current) => data.periods.includes(current) ? current : data.periods[0])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Data penggajian tidak dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchPayrollData()
      .then((data) => {
        if (!active) return
        setPayroll(data)
        setPeriod(data.periods[0])
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Data penggajian tidak dapat dimuat.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const periodPayments = useMemo(
    () => payroll?.employees.filter((payment) => payment.period === period) || [],
    [payroll, period],
  )
  const filteredPayments = useMemo(() => periodPayments.filter((payment) => {
    const matchesQuery = `${payment.employee.name} ${payment.division}`.toLowerCase().includes(query.trim().toLowerCase())
    return matchesQuery
      && (division === 'Semua Divisi' || payment.division === division)
      && (statusFilter === 'Semua Status' || payment.status === statusFilter)
  }), [periodPayments, query, division, statusFilter])
  const totalPayroll = periodPayments.reduce((total, payment) => total + payment.nominal, 0)
  const completedCount = periodPayments.filter(({ status }) => status === 'Selesai').length
  const completion = periodPayments.length ? Math.round((completedCount / periodPayments.length) * 100) : 0
  const averageSalary = periodPayments.length ? Math.round(totalPayroll / periodPayments.length) : 0
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize))
  const visiblePayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const ownPayment = payroll?.employees.find(({ employeeId, period: paymentPeriod }) => (
    employeeId === payroll.currentEmployeeId && paymentPeriod === period
  ))
  const ownEmployee = payroll?.employees.find(({ employeeId }) => employeeId === payroll.currentEmployeeId)?.employee
  const canClaimSalary = Boolean(ownPayment && period === payroll?.periods[0])
  const ownStatus = claimRequested
    ? 'Permintaan Diajukan'
    : canClaimSalary
      ? payroll?.currentEmployeeStatus || ownPayment?.status
      : ownPayment?.status || 'Belum Tersedia'
  const activities = showAllActivities ? payroll?.activities || [] : (payroll?.activities || []).slice(0, 4)

  function changePeriod(nextPeriod) {
    setPeriod(nextPeriod)
    setCurrentPage(1)
    setClaimRequested(false)
    setClaimMessage('')
  }

  function requestSalary() {
    setClaimRequested(true)
    setClaimMessage('Permintaan pengambilan gaji berhasil diajukan.')
  }

  const metrics = [
    { label: 'Total Payroll', value: formatCurrency(totalPayroll), trend: payroll?.summaryTrends?.totalPayroll, icon: walletIcon, color: 'blue' },
    { label: 'Total Karyawan', value: String(periodPayments.length), trend: payroll?.summaryTrends?.employeeCount, icon: employeesIcon, color: 'green' },
    { label: 'Rata-rata Gaji', value: formatCurrency(averageSalary), trend: payroll?.summaryTrends?.averageSalary, icon: averageIcon, color: 'purple' },
  ]

  return (
    <section className="payroll-page" aria-label="Halaman penggajian">
      <PageHeader title="Penggajian" subtitle="Ringkasan dan daftar pembayaran gaji karyawan" />
      {error ? (
        <div className="payroll-request-state" role="alert">
          <h2>Data penggajian belum dapat dimuat</h2>
          <p>{error}</p>
          <button type="button" className="payroll-button payroll-button--primary" onClick={loadPayroll}>Coba lagi</button>
        </div>
      ) : (
        <>
          <section className="payroll-metrics" aria-label="Ringkasan penggajian">
            {metrics.map((metric) => (
              <article className={`payroll-metric payroll-metric--${metric.color}`} key={metric.label}>
                <div className="payroll-metric__heading">
                  <span className="payroll-metric__icon" aria-hidden="true"><img src={metric.icon} alt="" /></span>
                  <h2>{metric.label}</h2>
                </div>
                <div className="payroll-metric__body">
                  {loading ? <span className="payroll-skeleton" /> : <strong>{metric.value}</strong>}
                  <div className="payroll-metric__trend">
                    {loading ? <span className="payroll-skeleton payroll-skeleton--trend" /> : (
                      <>
                        <span className="payroll-metric__growth" aria-label={`Naik ${metric.trend?.percentage}%`}>
                          <span aria-hidden="true">↑</span> {metric.trend?.percentage}%
                        </span>
                        <span className="payroll-metric__note">{metric.trend?.description}</span>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
            <article className="payroll-metric payroll-metric--orange">
              <div className="payroll-metric__heading">
                <span className="payroll-metric__icon" aria-hidden="true"><img src={paymentStatusIcon} alt="" /></span>
                <h2>Status Penggajian</h2>
              </div>
              <div className="payroll-metric__body payroll-metric__body--progress">
                {loading ? <span className="payroll-skeleton" /> : (
                  <strong>{completion === 100 ? 'Selesai' : 'Diproses'}</strong>
                )}
                <span className="payroll-progress__label">{loading ? 'Memuat progres...' : `${completion}% Selesai`}</span>
                <span
                  className="payroll-progress"
                  role="progressbar"
                  aria-label="Progres penggajian"
                  aria-valuenow={completion}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span style={{ width: `${completion}%` }} />
                </span>
              </div>
            </article>
          </section>

          <div className="payroll-toolbar">
            <label className="payroll-period-select">
              <span className="visually-hidden">Pilih periode penggajian</span>
              <img className="payroll-period-select__icon" src={calendarIcon} alt="" />
              <select value={period} disabled={loading || !payroll} onChange={(event) => changePeriod(event.target.value)}>
                {(payroll?.periods || ['Memuat periode...']).map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {loading ? (
            <p className="payroll-loading" role="status">Memuat data penggajian...</p>
          ) : (
            <div className="payroll-content-grid">
              <section className="payroll-panel payroll-list-panel" aria-labelledby="payroll-list-title">
                <header className="payroll-list-heading">
                  <h2 id="payroll-list-title">Daftar Penggajian</h2>
                  <div className="payroll-filters">
                    <label className="payroll-search">
                      <img src={searchIcon} alt="" />
                      <span className="visually-hidden">Cari nama atau divisi karyawan</span>
                      <input value={query} onChange={(event) => {
                        setQuery(event.target.value)
                        setCurrentPage(1)
                      }} placeholder="Cari karyawan" />
                    </label>
                    <label className="payroll-filter-select">
                      <span className="visually-hidden">Filter divisi</span>
                      <select value={division} onChange={(event) => {
                        setDivision(event.target.value)
                        setCurrentPage(1)
                      }}>
                        <option>Semua Divisi</option>
                        {[...new Set(periodPayments.map(({ division: itemDivision }) => itemDivision))].map((itemDivision) => <option key={itemDivision}>{itemDivision}</option>)}
                      </select>
                    </label>
                    <label className="payroll-filter-select">
                      <span className="visually-hidden">Filter status</span>
                      <select value={statusFilter} onChange={(event) => {
                        setStatusFilter(event.target.value)
                        setCurrentPage(1)
                      }}>
                        <option>Semua Status</option>
                        <option>Diproses</option>
                        <option>Siap Diambil</option>
                        <option>Selesai</option>
                      </select>
                    </label>
                  </div>
                </header>
                <div className="payroll-table-wrap">
                  <table className="payroll-table">
                    <thead>
                      <tr>
                        <th scope="col">Nama Karyawan</th>
                        <th scope="col">Divisi</th>
                        <th scope="col">Nominal</th>
                        <th scope="col">Status</th>
                        <th scope="col">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePayments.map((payment) => (
                        <tr key={`${payment.period}-${payment.employeeId}`}>
                          <td><span className="payroll-employee"><img src={profileImage} alt="" />{payment.employee.name}</span></td>
                          <td>{payment.division}</td>
                          <td className="payroll-amount">{formatCurrency(payment.nominal)}</td>
                          <td><PayrollStatus status={payment.status} /></td>
                          <td>
                            <button className="payroll-view-button" type="button" aria-label={`Lihat gaji ${payment.employee.name}`} onClick={() => setSelectedPayment(payment)}>
                              <img src={viewIcon} alt="" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {visiblePayments.length === 0 && <tr><td className="payroll-empty-row" colSpan="5">Tidak ada data penggajian yang cocok dengan pencarian atau filter.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <footer className="payroll-pagination">
                  <p>
                    Menampilkan {filteredPayments.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredPayments.length)} dari {filteredPayments.length} data
                  </p>
                  <div className="payroll-pagination__controls" aria-label="Halaman daftar penggajian">
                    <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>‹</button>
                    <span>Halaman {currentPage} dari {totalPages}</span>
                    <button type="button" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>›</button>
                  </div>
                </footer>
              </section>

              <aside className="payroll-side-column">
                <section className="payroll-panel payroll-own-card" aria-labelledby="payroll-own-title">
                  <header className="payroll-side-heading">
                    <h2 id="payroll-own-title">Gaji Saya</h2>
                  </header>
                  <div className="payroll-own-summary">
                    <div>
                      <span>Periode</span>
                      <strong>{period}</strong>
                      <span>Nominal</span>
                      <strong>{formatCurrency(ownPayment?.nominal || 0)}</strong>
                    </div>
                    <img src={salaryIllustration} alt="" />
                  </div>
                  <div className="payroll-own-status">
                    <span>Status Penggajian</span>
                    <PayrollStatus status={ownStatus} />
                  </div>
                    <button className="payroll-claim-button" type="button" onClick={requestSalary} disabled={claimRequested || !canClaimSalary}>
                      {claimRequested ? 'Permintaan Diajukan' : canClaimSalary ? 'Ambil Gaji' : ownPayment?.status === 'Selesai' ? 'Gaji Sudah Dibayar' : 'Menunggu Proses'}
                  </button>
                  {claimMessage && <p className="payroll-claim-message" role="status">{claimMessage}</p>}
                  {!ownEmployee && <p className="payroll-own-note">Data karyawan belum tersedia untuk periode ini.</p>}
                </section>

                <section className="payroll-panel payroll-activity-panel" id="payroll-history" aria-labelledby="payroll-activity-title">
                  <header className="payroll-side-heading">
                    <h2 id="payroll-activity-title">Aktivitas Terbaru</h2>
                    <button type="button" onClick={() => setShowAllActivities((shown) => !shown)}>{showAllActivities ? 'Ringkas' : 'Lihat Semua'}</button>
                  </header>
                  <ul className="payroll-activities">
                    {activities.map((activity) => (
                      <li key={activity.id}>
                        <strong>{activity.title}</strong>
                        <span>Oleh {activity.actor}</span>
                        <time>{activity.date} · {activity.time}</time>
                      </li>
                    ))}
                    {!activities.length && <li className="payroll-activity-empty">Belum ada aktivitas.</li>}
                  </ul>
                </section>
              </aside>
            </div>
          )}
        </>
      )}
      {selectedPayment && <PayrollDetailDialog payment={selectedPayment} onClose={() => setSelectedPayment(null)} />}
    </section>
  )
}

export default PayrollPage
