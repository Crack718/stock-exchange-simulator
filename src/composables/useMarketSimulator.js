import { computed, ref, watch } from 'vue'
import {
  fetchDepth,
  fetchKlines,
  fetchRecentTrades,
  fetchTicker24h,
} from '../services/marketApi'
import { useSettings } from './useSettings'

const MARKET_META = [
  {
    symbol: 'BTC/USDT',
    apiSymbol: 'BTCUSDT',
    name: 'Bitcoin',
    sector: 'Spot',
    precision: 2,
    fallbackPrice: 67420.52,
    fallbackChange: 2.84,
    fallbackVolume: '4.82B USDT',
  },
  {
    symbol: 'ETH/USDT',
    apiSymbol: 'ETHUSDT',
    name: 'Ethereum',
    sector: 'Spot',
    precision: 2,
    fallbackPrice: 3426.18,
    fallbackChange: 1.26,
    fallbackVolume: '1.91B USDT',
  },
  {
    symbol: 'SOL/USDT',
    apiSymbol: 'SOLUSDT',
    name: 'Solana',
    sector: 'Spot',
    precision: 2,
    fallbackPrice: 148.72,
    fallbackChange: -0.92,
    fallbackVolume: '621M USDT',
  },
  {
    symbol: 'XRP/USDT',
    apiSymbol: 'XRPUSDT',
    name: 'XRP',
    sector: 'Spot',
    precision: 4,
    fallbackPrice: 0.5924,
    fallbackChange: 0.74,
    fallbackVolume: '246M USDT',
  },
  {
    symbol: 'DOGE/USDT',
    apiSymbol: 'DOGEUSDT',
    name: 'Dogecoin',
    sector: 'Spot',
    precision: 5,
    fallbackPrice: 0.1648,
    fallbackChange: -1.42,
    fallbackVolume: '184M USDT',
  },
  {
    symbol: 'BNB/USDT',
    apiSymbol: 'BNBUSDT',
    name: 'BNB',
    sector: 'Spot',
    precision: 2,
    fallbackPrice: 612.35,
    fallbackChange: 0.54,
    fallbackVolume: '398M USDT',
  },
]

const MARKET_REFRESH_INTERVAL = 5_000
const AUTO_REFRESH_MIGRATION_KEY = 'stockdesk_auto_refresh_enabled_once'

const selectedSymbol = ref('BTC/USDT')
const selectedInterval = ref('5m')
const ticks = ref(0)
const walletBalance = ref(12500)
const openOrders = ref([])
const tradeHistory = ref([])
const positions = ref([])
const markets = ref(MARKET_META.map(createFallbackMarket))
const priceHistory = ref([])
const orderBook = ref({ asks: [], bids: [] })
const recentTrades = ref([])
const isLiveMarket = ref(false)
const isRefreshing = ref(false)
const marketStatus = ref('Локальный резерв')
const marketError = ref('')
const lastUpdated = ref(null)

let intervalId = null
let orderSequence = 1024
let settingsWatcherStarted = false
let marketBootstrapped = false
let detailsRequestId = 0
let refreshPromise = null

const tradeTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function createFallbackMarket(meta) {
  const spread = meta.fallbackPrice * 0.025

  return {
    symbol: meta.symbol,
    apiSymbol: meta.apiSymbol,
    name: meta.name,
    sector: meta.sector,
    price: meta.fallbackPrice,
    change: meta.fallbackChange,
    volume: meta.fallbackVolume,
    quoteVolume: 0,
    high: meta.fallbackPrice + spread,
    low: meta.fallbackPrice - spread,
    fundingRate: 0,
    openInterest: 'Demo',
    precision: meta.precision,
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function formatCompactVolume(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    notation: 'compact',
  }).format(Number(value || 0))
}

function formatTradeTime(timestamp) {
  return tradeTimeFormatter.format(new Date(timestamp))
}

function getCurrentMarket(symbol) {
  return markets.value.find((market) => market.symbol === symbol)
}

function buildFallbackPriceHistory(market) {
  const basePrice = market?.price || MARKET_META[0].fallbackPrice
  const points = Array.from({ length: 80 }, (_, index) => {
    const wave = Math.sin((index + ticks.value) / 5.5) * 0.018
    const counterWave = Math.cos((index + ticks.value) / 9.5) * 0.011
    const value = basePrice * (1 + wave + counterWave)

    return {
      id: `fallback-${ticks.value}-${index}`,
      time: Date.now() - (79 - index) * 60_000,
      value,
      volume: 100 + Math.abs(Math.sin(index / 3)) * 900,
      positive: index === 0 || wave >= 0,
    }
  })
  const maxVolume = Math.max(...points.map((point) => point.volume), 1)

  return points.map((point) => ({
    ...point,
    height: 18 + (point.volume / maxVolume) * 76,
  }))
}

