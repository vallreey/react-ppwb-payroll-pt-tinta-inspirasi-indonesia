import { fetchJson } from './apiClient'
import { toISODate } from '../utils/format'

const HOLIDAY_API = 'https://date.nager.at/api/v3/PublicHolidays'
const COUNTRY = 'ID'

const fetchYear = (year, signal) => fetchJson(`${HOLIDAY_API}/${year}/${COUNTRY}`, { signal })

export const holidayService = {
  async upcoming({ limit = 5, signal } = {}) {
    const today = toISODate()
    const year = new Date().getFullYear()
    const [current, next] = await Promise.allSettled([fetchYear(year, signal), fetchYear(year + 1, signal)])
    if (current.status === 'rejected') throw current.reason
    if (!Array.isArray(current.value)) throw new Error('Format data hari libur tidak dikenali.')

    const nextYear = next.status === 'fulfilled' && Array.isArray(next.value) ? next.value : []
    return [...current.value, ...nextYear]
      .filter((holiday) => !holiday.types || holiday.types.includes('Public'))
      .map((holiday) => ({ date: holiday.date, name: holiday.localName || holiday.name }))
      .filter((holiday) => holiday.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, limit)
  },
}
