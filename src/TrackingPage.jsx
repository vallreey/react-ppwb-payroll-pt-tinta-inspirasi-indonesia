import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './TrackingPage.css'
import profileImage from './assets/profile.png'
import activeEmployeesIcon from './assets/karyawan-tl.png'
import officeIcon from './assets/kantor.png'
import homeIcon from './assets/rumah.png'
import clientIcon from './assets/tas.png'
import offlineIcon from './assets/offline.png'
import dateIcon from './assets/date.png'
import trackingIcon from './assets/tracking.png'
import locationActionIcon from './assets/lokasi.png'
import routeActionIcon from './assets/arrow.png'
import { fetchTrackingLocations } from './services/trackingService'

const statusLabels = {
  'On Site': 'Di Kantor',
  'Work From Home': 'Work From Home',
  'Client Visit': 'Kunjungan Client',
  Offline: 'Offline / Tidak Aktif',
}

const statusClasses = {
  'On Site': 'onsite',
  'Work From Home': 'wfh',
  'Client Visit': 'client',
  Offline: 'offline',
}

const statusIcons = {
  'On Site': officeIcon,
  'Work From Home': homeIcon,
  'Client Visit': clientIcon,
  Offline: offlineIcon,
}

const mapCenter = [-7.422, 109.238]

