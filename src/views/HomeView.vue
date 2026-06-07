<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useMarketSimulator } from '../composables/useMarketSimulator'

const {
  markets,
  selectedMarket,
  marketSummary,
  priceHistory,
  orderBook,
  recentTrades,
  accountSummary,
  positions,
  openOrders,
  selectMarket,
  placeDemoOrder,
  cancelOrder,
  closePosition,
  isLiveMarket,
  isRefreshing,
  marketStatus,
  marketError,
  lastUpdated,
  refreshIntervalMs,
  selectedInterval,
  setMarketInterval,
  refreshMarketData,
} = useMarketSimulator()

const order = reactive({
  side: 'buy',
  orderType: 'market',
  marginMode: 'cross',
  amount: 0.15,
  price: 0,
  leverage: 5,
  takeProfit: '',
  stopLoss: '',
  note: '',
})

const lastTicketTitle = ref('')

const timeframes = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
]

const executionPrice = computed(() =>
  order.orderType === 'market' ? selectedMarket.value.price : Number(order.price || 0),
)

const notionalValue = computed(() => executionPrice.value * Number(order.amount || 0))
const marginValue = computed(() => notionalValue.value / Number(order.leverage || 1))
const feeValue = computed(() => notionalValue.value * 0.0005)

const chartBounds = computed(() => {
  const values = priceHistory.value.map((point) => point.value)

  if (!values.length) {
    const price = selectedMarket.value.price || 1
    return {
      min: price * 0.995,
      max: price * 1.005,
    }
  }

  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const padding = Math.max((rawMax - rawMin) * 0.08, selectedMarket.value.price * 0.001)

  return {
    min: rawMin - padding,
    max: rawMax + padding,
  }
})

const chartGuideLines = computed(() => {
  const top = 30
  const bottom = 168

  return [0.22, 0.5, 0.78].map((percent, index) => ({
    id: `guide-${index}`,
    y: top + (bottom - top) * percent,
  }))
})

const chartPoints = computed(() => {
  const values = priceHistory.value.map((point) => point.value)

  if (!values.length) {
    return []
  }

  const { min, max } = chartBounds.value
  const width = 552
  const top = 30
  const bottom = 168

  return values.map((value, index) => {
    const percent = (value - min) / (max - min || 1)
    return {
      id: index,
      x: 24 + (index * width) / Math.max(values.length - 1, 1),
      y: bottom - percent * (bottom - top),
      volumeHeight: 8 + (priceHistory.value[index]?.height ?? 18) * 0.22,
      positive: priceHistory.value[index]?.positive ?? true,
    }
  })
})

const chartTimeLabels = computed(() => {
  const points = priceHistory.value

  if (points.length < 2) {
    return []
  }

  const indexes = [0, points.length - 1]
  return indexes.map((index) => ({
    id: `time-${index}`,
    label: formatChartTime(points[index]),
  }))
})

const chartLinePoints = computed(() =>
  chartPoints.value.map((point) => `${point.x},${point.y}`).join(' '),
)

const chartLastPoint = computed(
  () => chartPoints.value[chartPoints.value.length - 1] ?? { x: 0, y: 0 },
)

const tickerItems = computed(() => [
  {
    label: 'Среднее 24h',
    value: formatPercent(marketSummary.value.averageChange),
    tone: marketSummary.value.averageChange >= 0 ? 'positive' : 'negative',
  },
  {
    label: 'Объем 24h',
    value: selectedMarket.value.volume,
    tone: 'neutral',
  },
  {
    label: 'Equity',
    value: `${formatMoney(accountSummary.value.equity)} USDT`,
    tone: accountSummary.value.unrealizedPnl >= 0 ? 'positive' : 'negative',
  },
  {
    label: 'Открытые ордера',
    value: openOrders.value.length,
    tone: 'neutral',
  },
])

const compactAsks = computed(() => orderBook.value.asks.slice(-6))
const compactBids = computed(() => orderBook.value.bids.slice(0, 6))

