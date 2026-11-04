import { useEffect, useMemo, useState } from 'react'
import './App.css'
import companyLogo from './assets/logo perusahaan 2.png'
import profileImage from './assets/profile.png'
import attendanceIcon from './assets/karyawan.png'
import employeeStatIcon from './assets/Vecto3r.png'
import serviceStatIcon from './assets/Vecto2r.png'
import jobStatIcon from './assets/Vector.png'
import divisionStatIcon from './assets/Group 7.png'
import dashboardIcon from './assets/dashboard.png'
import payrollIcon from './assets/gaji.png'
import leaveIcon from './assets/izincuti.png'
import trackingIcon from './assets/tracking.png'
import managementIcon from './assets/manajemen.png'
import settingsIcon from './assets/settings.png'
import notificationIcon from './assets/notif.png'
import calendarIcon from './assets/date.png'
import meetIcon from './assets/logos_google-meet.png'

const navigation = [
  { label: 'Dashboard', icon: dashboardIcon },
  { label: 'Absensi', icon: attendanceIcon },
  { label: 'Karyawan', icon: attendanceIcon },
  { label: 'Penggajian', icon: payrollIcon },
  { label: 'Izin & Cuti', icon: leaveIcon },
  { label: 'Tracking Lokasi', icon: trackingIcon },
  { label: 'Manajemen Pengguna', icon: managementIcon },
  { label: 'Settings', icon: settingsIcon },
]

const statIcons = [employeeStatIcon, serviceStatIcon, jobStatIcon, divisionStatIcon]