function buildFallbackOrderBook(market) {
  const price = market?.price || MARKET_META[0].fallbackPrice
  const asks = Array.from({ length: 14 }, (_, index) => {
    const level = index + 1
    return {
      price: price * (1 + level * 0.00065),
      amount: 0.18 + level * 0.071,
      total: 1.8 + level * 0.48,
      depth: 100 - level * 5.5,
    }
  }).reverse()

  const bids = Array.from({ length: 14 }, (_, index) => {
    const level = index + 1
    return {
      price: price * (1 - level * 0.00065),
      amount: 0.21 + level * 0.066,
      total: 1.6 + level * 0.52,
      depth: 100 - level * 5.5,
    }
  })

  return { asks, bids }
}

function buildFallbackTrades(market) {
  const price = market?.price || MARKET_META[0].fallbackPrice

  return Array.from({ length: 18 }, (_, index) => {
    const side = (index + ticks.value) % 3 === 0 ? 'sell' : 'buy'
    const shift = (Math.random() - 0.5) * 0.0018

    return {
      id: `fallback-trade-${ticks.value}-${index}`,
      side,
      price: price * (1 + shift),
      amount: 0.025 + index * 0.018,
      time: formatTradeTime(Date.now() - index * 22_000),
    }
  })
}

function useFallbackSelectedData() {
  const market = selectedMarket.value
  priceHistory.value = buildFallbackPriceHistory(market)
  orderBook.value = buildFallbackOrderBook(market)
  recentTrades.value = buildFallbackTrades(market)
}

function updateFallbackMarket() {
  ticks.value += 1

  markets.value = markets.value.map((market, index) => {
    const wave = Math.sin((ticks.value + index) / 2.8) * 0.0019
    const drift = (Math.random() - 0.45) * 0.0018
    const nextPrice = market.price * (1 + wave + drift)
    const nextChange = clamp(market.change + (Math.random() - 0.48) * 0.18, -8.5, 8.5)

    return {
      ...market,
      price: nextPrice,
      change: nextChange,
      high: Math.max(market.high, nextPrice),
      low: Math.min(market.low, nextPrice),
    }
  })

  useFallbackSelectedData()
  processOpenOrders()
  lastUpdated.value = Date.now()
}

function applyTickerRows(rows) {
  const rowsBySymbol = new Map(rows.map((row) => [row.symbol, row]))

  markets.value = MARKET_META.map((meta) => {
    const current = getCurrentMarket(meta.symbol) ?? createFallbackMarket(meta)
    const row = rowsBySymbol.get(meta.apiSymbol)

    if (!row) {
      return current
    }

    const lastPrice = Number(row.lastPrice)
    const high = Number(row.highPrice)
    const low = Number(row.lowPrice)
    const change = Number(row.priceChangePercent)
    const quoteVolume = Number(row.quoteVolume)

    return {
      ...current,
      price: Number.isFinite(lastPrice) ? lastPrice : current.price,
      change: Number.isFinite(change) ? change : current.change,
      high: Number.isFinite(high) ? high : current.high,
      low: Number.isFinite(low) ? low : current.low,
      quoteVolume: Number.isFinite(quoteVolume) ? quoteVolume : current.quoteVolume,
      volume: Number.isFinite(quoteVolume)
        ? `${formatCompactVolume(quoteVolume)} USDT`
        : current.volume,
    }
  })
}

function buildPriceHistoryFromKlines(klines) {
  const rows = klines
    .map((kline, index) => {
      const open = Number(kline[1])
      const close = Number(kline[4])
      const volume = Number(kline[5])
      const closeTime = Number(kline[6])

      return {
        id: closeTime || index,
        time: closeTime || Date.now(),
        value: close,
        volume,
        positive: close >= open,
      }
    })
    .filter((point) => Number.isFinite(point.value) && Number.isFinite(point.volume))

  const maxVolume = Math.max(...rows.map((point) => point.volume), 1)

  return rows.map((point) => ({
    ...point,
    height: 18 + (point.volume / maxVolume) * 76,
  }))
}

function mapBookRows(rows) {
  let total = 0
  const prepared = rows.slice(0, 14).map(([priceValue, amountValue]) => {
    const price = Number(priceValue)
    const amount = Number(amountValue)
    total += Number.isFinite(amount) ? amount : 0

    return {
      price,
      amount,
      total,
      depth: 0,
    }
  })

  const maxTotal = Math.max(...prepared.map((row) => row.total), 1)

  return prepared.map((row) => ({
    ...row,
    depth: Math.max(8, (row.total / maxTotal) * 100),
  }))
}

function buildOrderBookFromDepth(depth) {
  return {
    asks: mapBookRows(depth.asks ?? []).reverse(),
    bids: mapBookRows(depth.bids ?? []),
  }
}

