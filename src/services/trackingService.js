export async function fetchTrackingLocations() {
  const response = await fetch('/mock/tracking.json')
  if (!response.ok) {
    throw new Error(`Data tracking gagal dimuat (${response.status}).`)
  }

  const data = await response.json()
  if (!Array.isArray(data.employees) || data.employees.length === 0) {
    throw new Error('Data lokasi karyawan tidak tersedia.')
  }

  const isCoordinate = (coordinate) => (
    Array.isArray(coordinate)
    && coordinate.length === 2
    && coordinate.every(Number.isFinite)
  )

  const invalidLocation = data.employees.find(({ id, name, coordinates, routeCoordinates, routeStart, routeEnd }) => (
    !id
    || !name
    || !isCoordinate(coordinates)
    || !Array.isArray(routeCoordinates)
    || routeCoordinates.length < 2
    || !routeCoordinates.every(isCoordinate)
    || !routeStart
    || !routeEnd
  ))
  if (invalidLocation) {
    throw new Error('Format lokasi atau rute pada data tracking tidak valid.')
  }

  return data.employees
}
