import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import companyLogo from '../assets/logo perusahaan 2.png'
import profileImage from '../assets/profile.png'
import attendanceIcon from '../assets/karyawan.png'
import dashboardIcon from '../assets/dashboard.png'
import payrollIcon from '../assets/gaji.png'
import leaveIcon from '../assets/izincuti.png'
import trackingIcon from '../assets/tracking.png'
import managementIcon from '../assets/manajemen.png'
import settingsIcon from '../assets/settings.png'
import notificationIcon from '../assets/notif.png'
import Icon from './Icon'
import BackToTop from './BackToTop'
import { useAuth } from '../context/AuthContext'
import { LayoutContext } from '../context/LayoutContext'
import { ROLE_LABELS } from '../utils/format'

const MANAGERS = ['super_admin', 'hrd', 'supervisor', 'direktur']

const navigation = [
  { label: 'Dashboard', icon: dashboardIcon, to: '/dashboard', match: ['/dashboard'] },
  { label: 'Absensi', icon: attendanceIcon, to: '/absensi', match: ['/absensi'] },
  { label: 'Karyawan', icon: attendanceIcon, to: '/karyawan', match: ['/karyawan'], roles: MANAGERS },
  { label: 'Penggajian', icon: payrollIcon },
  { label: 'Izin & Cuti', icon: leaveIcon },
  { label: 'Tracking Lokasi', icon: trackingIcon, to: '/tracking-lokasi', match: ['/tracking-lokasi'] },
  { label: 'Manajemen Pengguna', icon: managementIcon, to: '/pengguna', match: ['/pengguna', '/persetujuan-akun'], roles: ['super_admin'] },
  { label: 'Settings', icon: settingsIcon, to: '/pengaturan', match: ['/pengaturan'], roles: ['super_admin'] },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [header, setHeader] = useState({ title: '', subtitle: '' })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  useEffect(() => {
    const breakpoint = window.matchMedia('(max-width: 760px)')
    const updateBreakpoint = (event) => setIsMobile(event.matches)
    breakpoint.addEventListener('change', updateBreakpoint)
    return () => breakpoint.removeEventListener('change', updateBreakpoint)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false)
        setMobileSidebarOpen(false)
      }
    }
    const onPointer = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [])

  function closeMobileSidebar() {
    setMobileSidebarOpen(false)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const items = navigation.filter((item) => !item.roles || item.roles.includes(user.role))

  return (
    <LayoutContext.Provider value={setHeader}>
      <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <a href="#main" className="skip-link">Lewati ke konten utama</a>
        {mobileSidebarOpen && <button className="mobile-backdrop" aria-label="Tutup menu" onClick={closeMobileSidebar} />}
        <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar--mobile-open' : ''}`} aria-label="Navigasi utama">
          <Link className="brand" to="/dashboard" aria-label="Tinta Inspirasi Indonesia, dashboard">
            <img src={companyLogo} alt="PT. Tinta Inspirasi Indonesia" />
          </Link>
          <nav className="sidebar-nav">
            {items.map((item) => {
              const content = (
                <>
                  <img src={item.icon} alt="" />
                  <span>{item.label}</span>
                </>
              )
              if (!item.to) {
                return (
                  <span key={item.label} className="sidebar-link sidebar-link--disabled" aria-disabled="true" title="Halaman belum tersedia">
                    {content}
                    <span className="visually-hidden"> (belum tersedia)</span>
                  </span>
                )
              }
              const isActive = item.match.some((path) => pathname.startsWith(path))
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={closeMobileSidebar}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {content}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="main-content" id="main" tabIndex={-1}>
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
              <h1>{header.title} {header.accessory && <span aria-hidden="true">{header.accessory}</span>}</h1>
              {header.subtitle && <p>{header.subtitle}</p>}
            </div>
            <div className="topbar-actions">
              <button className="icon-button notification-button" type="button" aria-label="Notifikasi">
                <img src={notificationIcon} alt="" />
              </button>
              <div className="relative" ref={accountRef}>
                <button
                  className="profile-button"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={accountOpen}
                  aria-label={`Menu akun ${user.nama_tampil}`}
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <img src={profileImage} alt="" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl bg-white p-2 shadow-lg ring-1 ring-gray-100">
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-medium text-gray-900">{user.nama_tampil}</p>
                      <p className="text-[11px] text-gray-500">{ROLE_LABELS[user.role] ?? user.role}</p>
                    </div>
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg border-t border-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                      <Icon name="logout" className="size-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <Outlet />
        </main>
        <BackToTop />
      </div>
    </LayoutContext.Provider>
  )
}