function buildRecentTrades(trades) {
  return trades
    .slice(-18)
    .reverse()
    .map((trade) => ({
      id: trade.id,
      side: trade.isBuyerMaker ? 'sell' : 'buy',
      price: Number(trade.price),
      amount: Number(trade.qty),
      time: formatTradeTime(trade.time),
    }))
}

function recordFilledOrder(order, market, fillPrice = market.price) {
  const notional = fillPrice * order.amount
  const margin = notional / order.leverage
  const filledOrder = {
    ...order,
    price: fillPrice,
    notional,
    margin,
    status: 'Filled',
    filledAt: Date.now(),
  }
  const position = {
    id: `POS-${filledOrder.id}`,
    symbol: market.symbol,
    side: order.side,
    entryPrice: fillPrice,
    amount: order.amount,
    leverage: order.leverage,
    marginMode: order.marginMode,
    margin,
  }

  positions.value = [position, ...positions.value].slice(0, 6)
  tradeHistory.value = [filledOrder, ...tradeHistory.value].slice(0, 12)
  return filledOrder
}

function calculatePositionPnl(position, market) {
  const direction = position.side === 'buy' ? 1 : -1
  return (market.price - position.entryPrice) * position.amount * direction
}

function closePosition(id) {
  const position = positions.value.find((item) => item.id === id)

  if (!position) {
    return null
  }

  const market = markets.value.find((item) => item.symbol === position.symbol)

  if (!market) {
    return null
  }

  const exitPrice = market.price
  const notional = exitPrice * position.amount
  const realizedPnl = calculatePositionPnl(position, market)
  const fee = notional * 0.0005
  const closedOrder = {
    id: `CLS-${orderSequence++}`,
    symbol: position.symbol,
    side: position.side === 'buy' ? 'sell' : 'buy',
    type: 'market',
    marginMode: position.marginMode,
    price: exitPrice,
    amount: position.amount,
    leverage: position.leverage,
    notional,
    margin: position.margin,
    status: 'Closed',
    realizedPnl,
    fee,
    closedPositionId: position.id,
    createdAt: Date.now(),
  }

  walletBalance.value += realizedPnl - fee
  positions.value = positions.value.filter((item) => item.id !== id)
  tradeHistory.value = [closedOrder, ...tradeHistory.value].slice(0, 12)
  return closedOrder
}

function shouldFillOrder(order, market) {
  if (order.type === 'limit') {
    return order.side === 'buy' ? market.price <= order.price : market.price >= order.price
  }

  if (order.type === 'trigger') {
    return order.side === 'buy' ? market.price >= order.price : market.price <= order.price
  }

  return false
}

function processOpenOrders() {
  if (!openOrders.value.length) {
    return
  }

  const remainingOrders = []

  openOrders.value.forEach((order) => {
    const market = markets.value.find((item) => item.symbol === order.symbol)

    if (market && shouldFillOrder(order, market)) {
      recordFilledOrder(order, market)
      return
    }

    remainingOrders.push(order)
  })

  openOrders.value = remainingOrders
}

async function loadSelectedMarketData() {
  const market = selectedMarket.value
  const requestId = ++detailsRequestId

  const [klines, depth, trades] = await Promise.all([
    fetchKlines(market.apiSymbol, selectedInterval.value, 80),
    fetchDepth(market.apiSymbol, 20),
    fetchRecentTrades(market.apiSymbol, 24),
  ])

  if (requestId !== detailsRequestId) {
    return
  }

  priceHistory.value = buildPriceHistoryFromKlines(klines)
  orderBook.value = buildOrderBookFromDepth(depth)
  recentTrades.value = buildRecentTrades(trades)
}

