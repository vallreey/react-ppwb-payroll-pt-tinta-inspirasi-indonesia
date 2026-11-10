import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import companyLogo from "../assets/logo perusahaan 2.png";
import profileImage from "../assets/profile.png";
import attendanceIcon from "../assets/karyawan.png";
import dashboardIcon from "../assets/dashboard.png";
import payrollIcon from "../assets/gaji.png";
import leaveIcon from "../assets/IzinCutiIcon.png";
import trackingIcon from "../assets/tracking.png";
import managementIcon from "../assets/manajemen.png";
import settingsIcon from "../assets/settings.png";
import notificationIcon from "../assets/notif.png";
import Icon from "./Icon";
import BackToTop from "./BackToTop";
import { useAuth } from "../context/AuthContext";
import { LayoutContext } from "../context/LayoutContext";
import { useToast } from "../context/ToastContext";
import { ROLE_LABELS } from "../utils/format";

const MANAGERS = ["super_admin", "hrd", "supervisor", "direktur"];

const navigation = [
  {
    label: "Dashboard",
    icon: dashboardIcon,
    to: "/dashboard",
    match: ["/dashboard"],
  },
  {
    label: "Absensi",
    icon: attendanceIcon,
    to: "/absensi",
    match: ["/absensi"],
  },
  {
    label: "Karyawan",
    icon: attendanceIcon,
    to: "/karyawan",
    match: ["/karyawan"],
    roles: MANAGERS,
  },
  {
    label: "Penggajian",
    icon: payrollIcon,
    to: "/penggajian",
    match: ["/penggajian"],
  },
  {
    label: "Izin & Cuti",
    icon: leaveIcon,
    to: "/izin-cuti",
    match: ["/izin-cuti"],
    roles: ["super_admin", "hrd"],
  },
  {
    label: "Pengajuan Izin & Cuti",
    icon: leaveIcon,
    to: "/pengajuan-izin-cuti",
    match: ["/pengajuan-izin-cuti"],
    roles: ["karyawan", "supervisor", "hrd"],
  },
  {
    label: "Tracking Lokasi",
    icon: trackingIcon,
    to: "/tracking-lokasi",
    match: ["/tracking-lokasi"],
  },
  {
    label: "Manajemen Pengguna",
    icon: managementIcon,
    to: "/pengguna",
    match: ["/pengguna", "/persetujuan-akun"],
    roles: ["super_admin"],
  },
  {
    label: "Settings",
    icon: settingsIcon,
    to: "/pengaturan",
    match: ["/pengaturan"],
    roles: ["super_admin"],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [header, setHeader] = useState({ title: "", subtitle: "" });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 760px)").matches,
  );
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");

  const [notifications, setNotifications] = useState(() => {
    try {
      const savedNotifications = localStorage.getItem("app-notifications");

      if (savedNotifications) {
        return JSON.parse(savedNotifications);
      }
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    }

    return [
      {
        id: 1,
        title: "Selamat Datang",
        message:
          "Selamat datang di aplikasi Payroll PT. Tinta Inspirasi Indonesia.",
        time: new Date().toISOString(),
        category: "info",
        read: false,
      },
      {
        id: 2,
        title: "Informasi Absensi",
        message: "Jangan lupa melakukan absensi hari ini.",
        time: new Date().toISOString(),
        category: "reminder",
        read: false,
      },
    ];
  });
  const [colorVisionMode, setColorVisionMode] = useState(() => {
    return localStorage.getItem("accessibility-color-vision") || "normal";
  });
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("accessibility-high-contrast") === "true";
  });
  const [largeView, setLargeView] = useState(() => {
    return localStorage.getItem("accessibility-large-view") === "true";
  });
  const [readableFont, setReadableFont] = useState(() => {
    return localStorage.getItem("accessibility-readable-font") === "true";
  });
  const [textSpacing, setTextSpacing] = useState(() => {
    return localStorage.getItem("accessibility-text-spacing") === "true";
  });
  const [underlineLinks, setUnderlineLinks] = useState(() => {
    return localStorage.getItem("accessibility-underline-links") === "true";
  });
  const [keyboardNavigation, setKeyboardNavigation] = useState(() => {
    return localStorage.getItem("accessibility-keyboard-navigation") === "true";
  });
  const [reduceMotion, setReduceMotion] = useState(() => {
    return localStorage.getItem("accessibility-reduce-motion") === "true";
  });
  const [readTextOnClick, setReadTextOnClick] = useState(() => {
    return localStorage.getItem("accessibility-read-text-on-click") === "true";
  });
  const accountRef = useRef(null);

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 760px)");
    const updateBreakpoint = (event) => setIsMobile(event.matches);
    breakpoint.addEventListener("change", updateBreakpoint);
    return () => breakpoint.removeEventListener("change", updateBreakpoint);
  }, []);

  useEffect(() => {
    localStorage.setItem("app-notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileSidebarOpen(false);
        if (readTextOnClick) window.speechSynthesis?.cancel();
      }
    };
    const onPointer = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [readTextOnClick]);

  function changeColorVisionMode(mode) {
    setColorVisionMode(mode);
    localStorage.setItem("accessibility-color-vision", mode);
  }

  function toggleHighContrast() {
    const newValue = !highContrast;

    setHighContrast(newValue);
    localStorage.setItem("accessibility-high-contrast", String(newValue));
  }

  function toggleLargeView() {
    const newValue = !largeView;

    setLargeView(newValue);
    localStorage.setItem("accessibility-large-view", String(newValue));
  }

  function toggleReadableFont() {
    const value = !readableFont;
    setReadableFont(value);
    localStorage.setItem("accessibility-readable-font", String(value));
  }

  function toggleTextSpacing() {
    const value = !textSpacing;
    setTextSpacing(value);
    localStorage.setItem("accessibility-text-spacing", String(value));
  }

  function toggleUnderlineLinks() {
    const value = !underlineLinks;
    setUnderlineLinks(value);
    localStorage.setItem("accessibility-underline-links", String(value));
  }

  function toggleKeyboardNavigation() {
    const value = !keyboardNavigation;

    setKeyboardNavigation(value);
    localStorage.setItem("accessibility-keyboard-navigation", String(value));
  }

  function toggleReduceMotion() {
    const value = !reduceMotion;

    setReduceMotion(value);
    localStorage.setItem("accessibility-reduce-motion", String(value));
  }

  function toggleReadTextOnClick() {
    const supported =
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;
    if (!supported) {
      toast.error("Browser ini belum mendukung fitur pembacaan teks.");
      return;
    }

    const value = !readTextOnClick;
    setReadTextOnClick(value);
    localStorage.setItem("accessibility-read-text-on-click", String(value));
    window.speechSynthesis.cancel();
    toast.success(
      value
        ? "Mode baca teks aktif. Klik teks untuk mendengarkannya."
        : "Mode baca teks dinonaktifkan.",
    );
  }

  function readClickedText(event) {
    if (!readTextOnClick) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const sidebarItem = target.closest(".sidebar-link, .brand");
    const sidebarText = sidebarItem?.textContent?.replace(/\s+/g, " ").trim();
    if (sidebarText) {
      speakText(sidebarText);
      return;
    }

    if (
      target.closest(
        'a, button, input, textarea, select, summary, [role="button"], [aria-hidden="true"]',
      )
    ) {
      return;
    }

    const textElement = target.closest(
      "h1, h2, h3, h4, h5, h6, p, label, li, td, th, span, strong, em, time, dd, dt, legend, caption, blockquote",
    );
    const text = textElement?.textContent?.replace(/\s+/g, " ").trim();
    if (!text) return;

    speakText(text);
  }

  function speakText(text) {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Gagal membacakan teks:", error);
      toast.error("Teks tidak dapat dibacakan. Silakan coba lagi.");
    }
  }

  function resetAccessibility() {
    setColorVisionMode("normal");
    setHighContrast(false);
    setLargeView(false);

    setReadableFont(false);
    setTextSpacing(false);
    setUnderlineLinks(false);

    setKeyboardNavigation(false);
    setReduceMotion(false);
    setReadTextOnClick(false);
    window.speechSynthesis?.cancel();

    const keys = [
      "accessibility-color-vision",
      "accessibility-high-contrast",
      "accessibility-large-view",
      "accessibility-readable-font",
      "accessibility-text-spacing",
      "accessibility-underline-links",
      "accessibility-keyboard-navigation",
      "accessibility-reduce-motion",
      "accessibility-read-text-on-click",
    ];

    keys.forEach((key) => localStorage.removeItem(key));
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  function markAsRead(id) {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }

  function markAllAsRead() {
    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  function deleteNotification(id) {
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== id),
    );
  }

  // Memunculkan kembali notifikasi dummy
  function resetNotifications() {
    setNotifications([
      {
        id: 1,
        title: "Selamat Datang",
        message:
          "Selamat datang di aplikasi Payroll PT. Tinta Inspirasi Indonesia.",
        time: new Date().toISOString(),
        category: "info",
        read: false,
      },
      {
        id: 2,
        title: "Informasi Absensi",
        message: "Jangan lupa melakukan absensi hari ini.",
        time: new Date().toISOString(),
        category: "reminder",
        read: false,
      },
    ]);

    setNotificationFilter("all");
    setNotificationOpen(true);
  }

  function closeMobileSidebar() {
    setMobileSidebarOpen(false);
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const items = navigation.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );

  return (
    <LayoutContext.Provider value={setHeader}>
      <div
        className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}
        data-color-vision={colorVisionMode}
        data-high-contrast={highContrast}
        data-large-view={largeView}
        data-readable-font={readableFont}
        data-text-spacing={textSpacing}
        data-underline-links={underlineLinks}
        data-keyboard-navigation={keyboardNavigation}
        data-reduce-motion={reduceMotion}
        onClick={readClickedText}
      >
        <svg
          aria-hidden="true"
          width="0"
          height="0"
          style={{ position: "absolute" }}
        >
          <defs>
            <filter id="protanopia-filter">
              <feColorMatrix
                type="matrix"
                values="
                  0.567 0.433 0 0 0
                  0.558 0.442 0 0 0
                  0 0.242 0.758 0 0
                  0 0 0 1 0
                "
              />
            </filter>

            <filter id="deuteranopia-filter">
              <feColorMatrix
                type="matrix"
                values="
                  0.625 0.375 0 0 0
                  0.700 0.300 0 0 0
                  0 0.300 0.700 0 0
                  0 0 0 1 0
                "
              />
            </filter>

            <filter id="tritanopia-filter">
              <feColorMatrix
                type="matrix"
                values="
                  0.950 0.050 0 0 0
                  0 0.433 0.567 0 0
                  0 0.475 0.525 0 0
                  0 0 0 1 0
                "
              />
            </filter>
          </defs>
        </svg>
        <a href="#main" className="skip-link">
          Lewati ke konten utama
        </a>
        {mobileSidebarOpen && (
          <button
            className="mobile-backdrop"
            aria-label="Tutup menu"
            onClick={closeMobileSidebar}
          />
        )}
        <aside
          className={`sidebar ${mobileSidebarOpen ? "sidebar--mobile-open" : ""}`}
          aria-label="Navigasi utama"
        >
          <Link
            className="brand"
            to="/dashboard"
            aria-label="Tinta Inspirasi Indonesia, dashboard"
          >
            <img src={companyLogo} alt="PT. Tinta Inspirasi Indonesia" />
          </Link>
          <nav className="sidebar-nav">
            {items.map((item) => {
              const content = (
                <>
                  <img src={item.icon} alt="" />
                  <span>{item.label}</span>
                </>
              );
              if (!item.to) {
                return (
                  <span
                    key={item.label}
                    className="sidebar-link sidebar-link--disabled"
                    aria-disabled="true"
                    title="Halaman belum tersedia"
                  >
                    {content}
                    <span className="visually-hidden"> (belum tersedia)</span>
                  </span>
                );
              }
              const isActive = item.match.some((path) =>
                pathname.startsWith(path),
              );
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`sidebar-link ${isActive ? "sidebar-link--active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMobileSidebar}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main
          className={`main-content ${pathname === "/karyawan" ? "main-content--employee-list" : ""}`}
          id="main"
          tabIndex={-1}
        >
          <header className="topbar">
            <button
              className="menu-toggle icon-button"
              type="button"
              aria-label={
                isMobile
                  ? mobileSidebarOpen
                    ? "Tutup menu navigasi"
                    : "Buka menu navigasi"
                  : sidebarOpen
                    ? "Sembunyikan sidebar"
                    : "Tampilkan sidebar"
              }
              aria-expanded={isMobile ? mobileSidebarOpen : sidebarOpen}
              onClick={() => {
                if (isMobile) {
                  setMobileSidebarOpen((open) => !open);
                } else {
                  setSidebarOpen((open) => !open);
                }
              }}
            >
              <Icon name="menu" />
            </button>
            <div className="welcome">
              <h1>
                {header.title}{" "}
                {header.accessory && (
                  <span aria-hidden="true">{header.accessory}</span>
                )}
              </h1>
              {header.subtitle && <p>{header.subtitle}</p>}
            </div>
            <div className="topbar-actions">
              <div className="notification-wrapper">
                <button
                  className="icon-button notification-button"
                  type="button"
                  aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
                  aria-expanded={notificationOpen}
                  onClick={() => setNotificationOpen((open) => !open)}
                >
                  <img src={notificationIcon} alt="" />

                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <div className="notification-header-info">
                        <h3>Notifikasi</h3>
                        <p>{unreadCount} belum dibaca</p>
                      </div>
                      <div className="notification-header-actions">
                        <button type="button" onClick={resetNotifications}>
                          Reset Dummy
                        </button>
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          disabled={unreadCount === 0}
                        >
                          Tandai semua dibaca
                        </button>
                      </div>
                    </div>

                    <div className="notification-tabs">
                      <button
                        type="button"
                        className={notificationFilter === "all" ? "active" : ""}
                        onClick={() => setNotificationFilter("all")}
                      >
                        Semua
                      </button>

                      <button
                        type="button"
                        className={
                          notificationFilter === "unread" ? "active" : ""
                        }
                        onClick={() => setNotificationFilter("unread")}
                      >
                        Belum Dibaca
                      </button>
                    </div>

                    <div className="notification-list">
                      {notifications.filter((notification) =>
                        notificationFilter === "unread"
                          ? !notification.read
                          : true,
                      ).length === 0 ? (
                        <div className="notification-empty">
                          <Icon name="bell" />
                          <p>Tidak ada notifikasi.</p>
                        </div>
                      ) : (
                        notifications
                          .filter((notification) =>
                            notificationFilter === "unread"
                              ? !notification.read
                              : true,
                          )
                          .map((notification) => (
                            <div
                              key={notification.id}
                              className={`notification-item ${
                                notification.read ? "is-read" : "is-unread"
                              }`}
                            >
                              <button
                                type="button"
                                className="notification-content"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="notification-item-title">
                                  <strong>{notification.title}</strong>
                                  {!notification.read && (
                                    <span className="notification-dot" />
                                  )}
                                </div>

                                <p>{notification.message}</p>

                                <small>
                                  {new Date(notification.time).toLocaleString(
                                    "id-ID",
                                  )}
                                </small>
                              </button>

                              <button
                                type="button"
                                className="notification-delete"
                                aria-label={`Hapus notifikasi ${notification.title}`}
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                              >
                                🗑
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={accountRef}>
                <button
                  className="profile-button"
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={accountOpen}
                  aria-label={`Menu akun ${user.nama_tampil}`}
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <img
                    src={
                      user.employee?.foto_profil ||
                      user.foto_profil ||
                      profileImage
                    }
                    alt=""
                  />
                </button>
                {accountOpen && (
                  <div className="account-dropdown">
                    <div className="account-info">
                      <img
                        className="account-info__avatar"
                        src={
                          user.employee?.foto_profil ||
                          user.foto_profil ||
                          profileImage
                        }
                        alt=""
                      />
                      <div className="account-info__identity">
                      <p className="truncate text-xs font-medium text-gray-900">
                        {user.nama_tampil}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </p>
                      </div>
                    </div>

                    <Link
                      to="/profil"
                      className="account-profile-link"
                      onClick={() => setAccountOpen(false)}
                    >
                      <Icon name="employees" className="size-4" />
                      <span>Profil Saya</span>
                      <Icon name="arrow-right" className="ml-auto size-4" />
                    </Link>

                    <details className="accessibility-wrapper">
                      <summary className="accessibility-trigger">
                        <Icon name="eye" className="size-4" />
                        <span>Aksesibilitas</span>
                        <Icon
                          name="chevron-down"
                          className="accessibility-arrow"
                        />
                      </summary>

                      <div className="accessibility-dropdown">
                        <details className="accessibility-category">
                          <summary className="accessibility-category-trigger">
                            <Icon name="eye" className="size-4" />
                            <span>Buta Warna</span>
                            <Icon
                              name="chevron-down"
                              className="accessibility-arrow"
                            />
                          </summary>

                          <div className="accessibility-submenu">
                            <button
                              type="button"
                              onClick={() =>
                                changeColorVisionMode("protanopia")
                              }
                              aria-pressed={colorVisionMode === "protanopia"}
                            >
                              Protanopia
                              {colorVisionMode === "protanopia" && " ✓"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                changeColorVisionMode("deuteranopia")
                              }
                              aria-pressed={colorVisionMode === "deuteranopia"}
                            >
                              Deuteranopia
                              {colorVisionMode === "deuteranopia" && " ✓"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                changeColorVisionMode("tritanopia")
                              }
                              aria-pressed={colorVisionMode === "tritanopia"}
                            >
                              Tritanopia
                              {colorVisionMode === "tritanopia" && " ✓"}
                            </button>

                            <button
                              type="button"
                              onClick={() => changeColorVisionMode("normal")}
                              aria-pressed={colorVisionMode === "normal"}
                            >
                              Normal / Reset
                            </button>
                          </div>
                        </details>

                        <details className="accessibility-category">
                          <summary className="accessibility-category-trigger">
                            <Icon name="eye" className="size-4" />
                            <span>Tunanetra</span>
                            <Icon
                              name="chevron-down"
                              className="accessibility-arrow"
                            />
                          </summary>

                          <div className="accessibility-submenu">
                            <button
                              type="button"
                              onClick={toggleHighContrast}
                              aria-pressed={highContrast}
                            >
                              Kontras Tinggi
                              {highContrast && " ✓"}
                            </button>

                            <button
                              type="button"
                              onClick={toggleLargeView}
                              aria-pressed={largeView}
                            >
                              Perbesar Tampilan
                              {largeView && " ✓"}
                            </button>

                            <button
                              type="button"
                              onClick={toggleReadTextOnClick}
                              aria-pressed={readTextOnClick}
                            >
                              Bacakan teks saat diklik{" "}
                              {readTextOnClick && "✓"}
                            </button>
                          </div>
                        </details>

                        <details className="accessibility-category">
                          <summary className="accessibility-category-trigger">
                            <Icon name="settings" className="size-4" />
                            <span>Kesulitan Membaca</span>
                            <Icon
                              name="chevron-down"
                              className="accessibility-arrow"
                            />
                          </summary>

                          <div className="accessibility-submenu">
                            <button
                              type="button"
                              onClick={toggleReadableFont}
                              aria-pressed={readableFont}
                            >
                              Font Mudah Dibaca {readableFont && "✓"}
                            </button>
                            <button
                              type="button"
                              onClick={toggleTextSpacing}
                              aria-pressed={textSpacing}
                            >
                              Jarak Antar Teks {textSpacing && "✓"}
                            </button>
                            <button
                              type="button"
                              onClick={toggleUnderlineLinks}
                              aria-pressed={underlineLinks}
                            >
                              Garis Bawah Tautan {underlineLinks && "✓"}
                            </button>
                          </div>
                        </details>

                        <details className="accessibility-category">
                          <summary className="accessibility-category-trigger">
                            <Icon name="users" className="size-4" />
                            <span>Keterbatasan Motorik</span>
                            <Icon
                              name="chevron-down"
                              className="accessibility-arrow"
                            />
                          </summary>

                          <div className="accessibility-submenu">
                            <button
                              type="button"
                              onClick={toggleKeyboardNavigation}
                              aria-pressed={keyboardNavigation}
                            >
                              Navigasi Keyboard {keyboardNavigation && "✓"}
                            </button>

                            <button
                              type="button"
                              onClick={toggleReduceMotion}
                              aria-pressed={reduceMotion}
                            >
                              Kurangi Animasi {reduceMotion && "✓"}
                            </button>
                          </div>
                        </details>
                        <div className="accessibility-reset">
                          <button type="button" onClick={resetAccessibility}>
                            <Icon name="rotate-ccw" className="size-4" />
                            Reset Semua Pengaturan
                          </button>
                        </div>
                    </div>
                    </details>

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="account-logout"
                    >
                      <Icon name="logout" className="size-4" />
                      Logout
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
  );
}