function markerIcon(status, selected) {
  const icon = statusIcons[status] || trackingIcon
  return L.divIcon({
    className: 'tracking-map-marker',
    html: `<span class="tracking-map-marker__pin tracking-map-marker__pin--${statusClasses[status] || 'onsite'}${selected ? ' is-selected' : ''}"><img src="${icon}" alt="" /></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 38],
    popupAnchor: [0, -36],
  })
}

function MapFocus({ employee }) {
  const map = useMap()

  useEffect(() => {
    if (employee) map.flyTo(employee.coordinates, 16, { duration: 0.6 })
  }, [employee, map])

  return null
}

function RouteMapFocus({ route }) {
  const map = useMap()

  useEffect(() => {
    if (route.length > 1) {
      map.fitBounds(route, { padding: [28, 28], maxZoom: 16 })
    }
  }, [map, route])

  return null
}

function getRouteDistance(route) {
  const earthRadiusKm = 6371
  const radians = (degrees) => degrees * (Math.PI / 180)

  return route.slice(1).reduce((distance, point, index) => {
    const [latitudeA, longitudeA] = route[index]
    const [latitudeB, longitudeB] = point
    const latitudeDelta = radians(latitudeB - latitudeA)
    const longitudeDelta = radians(longitudeB - longitudeA)
    const haversine = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(radians(latitudeA)) * Math.cos(radians(latitudeB)) * Math.sin(longitudeDelta / 2) ** 2
    return distance + earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  }, 0)
}

function TrackingRouteDialog({ employee, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const distance = getRouteDistance(employee.routeCoordinates)
  const routeStartTime = employee.history[0]?.time || '–'
  const routeEndTime = employee.history.at(-1)?.time || employee.lastSeen

  return (
    <div className="tracking-route-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="tracking-route-dialog" role="dialog" aria-modal="true" aria-labelledby="tracking-route-title">
        <header className="tracking-route-heading">
          <div className="tracking-route-employee">
            <img src={profileImage} alt="" />
            <div>
              <h2 id="tracking-route-title">Rute Lokasi Karyawan</h2>
              <p>{employee.name} · {employee.division}</p>
            </div>
          </div>
          <button className="tracking-route-close" type="button" aria-label="Tutup detail rute" onClick={onClose}>×</button>
        </header>
        <div className="tracking-route-content">
          <div className="tracking-route-map">
            <MapContainer center={employee.coordinates} zoom={14} scrollWheelZoom aria-label={`Peta rute perjalanan ${employee.name}`}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline positions={employee.routeCoordinates} pathOptions={{ color: '#3184d8', weight: 6, opacity: 0.85 }} />
              <CircleMarker center={employee.routeCoordinates[0]} radius={7} pathOptions={{ color: '#fff', weight: 3, fillColor: '#24a767', fillOpacity: 1 }}>
                <Popup>Titik awal: {employee.routeStart}</Popup>
              </CircleMarker>
              <Marker position={employee.coordinates} icon={markerIcon(employee.status, true)}>
                <Popup>Lokasi terakhir: {employee.routeEnd}</Popup>
              </Marker>
              <RouteMapFocus route={employee.routeCoordinates} />
            </MapContainer>
            <div className="tracking-route-map-attribution">Peta © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></div>
          </div>
          <aside className="tracking-route-summary" aria-label="Informasi rute">
            <div className="tracking-route-summary-heading">
              <div>
                <span>Rute perjalanan</span>
                <strong>{distance.toFixed(2)} km</strong>
              </div>
              <StatusPill status={employee.status} />
            </div>
            <dl className="tracking-route-data">
              <div><dt>Karyawan</dt><dd>{employee.name}</dd></div>
              <div><dt>Mulai</dt><dd>{employee.routeStart}</dd></div>
              <div><dt>Lokasi terakhir</dt><dd>{employee.routeEnd} · {employee.city}</dd></div>
              <div><dt>Waktu perjalanan</dt><dd>{routeStartTime} – {routeEndTime} WIB</dd></div>
              <div><dt>Koordinat terakhir</dt><dd>{employee.coordinates[0].toFixed(4)}, {employee.coordinates[1].toFixed(4)}</dd></div>
            </dl>
            <div className="tracking-route-history">
              <h3>Riwayat rute</h3>
              <ol>
                {employee.history.map((entry) => (
                  <li key={`${entry.time}-${entry.description}`}><time>{entry.time}</time><span>{entry.description}</span></li>
                ))}
              </ol>
            </div>
            <p className="tracking-route-note">Rute ditampilkan dari data simulasi Mock API.</p>
          </aside>
        </div>
      </section>
    </div>
  )
}

function StatusPill({ status }) {
  return <span className={`tracking-status tracking-status--${statusClasses[status] || 'onsite'}`}>{statusLabels[status] || status}</span>
}

function TrackingPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('Semua Divisi')
  const [locationFilter, setLocationFilter] = useState('Semua Lokasi')
  const [statusFilter, setStatusFilter] = useState('Semua Status')
  const [selectedId, setSelectedId] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [routeEmployee, setRouteEmployee] = useState(null)

  async function loadLocations() {
    setLoading(true)
    setError('')
    try {
      const locations = await fetchTrackingLocations()
      setEmployees(locations)
      setSelectedId((current) => current && locations.some(({ id }) => id === current) ? current : locations[0].id)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Data lokasi tidak dapat dimuat.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    fetchTrackingLocations()
      .then((locations) => {
        if (!active) return
        setEmployees(locations)
        setSelectedId(locations[0].id)
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Data lokasi tidak dapat dimuat.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filteredEmployees = useMemo(() => employees.filter((employee) => (
    (divisionFilter === 'Semua Divisi' || employee.division === divisionFilter)
    && (locationFilter === 'Semua Lokasi' || employee.location === locationFilter)
    && (statusFilter === 'Semua Status' || employee.status === statusFilter)
  )), [employees, divisionFilter, locationFilter, statusFilter])

  const selectedEmployee = filteredEmployees.find(({ id }) => id === selectedId) || filteredEmployees[0] || null
  const totalActive = employees.filter(({ status }) => status !== 'Offline').length
  const counts = employees.reduce((result, employee) => {
    result[employee.status] = (result[employee.status] || 0) + 1
    return result
  }, {})

  const metrics = [
    { label: 'Total Karyawan Aktif', value: totalActive, unit: 'Karyawan', status: 'active', icon: activeEmployeesIcon },
    { label: 'Di Kantor', value: counts['On Site'] || 0, unit: 'Karyawan', status: 'onsite', icon: officeIcon },
    { label: 'Work From Home', value: counts['Work From Home'] || 0, unit: 'Karyawan', status: 'wfh', icon: homeIcon },
    { label: 'Kunjungan Client', value: counts['Client Visit'] || 0, unit: 'Karyawan', status: 'client', icon: clientIcon },
    { label: 'Offline / Tidak Aktif', value: counts.Offline || 0, unit: 'Karyawan', status: 'offline', icon: offlineIcon },
  ]

  return (
    <section className="tracking-page" aria-label="Pelacakan lokasi karyawan">
      {error ? (
        <div className="tracking-request-state" role="alert">
          <h2>Data lokasi belum dapat dimuat</h2>
          <p>{error}</p>
          <button type="button" className="tracking-button tracking-button--primary" onClick={loadLocations}>Coba lagi</button>
        </div>
      ) : (
        <>
          <section className="tracking-metrics" aria-label="Ringkasan lokasi karyawan">
            {metrics.map((metric) => (
              <article className={`tracking-metric tracking-metric--${metric.status}`} key={metric.status}>
                <span className="tracking-metric__icon" aria-hidden="true"><img src={metric.icon} alt="" /></span>
                <div className="tracking-metric__body">
                  <h2>{metric.label}</h2>
                  {loading ? <span className="tracking-skeleton" /> : <p><strong>{metric.value}</strong> {metric.unit}</p>}
                </div>
              </article>
            ))}
          </section>

          <form className="tracking-filters" aria-label="Filter data lokasi" onSubmit={(event) => event.preventDefault()}>
            <label>
              <span className="visually-hidden">Filter divisi</span>
              <select value={divisionFilter} onChange={(event) => setDivisionFilter(event.target.value)}>
                <option>Semua Divisi</option>
                {[...new Set(employees.map(({ division }) => division))].map((division) => <option key={division}>{division}</option>)}
              </select>
            </label>
            <label>
              <span className="visually-hidden">Filter lokasi</span>
              <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
                <option>Semua Lokasi</option>
                {[...new Set(employees.map(({ location }) => location))].map((location) => <option key={location}>{location}</option>)}
              </select>
            </label>
            <label>
              <span className="visually-hidden">Filter status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>Semua Status</option>
                {Object.keys(statusLabels).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
            <span className="tracking-date"><img src={dateIcon} alt="" /> {new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
            <button type="button" className="tracking-button tracking-refresh" onClick={loadLocations} disabled={loading}>
              <span aria-hidden="true">↻</span> {loading ? 'Memuat...' : 'Refresh'}
            </button>
          </form>

          {loading ? (
            <p className="tracking-loading" role="status">Memuat data lokasi karyawan...</p>
          ) : (
            <>
              <div className="tracking-primary-grid">
                <section className="tracking-map-card" aria-label="Peta lokasi karyawan">
                  <MapContainer center={mapCenter} zoom={15} scrollWheelZoom aria-label="Peta OpenStreetMap lokasi karyawan">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {filteredEmployees.map((employee) => (
                      <Marker
                        key={employee.id}
                        position={employee.coordinates}
                        icon={markerIcon(employee.status, employee.id === selectedEmployee?.id)}
                        eventHandlers={{ click: () => setSelectedId(employee.id) }}
                      >
                        <Popup>
                          <strong>{employee.name}</strong><br />
                          {employee.location} · {statusLabels[employee.status] || employee.status}
                        </Popup>
                      </Marker>
                    ))}
                    <MapFocus employee={selectedEmployee} />
                  </MapContainer>
                  {filteredEmployees.length === 0 && <p className="tracking-map-empty">Tidak ada lokasi yang sesuai dengan filter.</p>}
                  <div className="tracking-map-attribution">Peta © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></div>
                </section>

                <section className="tracking-panel tracking-activity" aria-labelledby="tracking-activity-title">
                  <div className="tracking-panel-heading">
                    <h2 id="tracking-activity-title">Aktivitas Lokasi (Live)</h2>
                    <span className="tracking-live"><i /> Live</span>
                  </div>
                  <ul className="tracking-activity-list">
                    {filteredEmployees.slice(0, 5).map((employee) => (
                      <li key={employee.id}>
                        <button className={`tracking-activity-item ${employee.id === selectedEmployee?.id ? 'is-selected' : ''}`} type="button" onClick={() => setSelectedId(employee.id)}>
                          <time>{employee.lastSeen}</time>
                          <img src={profileImage} alt="" />
                          <span className="tracking-activity-copy">
                            <strong>{employee.name}</strong>
                            <small>{employee.activity}</small>
                          </span>
                          <StatusPill status={employee.status} />
                        </button>
                      </li>
                    ))}
                    {filteredEmployees.length === 0 && <li className="tracking-empty">Tidak ada aktivitas untuk filter ini.</li>}
                  </ul>
                </section>
              </div>

              <div className="tracking-secondary-grid">
                <section className="tracking-panel tracking-employee-panel" aria-labelledby="tracking-employee-title">
                  <div className="tracking-panel-heading">
                    <h2 id="tracking-employee-title">Daftar Karyawan</h2>
                    <span className="tracking-count">{filteredEmployees.length} karyawan</span>
                  </div>
                  <div className="tracking-table-wrap">
                    <table className="tracking-table">
                      <thead>
                        <tr>
                          <th scope="col">Nama Karyawan</th>
                          <th scope="col">Divisi</th>
                          <th scope="col">Lokasi</th>
                          <th scope="col">Status</th>
                          <th scope="col">Update Terakhir</th>
                          <th scope="col">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.map((employee) => (
                          <tr key={employee.id} className={employee.id === selectedEmployee?.id ? 'is-selected' : ''}>
                            <td><span className="tracking-employee-name"><img src={profileImage} alt="" />{employee.name}</span></td>
                            <td>{employee.division}</td>
                            <td>{employee.location}<small>{employee.city}</small></td>
                            <td><StatusPill status={employee.status} /></td>
                            <td>{employee.checkIn}<small>{employee.updatedAt}</small></td>
                            <td>
                              <div className="tracking-actions">
                              <button className="tracking-action-button" type="button" aria-label={`Pilih lokasi ${employee.name}`} onClick={() => setSelectedId(employee.id)}><img src={locationActionIcon} alt="" /></button>
                              <button className="tracking-action-button" type="button" aria-label={`Lihat detail dan rute ${employee.name}`} onClick={() => setRouteEmployee(employee)}><img src={routeActionIcon} alt="" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredEmployees.length === 0 && <tr><td className="tracking-table-empty" colSpan="6">Tidak ada karyawan yang cocok dengan filter.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="tracking-panel tracking-detail" aria-labelledby="tracking-detail-title">
                  <div className="tracking-panel-heading">
                    <h2 id="tracking-detail-title">Detail Lokasi Saya</h2>
                    {selectedEmployee && <StatusPill status={selectedEmployee.status} />}
                  </div>
                  {selectedEmployee ? (
                    <>
                      <div className="tracking-detail-profile">
                        <img src={profileImage} alt="" />
                        <div>
                          <strong>{selectedEmployee.name}</strong>
                          <span>{selectedEmployee.division}</span>
                        </div>
                      </div>
                      <dl className="tracking-detail-data">
                        <div><dt>Lokasi</dt><dd>{selectedEmployee.location} – {selectedEmployee.city}</dd></div>
                        <div><dt>Check-in</dt><dd>{selectedEmployee.checkIn}</dd></div>
                        <div><dt>Koordinat</dt><dd>{selectedEmployee.coordinates[0].toFixed(4)}, {selectedEmployee.coordinates[1].toFixed(4)}</dd></div>
                      </dl>
                      <button className="tracking-detail-link" type="button" onClick={() => setSelectedId(selectedEmployee.id)}>Lokasi Terkini <img src={locationActionIcon} alt="" /></button>
                      <button className="tracking-detail-link" type="button" aria-expanded={showHistory} onClick={() => setShowHistory((shown) => !shown)}>
                        {showHistory ? 'Tutup Riwayat Lokasi' : 'Lihat Riwayat Lokasi'} <span aria-hidden="true">{showHistory ? '⌃' : '›'}</span>
                      </button>
                      {showHistory && (
                        <ol className="tracking-history">
                          {selectedEmployee.history.map((entry) => <li key={`${entry.time}-${entry.description}`}><time>{entry.time}</time><span>{entry.description}</span></li>)}
                        </ol>
                      )}
                    </>
                  ) : <p className="tracking-empty">Pilih karyawan untuk melihat detail lokasi.</p>}
                </section>
              </div>
            </>
          )}
        </>
      )}
      {routeEmployee && <TrackingRouteDialog employee={routeEmployee} onClose={() => setRouteEmployee(null)} />}
    </section>
  )
}

export default TrackingPage