async function refreshMarketData() {
  if (typeof window === 'undefined') {
    return
  }

  if (refreshPromise) {
    return refreshPromise
  }

  isRefreshing.value = true
  refreshPromise = (async () => {
    try {
      const rows = await fetchTicker24h(MARKET_META.map((market) => market.apiSymbol))
      applyTickerRows(rows)
      await loadSelectedMarketData()
      processOpenOrders()
      isLiveMarket.value = true
      marketStatus.value = 'Реальные данные Binance Spot'
      marketError.value = ''
      lastUpdated.value = Date.now()
    } catch (error) {
      isLiveMarket.value = false
      marketStatus.value = 'Локальный резерв'
      marketError.value = 'Реальные котировки временно недоступны, показан резервный учебный рынок.'
      updateFallbackMarket()
    } finally {
      isRefreshing.value = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function startMarket() {
  if (intervalId || typeof window === 'undefined') {
    return
  }

  intervalId = window.setInterval(() => {
    void refreshMarketData()
  }, MARKET_REFRESH_INTERVAL)
}

function stopMarket() {
  if (!intervalId || typeof window === 'undefined') {
    return
  }

  window.clearInterval(intervalId)
  intervalId = null
}

function syncMarketAnimation(isEnabled) {
  if (isEnabled) {
    startMarket()
    return
  }

  stopMarket()
}

function enableAutoRefreshOnce(settings) {
  if (typeof localStorage === 'undefined' || localStorage.getItem(AUTO_REFRESH_MIGRATION_KEY)) {
    return
  }

  settings.marketAnimation = true
  localStorage.setItem(AUTO_REFRESH_MIGRATION_KEY, 'true')
}

const selectedMarket = computed(
  () => markets.value.find((market) => market.symbol === selectedSymbol.value) ?? markets.value[0],
)

const marketSummary = computed(() => {
  const positive = markets.value.filter((market) => market.change >= 0).length
  const negative = markets.value.length - positive
  const averageChange =
    markets.value.reduce((sum, market) => sum + market.change, 0) / markets.value.length

  return {
    positive,
    negative,
    averageChange,
  }
})

const marginUsed = computed(() =>
  positions.value.reduce((sum, position) => sum + position.margin, 0),
)

const unrealizedPnl = computed(() =>
  positions.value.reduce((sum, position) => {
    const market = markets.value.find((item) => item.symbol === position.symbol)

    if (!market) {
      return sum
    }

    return sum + calculatePositionPnl(position, market)
  }, 0),
)

const accountSummary = computed(() => ({
  walletBalance: walletBalance.value,
  marginUsed: marginUsed.value,
  availableBalance: walletBalance.value - marginUsed.value + unrealizedPnl.value,
  equity: walletBalance.value + unrealizedPnl.value,
  unrealizedPnl: unrealizedPnl.value,
}))

useFallbackSelectedData()

export function useMarketSimulator() {
  const { settings } = useSettings()

  if (!marketBootstrapped) {
    marketBootstrapped = true
    enableAutoRefreshOnce(settings)
    void refreshMarketData()
    syncMarketAnimation(settings.marketAnimation)
  } else {
    syncMarketAnimation(settings.marketAnimation)
  }

  if (!settingsWatcherStarted) {
    watch(
      () => settings.marketAnimation,
      (isEnabled) => syncMarketAnimation(isEnabled),
    )
    settingsWatcherStarted = true
  }

  function selectMarket(symbol) {
    selectedSymbol.value = symbol
    void loadSelectedMarketData()
      .then(() => {
        isLiveMarket.value = true
        marketStatus.value = 'Реальные данные Binance Spot'
        marketError.value = ''
        lastUpdated.value = Date.now()
      })
      .catch(() => {
        isLiveMarket.value = false
        marketStatus.value = 'Локальный резерв'
        marketError.value = 'Не удалось обновить выбранный рынок, показаны резервные данные.'
        updateFallbackMarket()
      })
  }

  function setMarketInterval(interval) {
    selectedInterval.value = interval
    void loadSelectedMarketData()
      .then(() => {
        isLiveMarket.value = true
        marketStatus.value = 'Реальные данные Binance Spot'
        marketError.value = ''
        lastUpdated.value = Date.now()
      })
      .catch(() => {
        isLiveMarket.value = false
        marketStatus.value = 'Локальный резерв'
        marketError.value = 'Не удалось загрузить свечи выбранного таймфрейма.'
        useFallbackSelectedData()
      })
  }

  function placeDemoOrder(payload) {
    const market = selectedMarket.value
    const amount = Number(payload.amount)
    const leverage = Number(payload.leverage)
    const requestedPrice = Number(payload.price) || market.price
    const notional = requestedPrice * amount
    const margin = notional / leverage
    const order = {
      id: `ORD-${orderSequence++}`,
      symbol: market.symbol,
      side: payload.side,
      type: payload.orderType,
      marginMode: payload.marginMode,
      price: requestedPrice,
      amount,
      leverage,
      notional,
      margin,
      status: payload.orderType === 'market' ? 'Filled' : 'Open',
      createdAt: Date.now(),
    }

    if (payload.orderType === 'market') {
      return recordFilledOrder(order, market, market.price)
    }

    openOrders.value = [order, ...openOrders.value].slice(0, 8)
    return order
  }

  function cancelOrder(id) {
    openOrders.value = openOrders.value.filter((order) => order.id !== id)
  }

  return {
    markets,
    selectedSymbol,
    selectedMarket,
    selectedInterval,
    marketSummary,
    priceHistory,
    orderBook,
    recentTrades,
    accountSummary,
    positions,
    openOrders,
    tradeHistory,
    isLiveMarket,
    isRefreshing,
    marketStatus,
    marketError,
    lastUpdated,
    refreshIntervalMs: MARKET_REFRESH_INTERVAL,
    selectMarket,
    setMarketInterval,
    refreshMarketData,
    placeDemoOrder,
    cancelOrder,
    closePosition,
  }
}
