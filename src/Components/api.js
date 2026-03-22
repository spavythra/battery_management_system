import axios from 'axios'

const LOCAL_DATASET_PATH = '/batteryAPI.json'
const API_ENDPOINT = '/api/batteries'

const cache = {
  list: null,
  listFetchedAt: 0,
  detail: {},
}

const CACHE_TTL_MS = 2 * 60 * 1000

const hasFreshCache = (timestamp) => Date.now() - timestamp < CACHE_TTL_MS

const normalizeBattery = (battery = {}) => ({
  ...battery,
  recentIssues: Array.isArray(battery.recentIssues) ? battery.recentIssues : [],
  measurements: Array.isArray(battery.measurements) ? battery.measurements : [],
})

export async function fetchBatteries() {
  if (cache.list && hasFreshCache(cache.listFetchedAt)) {
    return cache.list
  }

  try {
    const { data } = await axios.get(API_ENDPOINT, {
      timeout: 5000,
      headers: {
        'x-dashboard-client': 'fleetpulse-web',
      },
    })

    const normalized = Array.isArray(data) ? data.map(normalizeBattery) : []
    cache.list = normalized
    cache.listFetchedAt = Date.now()

    return normalized
  } catch (apiError) {
    const { data } = await axios.get(LOCAL_DATASET_PATH, { timeout: 4000 })
    const normalized = Array.isArray(data) ? data.map(normalizeBattery) : []
    cache.list = normalized
    cache.listFetchedAt = Date.now()

    return normalized
  }
}

export async function fetchBatteryById(id) {
  const normalizedId = String(id)
  const existing = cache.detail[normalizedId]
  if (existing && hasFreshCache(existing.fetchedAt)) {
    return existing.value
  }

  try {
    const { data } = await axios.get(`${API_ENDPOINT}?id=${encodeURIComponent(normalizedId)}`, {
      timeout: 5000,
      headers: {
        'x-dashboard-client': 'fleetpulse-web',
      },
    })

    if (!data || !data.id) {
      throw new Error('Battery not found in API response')
    }

    const normalized = normalizeBattery(data)
    cache.detail[normalizedId] = { value: normalized, fetchedAt: Date.now() }
    return normalized
  } catch (apiError) {
    const list = await fetchBatteries()
    const found = list.find((battery) => String(battery.id) === normalizedId)

    if (!found) {
      throw new Error('Battery not found')
    }

    cache.detail[normalizedId] = { value: found, fetchedAt: Date.now() }
    return found
  }
}
