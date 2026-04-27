import { computed, ref, watch } from 'vue'
import { useSettings } from './useSettings'

const markets = ref([
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    sector: 'Perpetual',
    price: 67420.52,
    change: 2.84,
    volume: '4.82B',
    high: 68920.4,
    low: 65110.2,
    fundingRate: 0.0108,
    openInterest: '2.41B',
    precision: 2,
  },
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    sector: 'Perpetual',
    price: 3426.18,
    change: 1.26,
    volume: '1.91B',
    high: 3510.7,
    low: 3312.5,
    fundingRate: 0.0065,
    openInterest: '940M',
    precision: 2,
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    sector: 'Perpetual',
    price: 148.72,
    change: -0.92,
    volume: '621M',
    high: 153.4,
    low: 145.2,
    fundingRate: -0.0038,
    openInterest: '318M',
    precision: 2,
  },
  {
    symbol: 'XRP/USDT',
    name: 'Ripple',
    sector: 'Spot',
    price: 0.5924,
    change: 0.74,
    volume: '246M',
    high: 0.6112,
    low: 0.5741,
    fundingRate: 0.0021,
    openInterest: '154M',
    precision: 4,
  },
  {
    symbol: 'DOGE/USDT',
    name: 'Dogecoin',
    sector: 'Spot',
    price: 0.1648,
    change: -1.42,
    volume: '184M',
    high: 0.172,
    low: 0.1589,
    fundingRate: -0.0015,
    openInterest: '121M',
    precision: 4,
  },
  {
    symbol: 'BNB/USDT',
    name: 'BNB',
    sector: 'Perpetual',
    price: 612.35,
    change: 0.54,
    volume: '398M',
    high: 624.8,
    low: 598.6,
    fundingRate: 0.0044,
    openInterest: '286M',
    precision: 2,
  },
])

const selectedSymbol = ref('BTC/USDT')
const ticks = ref(0)
const walletBalance = ref(12500)
const openOrders = ref([])
const tradeHistory = ref([])
const positions = ref([])
let intervalId = null
let orderSequence = 1024
let settingsWatcherStarted = false

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function updateMarket() {
  ticks.value += 1

  markets.value = markets.value.map((market, index) => {
    const wave = Math.sin((ticks.value + index) / 2.8) * 0.0019
    const drift = (Math.random() - 0.45) * 0.0018
    const nextPrice = market.price * (1 + wave + drift)
    const nextChange = clamp(market.change + (Math.random() - 0.48) * 0.18, -8.5, 8.5)
    const nextFunding = clamp(market.fundingRate + (Math.random() - 0.5) * 0.0009, -0.05, 0.05)

    return {
      ...market,
      price: nextPrice,
      change: nextChange,
      fundingRate: nextFunding,
      high: Math.max(market.high, nextPrice),
      low: Math.min(market.low, nextPrice),
    }
  })
}

function startMarket() {
  if (intervalId || typeof window === 'undefined') {
    return
  }

  intervalId = window.setInterval(updateMarket, 2400)
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

const priceHistory = computed(() => {
  const price = selectedMarket.value.price
  const points = Array.from({ length: 42 }, (_, index) => {
    const wave = Math.sin((index + ticks.value) / 2.7) * 0.018
    const counterWave = Math.cos((index + ticks.value) / 4.2) * 0.011
    return price * (1 + wave + counterWave)
  })
  const min = Math.min(...points)
  const max = Math.max(...points)

  return points.map((point, index) => ({
    id: index,
    value: point,
    height: 18 + ((point - min) / (max - min || 1)) * 76,
    positive: index === 0 || point >= points[index - 1],
  }))
})

const orderBook = computed(() => {
  const price = selectedMarket.value.price
  const asks = Array.from({ length: 11 }, (_, index) => {
    const level = index + 1
    return {
      price: price * (1 + level * 0.00065),
      amount: 0.18 + level * 0.071,
      total: 1.8 + level * 0.48,
      depth: 96 - level * 6,
    }
  }).reverse()

  const bids = Array.from({ length: 11 }, (_, index) => {
    const level = index + 1
    return {
      price: price * (1 - level * 0.00065),
      amount: 0.21 + level * 0.066,
      total: 1.6 + level * 0.52,
      depth: 94 - level * 6,
    }
  })

  return { asks, bids }
})

const recentTrades = computed(() => {
  const price = selectedMarket.value.price

  return Array.from({ length: 12 }, (_, index) => {
    const side = (index + ticks.value) % 3 === 0 ? 'sell' : 'buy'
    const shift = (Math.random() - 0.5) * 0.0018

    return {
      id: `${ticks.value}-${index}`,
      side,
      price: price * (1 + shift),
      amount: 0.025 + index * 0.018,
      time: `20:${String(10 + index).padStart(2, '0')}`,
    }
  })
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

    const direction = position.side === 'buy' ? 1 : -1
    return sum + (market.price - position.entryPrice) * position.amount * direction
  }, 0),
)

const accountSummary = computed(() => ({
  walletBalance: walletBalance.value,
  marginUsed: marginUsed.value,
  availableBalance: walletBalance.value - marginUsed.value + unrealizedPnl.value,
  equity: walletBalance.value + unrealizedPnl.value,
  unrealizedPnl: unrealizedPnl.value,
}))

export function useMarketSimulator() {
  const { settings } = useSettings()

  syncMarketAnimation(settings.marketAnimation)

  if (!settingsWatcherStarted) {
    watch(
      () => settings.marketAnimation,
      (isEnabled) => syncMarketAnimation(isEnabled),
    )
    settingsWatcherStarted = true
  }

  function selectMarket(symbol) {
    selectedSymbol.value = symbol
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
      const position = {
        id: `POS-${order.id}`,
        symbol: market.symbol,
        side: payload.side,
        entryPrice: market.price,
        amount,
        leverage,
        marginMode: payload.marginMode,
        margin,
      }

      positions.value = [position, ...positions.value].slice(0, 6)
      tradeHistory.value = [order, ...tradeHistory.value].slice(0, 12)
      return order
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
    marketSummary,
    priceHistory,
    orderBook,
    recentTrades,
    accountSummary,
    positions,
    openOrders,
    tradeHistory,
    selectMarket,
    placeDemoOrder,
    cancelOrder,
  }
}
