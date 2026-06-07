const API_BASE = 'https://api.binance.com/api/v3'
const REQUEST_TIMEOUT = 8000

async function fetchJson(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`)

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value)
    }
  })

  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Market API request failed: ${response.status}`)
    }

    return await response.json()
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export async function fetchTicker24h(symbols) {
  const payload = await fetchJson('/ticker/24hr', {
    symbols: JSON.stringify(symbols),
  })

  return Array.isArray(payload) ? payload : [payload]
}

export function fetchKlines(symbol, interval, limit = 80) {
  return fetchJson('/klines', {
    symbol,
    interval,
    limit,
  })
}

export function fetchDepth(symbol, limit = 20) {
  return fetchJson('/depth', {
    symbol,
    limit,
  })
}

export function fetchRecentTrades(symbol, limit = 24) {
  return fetchJson('/trades', {
    symbol,
    limit,
  })
}