watch(
  () => selectedMarket.value.price,
  (price) => {
    if (order.orderType === 'market' || !order.price) {
      order.price = Number(price.toFixed(selectedMarket.value.precision))
    }
  },
  { immediate: true },
)

function formatMoney(value, precision = 2) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(Number(value || 0))
}

function formatPercent(value) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${Number(value || 0).toFixed(2)}%`
}

function setTimeframe(timeframe) {
  setMarketInterval(timeframe)
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))
}

function formatChartTime(point) {
  const rawValue = Number(point?.time ?? point?.id)

  if (!Number.isFinite(rawValue) || rawValue < 100000000000) {
    return selectedInterval.value
  }

  const options = selectedInterval.value === '1d'
    ? { day: '2-digit', month: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' }

  return new Intl.DateTimeFormat('ru-RU', options).format(new Date(rawValue))
}

function formatSideLabel(side) {
  return side === 'buy' ? 'Long' : 'Short'
}

function formatOrderType(type) {
  const labels = {
    market: 'Market',
    limit: 'Limit',
    trigger: 'Trigger',
  }

  return labels[type] ?? type
}

function formatSymbolPrice(symbol, value) {
  const market = markets.value.find((item) => item.symbol === symbol)
  return formatMoney(value, market?.precision ?? 2)
}

function getPositionPnl(position) {
  const market = markets.value.find((item) => item.symbol === position.symbol)

  if (!market) {
    return 0
  }

  const direction = position.side === 'buy' ? 1 : -1
  return (market.price - position.entryPrice) * position.amount * direction
}

function closePositionById(id) {
  const result = closePosition(id)

  if (!result) {
    return
  }

  const netPnl = result.realizedPnl - result.fee
  lastTicketTitle.value = `${result.closedPositionId} закрыта: ${formatMoney(netPnl)} USDT`
}

function submitMarketOrder() {
  if (!Number(order.amount) || Number(order.amount) <= 0) {
    alert('Укажите объем позиции больше нуля.')
    return
  }

  if (order.orderType !== 'market' && (!Number(order.price) || Number(order.price) <= 0)) {
    alert('Для Limit или Trigger ордера нужна цена.')
    return
  }

  const result = placeDemoOrder(order)
  lastTicketTitle.value = `${result.id} ${result.status}`
  order.note = ''
}
</script>

<template>
  <section class="terminal-shell">
    <div class="terminal-topline">
      <div>
        <p class="eyebrow">Real market · demo trading</p>
        <h1>StockDesk X</h1>
        <p class="market-source-line">
          <span class="market-source-dot" :class="{ live: isLiveMarket }"></span>
          <span>{{ marketStatus }}</span>
          <span v-if="lastUpdated">· {{ formatTime(lastUpdated) }}</span>
        </p>
      </div>

      <div class="account-dock" aria-label="Счет">
        <div>
          <span>Wallet</span>
          <strong>{{ formatMoney(accountSummary.walletBalance) }} USDT</strong>
        </div>
        <div>
          <span>Available</span>
          <strong>{{ formatMoney(accountSummary.availableBalance) }} USDT</strong>
        </div>
        <div>
          <span>uPnL</span>
          <strong :class="accountSummary.unrealizedPnl >= 0 ? 'positive-text' : 'negative-text'">
            {{ formatMoney(accountSummary.unrealizedPnl) }} USDT
          </strong>
        </div>
        <div>
          <span>Margin</span>
          <strong>{{ formatMoney(accountSummary.marginUsed) }} USDT</strong>
        </div>
      </div>
    </div>

    <div class="market-ticker" aria-label="Рыночные показатели">
      <div
        v-for="item in tickerItems"
        :key="item.label"
        class="ticker-cell"
        :class="`tone-${item.tone}`"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <div v-if="marketError" class="market-warning">
      {{ marketError }}
    </div>

    <div class="exchange-grid">
      <aside class="terminal-panel markets-panel">
        <div class="panel-heading">
          <h2>Markets</h2>
          <span>Spot</span>
        </div>

        <button
          v-for="market in markets"
          :key="market.symbol"
          class="market-row"
          :class="{ selected: selectedMarket.symbol === market.symbol }"
          type="button"
          @click="selectMarket(market.symbol)"
        >
          <span>
            <strong>{{ market.symbol }}</strong>
            <small>{{ market.sector }}</small>
          </span>
          <span>
            <strong>{{ formatMoney(market.price, market.precision) }}</strong>
            <small :class="market.change >= 0 ? 'positive-text' : 'negative-text'">
              {{ formatPercent(market.change) }}
            </small>
          </span>
        </button>
      </aside>

      <section class="terminal-panel chart-panel">
        <div class="instrument-header">
          <div>
            <span class="asset-badge">{{ selectedMarket.symbol }}</span>
            <h2>{{ selectedMarket.name }} spot market</h2>
          </div>
          <div class="price-stack">
            <strong>{{ formatMoney(selectedMarket.price, selectedMarket.precision) }}</strong>
            <span :class="selectedMarket.change >= 0 ? 'positive-text' : 'negative-text'">
              {{ formatPercent(selectedMarket.change) }}
            </span>
          </div>
        </div>

        <div class="timeframe-row" aria-label="Таймфреймы">
          <button
            v-for="timeframe in timeframes"
            :key="timeframe.value"
            type="button"
            :class="{ active: selectedInterval === timeframe.value }"
            @click="setTimeframe(timeframe.value)"
          >
            {{ timeframe.label }}
          </button>
          <button
            class="refresh-market-button"
            type="button"
            :disabled="isRefreshing"
            @click="refreshMarketData"
          >
            {{ isRefreshing ? 'Обновление' : 'Обновить' }}
          </button>
          <span>Авто · {{ Math.round(refreshIntervalMs / 1000) }} сек</span>
        </div>

        <div class="chart-canvas" aria-label="График цены">
          <svg class="price-chart" viewBox="0 0 600 240" preserveAspectRatio="none">
            <g class="chart-guides">
              <line
                v-for="guide in chartGuideLines"
                :key="guide.id"
                x1="24"
                x2="576"
                :y1="guide.y"
                :y2="guide.y"
              />
            </g>

            <polyline class="chart-line" :points="chartLinePoints" />
            <circle class="chart-last-dot" :cx="chartLastPoint.x" :cy="chartLastPoint.y" r="4" />

            <g class="volume-bars">
              <rect
                v-for="point in chartPoints"
                :key="point.id"
                :class="{ up: point.positive, down: !point.positive }"
                :height="point.volumeHeight"
                :x="point.x - 1.5"
                :y="224 - point.volumeHeight"
                width="3"
                rx="1.5"
              />
            </g>
          </svg>
          <div class="chart-price-label">
            {{ formatMoney(selectedMarket.price, selectedMarket.precision) }}
          </div>
          <div class="chart-time-labels" aria-hidden="true">
            <span v-for="timeLabel in chartTimeLabels" :key="timeLabel.id">
              {{ timeLabel.label }}
            </span>
          </div>
        </div>

        <div class="depth-strip">
          <div>
            <span>Best bid</span>
            <strong class="positive-text">
              {{ formatMoney(orderBook.bids[0]?.price, selectedMarket.precision) }}
            </strong>
          </div>
          <div>
            <span>Best ask</span>
            <strong class="negative-text">
              {{ formatMoney(orderBook.asks[orderBook.asks.length - 1]?.price, selectedMarket.precision) }}
            </strong>
          </div>
          <div>
            <span>Spread</span>
            <strong>
              {{
                formatMoney(
                  (orderBook.asks[orderBook.asks.length - 1]?.price ?? 0) -
                    (orderBook.bids[0]?.price ?? 0),
                  selectedMarket.precision,
                )
              }}
            </strong>
          </div>
        </div>

        <div class="instrument-stats instrument-stats--wide">
          <div>
            <span>Mark price</span>
            <strong>{{ formatMoney(selectedMarket.price * 1.0002, selectedMarket.precision) }}</strong>
          </div>
          <div>
            <span>Источник</span>
            <strong>{{ isLiveMarket ? 'Binance Spot' : 'Fallback' }}</strong>
          </div>
          <div>
            <span>High 24h</span>
            <strong>{{ formatMoney(selectedMarket.high, selectedMarket.precision) }}</strong>
          </div>
          <div>
            <span>Low 24h</span>
            <strong>{{ formatMoney(selectedMarket.low, selectedMarket.precision) }}</strong>
          </div>
          <div>
            <span>Volume</span>
            <strong>{{ selectedMarket.volume }}</strong>
          </div>
        </div>
      </section>

      <aside class="terminal-panel compact-book-panel">
        <div class="panel-heading">
          <h2>Стакан</h2>
          <span>Depth</span>
        </div>

        <div class="book-head book-head--three">
          <span>Цена</span>
          <span>Кол-во</span>
          <span>Всего</span>
        </div>

        <div class="book-list">
          <div
            v-for="ask in compactAsks"
            :key="`ask-${ask.price}`"
            class="book-row book-row--three ask"
            :style="{ '--depth': `${ask.depth}%` }"
          >
            <span>{{ formatMoney(ask.price, selectedMarket.precision) }}</span>
            <span>{{ ask.amount.toFixed(3) }}</span>
            <span>{{ ask.total.toFixed(2) }}</span>
          </div>
        </div>

        <div class="mid-price">
          {{ formatMoney(selectedMarket.price, selectedMarket.precision) }}
        </div>

        <div class="book-list">
          <div
            v-for="bid in compactBids"
            :key="`bid-${bid.price}`"
            class="book-row book-row--three bid"
            :style="{ '--depth': `${bid.depth}%` }"
          >
            <span>{{ formatMoney(bid.price, selectedMarket.precision) }}</span>
            <span>{{ bid.amount.toFixed(3) }}</span>
            <span>{{ bid.total.toFixed(2) }}</span>
          </div>
        </div>
      </aside>

      <aside class="terminal-panel order-panel">
        <div class="panel-heading">
          <h2>Ордер</h2>
          <span>Demo</span>
        </div>

        <div class="trade-tabs">
          <button
            type="button"
            :class="{ active: order.side === 'buy' }"
            @click="order.side = 'buy'"
          >
            Long
          </button>
          <button
            type="button"
            :class="{ active: order.side === 'sell' }"
            @click="order.side = 'sell'"
          >
            Short
          </button>
        </div>

        <div class="order-mode-tabs">
          <button
            v-for="type in ['market', 'limit', 'trigger']"
            :key="type"
            type="button"
            :class="{ active: order.orderType === type }"
            @click="order.orderType = type"
          >
            {{ type }}
          </button>
        </div>

        <div class="order-mode-tabs">
          <button
            v-for="mode in ['cross', 'isolated']"
            :key="mode"
            type="button"
            :class="{ active: order.marginMode === mode }"
            @click="order.marginMode = mode"
          >
            {{ mode }}
          </button>
        </div>

        <label v-if="order.orderType !== 'market'">
          <span>Цена USDT</span>
          <input v-model.number="order.price" min="0.0001" step="0.01" type="number" />
        </label>

        <label>
          <span>Объем {{ selectedMarket.symbol.split('/')[0] }}</span>
          <input v-model.number="order.amount" min="0.01" step="0.01" type="number" />
        </label>

        <label>
          <span>Плечо x{{ order.leverage }}</span>
          <input v-model.number="order.leverage" max="25" min="1" step="1" type="range" />
        </label>

        <div class="inline-fields">
          <label>
            <span>TP</span>
            <input v-model="order.takeProfit" type="number" placeholder="цель" />
          </label>
          <label>
            <span>SL</span>
            <input v-model="order.stopLoss" type="number" placeholder="стоп" />
          </label>
        </div>

        <div class="order-calculation">
          <div>
            <span>Объем</span>
            <strong>{{ formatMoney(notionalValue) }} USDT</strong>
          </div>
          <div>
            <span>Маржа</span>
            <strong>{{ formatMoney(marginValue) }} USDT</strong>
          </div>
          <div>
            <span>Комиссия</span>
            <strong>{{ formatMoney(feeValue) }} USDT</strong>
          </div>
        </div>

        <button class="trade-button" :class="order.side" type="button" @click="submitMarketOrder">
          {{ order.side === 'buy' ? 'Открыть Long' : 'Открыть Short' }}
        </button>

        <p v-if="lastTicketTitle" class="last-ticket">Последний ордер: {{ lastTicketTitle }}</p>
      </aside>
    </div>

    <div class="terminal-bottom">
      <section class="terminal-panel positions-panel">
        <div class="panel-heading compact-heading">
          <h2>Позиции</h2>
          <span>{{ positions.length }} активных</span>
        </div>

        <div class="mini-table mini-table--positions">
          <div class="mini-table-head">
            <span>Пара</span>
            <span>Сторона</span>
            <span>Вход</span>
            <span>PnL</span>
            <span></span>
          </div>

          <p v-if="!positions.length" class="empty-table-text">
            Откройте Market-ордер, чтобы позиция появилась здесь.
          </p>

          <div v-for="position in positions" :key="position.id" class="mini-table-row">
            <span>{{ position.symbol }}</span>
            <span :class="position.side === 'buy' ? 'positive-text' : 'negative-text'">
              {{ formatSideLabel(position.side) }} x{{ position.leverage }}
            </span>
            <span>{{ formatSymbolPrice(position.symbol, position.entryPrice) }}</span>
            <span :class="getPositionPnl(position) >= 0 ? 'positive-text' : 'negative-text'">
              {{ formatMoney(getPositionPnl(position)) }}
            </span>
            <button type="button" @click="closePositionById(position.id)">Закрыть</button>
          </div>
        </div>
      </section>

      <section class="terminal-panel positions-panel">
        <div class="panel-heading compact-heading">
          <h2>Ордера</h2>
          <span>{{ openOrders.length }} открытых</span>
        </div>

        <div class="mini-table">
          <div class="mini-table-head">
            <span>Пара</span>
            <span>Тип</span>
            <span>Цена</span>
            <span></span>
          </div>

          <p v-if="!openOrders.length" class="empty-table-text">
            Limit и Trigger-ордера будут ждать исполнения в этой таблице.
          </p>

          <div v-for="orderItem in openOrders" :key="orderItem.id" class="mini-table-row">
            <span>{{ orderItem.symbol }}</span>
            <span>{{ formatOrderType(orderItem.type) }}</span>
            <span>{{ formatSymbolPrice(orderItem.symbol, orderItem.price) }}</span>
            <button type="button" @click="cancelOrder(orderItem.id)">Отменить</button>
          </div>
        </div>
      </section>

      <section class="terminal-panel positions-panel">
        <div class="panel-heading compact-heading">
          <h2>Сделки</h2>
          <span>Live tape</span>
        </div>

        <div class="mini-table">
          <div class="mini-table-head">
            <span>Цена</span>
            <span>Объем</span>
            <span>Сторона</span>
            <span>Время</span>
          </div>

          <div v-for="trade in recentTrades.slice(0, 5)" :key="trade.id" class="mini-table-row">
            <span :class="trade.side === 'buy' ? 'positive-text' : 'negative-text'">
              {{ formatMoney(trade.price, selectedMarket.precision) }}
            </span>
            <span>{{ trade.amount.toFixed(3) }}</span>
            <span>{{ formatSideLabel(trade.side) }}</span>
            <span>{{ trade.time }}</span>
          </div>
        </div>
      </section>
    </div>
  </section>

</template>