function Icon({ name, size = 18 }) {
  const paths = {
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function MetricCard({ metric, icon }) {
  return (
    <article className={`metric-card metric-card--${metric.color}`}>
      <div className="metric-card__top">
        <div>
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
        <span className="metric-card__icon">
          <img src={icon} alt="" />
        </span>
      </div>
      <div className="metric-card__bottom">
        <span className="metric-card__trend">
          <span aria-hidden="true">↑</span> {metric.trend}
        </span>
        <span className="metric-card__period">{metric.period}</span>
        <span className="metric-card__arrow" aria-hidden="true">›</span>
      </div>
    </article>
  )
}

function AttendanceCard({ attendance, employeesById, loading }) {
  const totals = attendance.reduce(
    (summary, employee) => ({ ...summary, [employee.status]: (summary[employee.status] || 0) + 1 }),
    {},
  )

  return (
    <section className="panel attendance-panel" aria-labelledby="attendance-title">
      <div className="panel-heading">
        <div>
          <h2 id="attendance-title">Attendance</h2>
          <p className="panel-subtitle">Ringkasan kehadiran hari ini</p>
        </div>
        <button className="icon-button panel-expand" type="button" aria-label="Lihat detail absensi">
          <Icon name="arrow" />
        </button>
      </div>
      <div className="attendance-summary" aria-label="Ringkasan status kehadiran">
        <span><i className="status-dot status-dot--ontime" /> <b>{totals['On-Time'] || 0}</b> On-Time</span>
        <span><i className="status-dot status-dot--late" /> <b>{totals.Late || 0}</b> Late</span>
        <span><i className="status-dot status-dot--absent" /> <b>{totals.Absent || 0}</b> Absent</span>
      </div>
      <div className="attendance-table-wrap">
        <table className="attendance-table">
          <thead>
            <tr>
              <th scope="col">Employee Name</th>
              <th scope="col">Status</th>
              <th scope="col">Check-in</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, index) => (
                <tr key={index} className="loading-row">
                  <td colSpan="3"><span className="skeleton-line" /></td>
                </tr>
              ))
            ) : attendance.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <div className="employee-cell">
                    <img src={profileImage} alt="" />
                    <span>{employeesById[employee.employeeId].name}</span>
                  </div>
                </td>
                <td><span className={`status-pill status-pill--${employee.status.toLowerCase().replace('-', '')}`}>{employee.status}</span></td>
                <td>{employee.checkIn || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AnnouncementPanel({ dashboard, activeTab, onTabChange, onAdd }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Semua')
  const entries = dashboard?.[activeTab] || []
  const filteredEntries = entries.filter((entry) => {
    const matchesText = `${entry.title} ${entry.description}`.toLowerCase().includes(query.toLowerCase())
    return matchesText && (filter === 'Semua' || entry.category === filter)
  })

  return (
    <section className="panel announcement-panel" aria-labelledby="announcement-title">
      <div className="tab-list" role="tablist" aria-label="Konten informasi">
        {[
          ['announcements', 'Announcement'],
          ['submissions', 'Submission'],
          ['tasks', 'Task'],
        ].map(([tab, label]) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            className={`tab-button ${activeTab === tab ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls="announcement-content"
            onClick={() => onTabChange(tab)}
          >
            {label}
          </button>
        ))}
      </div>
      <div id="announcement-content" className="tab-content" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        <h2 id="announcement-title" className="visually-hidden">Informasi perusahaan</h2>
        <div className="announcement-tools">
          <label className="search-field">
            <Icon name="search" size={17} />
            <span className="visually-hidden">Cari informasi</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
          </label>
          <label className="select-field">
            <span className="visually-hidden">Filter kategori</span>
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option>Semua</option>
              <option>Umum</option>
              <option>Internal</option>
            </select>
            <Icon name="chevron" size={16} />
          </label>
        </div>
        <div className="announcement-results" aria-live="polite">
          {filteredEntries.length ? filteredEntries.map((entry) => (
            <article className="announcement-entry" key={entry.id}>
              <span className="announcement-entry__category">{entry.category}</span>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <time dateTime={entry.date}>{entry.dateLabel}</time>
            </article>
          )) : (
            <p className="empty-state">There is no {activeTab === 'announcements' ? 'announcement' : activeTab === 'submissions' ? 'submission' : 'task'}<br />at this time</p>
          )}
        </div>
        {activeTab === 'announcements' && (
          <button className="add-announcement" type="button" onClick={onAdd}>
            <span><Icon name="plus" size={20} /></span>
            Add Announcement
          </button>
        )}
      </div>
    </section>
  )
}

function SchedulePanel({ schedules }) {
  const [selectedType, setSelectedType] = useState('All')
  const visibleSchedules = selectedType === 'All' ? schedules : schedules.filter((item) => item.type === selectedType)

  return (
    <section className="panel schedule-panel" aria-labelledby="schedule-title">
      <div className="schedule-heading">
        <h2 id="schedule-title">Schedule ({visibleSchedules.length})</h2>
        <div className="schedule-filters" role="group" aria-label="Filter jadwal">
          {['All', 'Meetings', 'Event'].map((type) => (
            <button
              key={type}
              type="button"
              className={selectedType === type ? 'is-selected' : ''}
              aria-pressed={selectedType === type}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
        <button className="icon-button calendar-button" type="button" aria-label="Pilih tanggal">
          <img src={calendarIcon} alt="" />
        </button>
      </div>
      <div className="schedule-list">
        {visibleSchedules.map((schedule) => (
          <article className="schedule-item" key={schedule.id}>
            <div className="schedule-item__details">
              <h3><Icon name="people" size={15} />{schedule.title}</h3>
              <p>{schedule.dateLabel}<span aria-hidden="true">●</span>{schedule.time}</p>
              <a href={schedule.meetingUrl} target="_blank" rel="noreferrer">
                <img src={meetIcon} alt="" /> Google Meet <Icon name="arrow" size={14} />
              </a>
            </div>
            <div className="schedule-attendees" aria-label={`${schedule.attendees} peserta`}>
              {Array.from({ length: Math.min(schedule.attendees, 3) }, (_, index) => (
                <img key={index} src={profileImage} alt="" />
              ))}
            </div>
          </article>
        ))}
        {!visibleSchedules.length && <p className="schedule-empty">Tidak ada jadwal untuk kategori ini.</p>}
      </div>
    </section>
  )
}

function AnnouncementDialog({ onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [validationError, setValidationError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim() || !description.trim()) {
      setValidationError('Judul dan deskripsi wajib diisi.')
      return
    }
    onSubmit({ title: title.trim(), description: description.trim() })
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="announcement-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading">
          <h2 id="dialog-title">Tambah pengumuman</h2>
          <button className="icon-button" type="button" aria-label="Tutup" onClick={onClose}><Icon name="close" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Judul
            <input autoFocus required maxLength="80" value={title} onChange={(event) => {
              setTitle(event.target.value)
              setValidationError('')
            }} />
          </label>
          <label>
            Deskripsi
            <textarea required rows="4" maxLength="400" value={description} onChange={(event) => {
              setDescription(event.target.value)
              setValidationError('')
            }} />
          </label>
          {validationError && <p className="form-error" role="alert">{validationError}</p>}
          <div className="dialog-actions">
            <button className="button-secondary" type="button" onClick={onClose}>Batal</button>
            <button className="button-primary" type="submit">Simpan</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [activeTab, setActiveTab] = useState('announcements')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [localAnnouncements, setLocalAnnouncements] = useState([])

  async function fetchDashboard() {
    const [dashboardResponse, employeesResponse] = await Promise.all([
      fetch('/mock/dashboard.json'),
      fetch('/mock/employees.json'),
    ])
    if (!dashboardResponse.ok) throw new Error(`Permintaan data dashboard gagal (${dashboardResponse.status})`)
    if (!employeesResponse.ok) throw new Error(`Permintaan data karyawan gagal (${employeesResponse.status})`)

    const [dashboardData, employees] = await Promise.all([
      dashboardResponse.json(),
      employeesResponse.json(),
    ])
    const employeesById = Object.fromEntries(employees.map((employee) => [employee.id, employee]))
    const missingEmployee = dashboardData.attendance.find(({ employeeId }) => !employeesById[employeeId])
    if (missingEmployee) {
      throw new Error(`Data karyawan dengan ID ${missingEmployee.employeeId} tidak ditemukan.`)
    }

    return { ...dashboardData, employeesById }
  }

  async function loadDashboard() {
    setLoading(true)
    setError('')
    try {
      setDashboard(await fetchDashboard())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Data dashboard tidak dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchDashboard()
      .then((data) => {
        if (active) setDashboard(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Data dashboard tidak dapat dimuat.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 760px)')
    const updateBreakpoint = (event) => setIsMobile(event.matches)
    breakpoint.addEventListener('change', updateBreakpoint)
    return () => breakpoint.removeEventListener('change', updateBreakpoint)
  }, [])

  const currentDashboard = useMemo(() => {
    if (!dashboard) return null
    return { ...dashboard, announcements: [...localAnnouncements, ...dashboard.announcements] }
  }, [dashboard, localAnnouncements])

  function closeMobileSidebar() {
    setMobileSidebarOpen(false)
  }

  function addAnnouncement(entry) {
    setLocalAnnouncements((current) => [
      { ...entry, id: `local-${Date.now()}`, category: 'Internal', dateLabel: 'Baru saja' },
      ...current,
    ])
    setDialogOpen(false)
  }

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {mobileSidebarOpen && <button className="mobile-backdrop" aria-label="Tutup menu" onClick={closeMobileSidebar} />}
      <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar--mobile-open' : ''}`} aria-label="Navigasi utama">
        <a className="brand" href="#" aria-label="Tinta Inspirasi Indonesia, dashboard">
          <img src={companyLogo} alt="PT. Tinta Inspirasi Indonesia" />
        </a>
        <nav className="sidebar-nav">
          {navigation.map((item, index) => (
            <a
              key={item.label}
              href={index === 0 ? '#dashboard' : `#${item.label.toLowerCase().replaceAll(' ', '-')}`}
              className={`sidebar-link ${index === 0 ? 'sidebar-link--active' : ''}`}
              aria-current={index === 0 ? 'page' : undefined}
              onClick={closeMobileSidebar}
              title={!sidebarOpen ? item.label : undefined}
            >
              <img src={item.icon} alt="" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <button
            className="menu-toggle icon-button"
            type="button"
            aria-label={isMobile
              ? mobileSidebarOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'
              : sidebarOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
            aria-expanded={isMobile ? mobileSidebarOpen : sidebarOpen}
            onClick={() => {
              if (isMobile) {
                setMobileSidebarOpen((open) => !open)
              } else {
                setSidebarOpen((open) => !open)
              }
            }}
          >
            <Icon name="menu" />
          </button>
          <div className="welcome">
            <h1>Selamat Pagi, {dashboard?.profile.name || '...' } <span aria-hidden="true">👋</span></h1>
            <p>Hari ini {dashboard?.todayLabel || 'memuat tanggal...'}</p>
          </div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" type="button" aria-label="Notifikasi">
              <img src={notificationIcon} alt="" />
            </button>
            <button className="profile-button" type="button" aria-label={`Profil ${dashboard?.profile.name || 'pengguna'}`}>
              <img src={profileImage} alt="" />
            </button>
          </div>
        </header>

        {error ? (
          <section className="request-state request-state--error" role="alert">
            <h2>Dashboard belum dapat dimuat</h2>
            <p>{error}</p>
            <button className="button-primary" type="button" onClick={loadDashboard}>Coba lagi</button>
          </section>
        ) : (
          <>
            <section className="metrics-grid" aria-label="Ringkasan perusahaan">
              {(dashboard?.metrics || Array.from({ length: 4 }, () => ({ value: ' ', label: '', trend: '', period: '', color: 'blue' }))).map((metric, index) => (
                <MetricCard key={metric.label || index} metric={metric} icon={statIcons[index]} />
              ))}
            </section>
            {loading && <p className="visually-hidden" role="status">Memuat data dashboard...</p>}
            <div className="dashboard-grid">
              <AttendanceCard
                attendance={dashboard?.attendance || []}
                employeesById={dashboard?.employeesById || {}}
                loading={loading}
              />
              {currentDashboard && (
                <div className="right-column">
                  <AnnouncementPanel
                    dashboard={currentDashboard}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onAdd={() => setDialogOpen(true)}
                  />
                  <SchedulePanel schedules={dashboard.schedules} />
                </div>
              )}
            </div>
          </>
        )}
      </main>
      {dialogOpen && <AnnouncementDialog onClose={() => setDialogOpen(false)} onSubmit={addAnnouncement} />}
    </div>
  )
}

export default App
