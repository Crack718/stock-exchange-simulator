import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import HomeView from './HomeView.vue'

const marketMock = {
  markets: ref([
    {
      symbol: 'BTC/USDT',
      apiSymbol: 'BTCUSDT',
      name: 'Bitcoin',
      sector: 'Spot',
      price: 70000,
      change: 2.4,
      volume: '1.2B USDT',
      high: 71000,
      low: 68000,
      precision: 2,
    },
    {
      symbol: 'ETH/USDT',
      apiSymbol: 'ETHUSDT',
      name: 'Ethereum',
      sector: 'Spot',
      price: 3500,
      change: -0.8,
      volume: '820M USDT',
      high: 3600,
      low: 3400,
      precision: 2,
    },
  ]),
  selectedSymbol: ref('BTC/USDT'),
  selectedInterval: ref('5m'),
  priceHistory: ref([]),
  orderBook: ref({ asks: [], bids: [] }),
  recentTrades: ref([]),
  positions: ref([]),
  openOrders: ref([]),
  tradeHistory: ref([]),
  isLiveMarket: ref(true),
  isRefreshing: ref(false),
  marketStatus: ref('Реальные данные Binance Spot'),
  marketError: ref(''),
  lastUpdated: ref(Date.now()),
  refreshIntervalMs: 5000,
  selectMarket: vi.fn(),
  setMarketInterval: vi.fn(),
  refreshMarketData: vi.fn(),
  placeDemoOrder: vi.fn(),
  cancelOrder: vi.fn(),
  closePosition: vi.fn(),
}

marketMock.selectedMarket = computed(
  () =>
    marketMock.markets.value.find((market) => market.symbol === marketMock.selectedSymbol.value) ??
    marketMock.markets.value[0],
)

marketMock.marketSummary = computed(() => ({
  positive: 1,
  negative: 1,
  averageChange: 0.8,
}))

marketMock.accountSummary = computed(() => ({
  walletBalance: 12500,
  marginUsed: 0,
  availableBalance: 12500,
  equity: 12500,
  unrealizedPnl: 0,
}))

vi.mock('../composables/useMarketSimulator', () => ({
  useMarketSimulator: () => marketMock,
}))

function fillMarketData() {
  marketMock.priceHistory.value = Array.from({ length: 8 }, (_, index) => ({
    id: Date.now() + index,
    time: Date.now() + index * 60000,
    value: 69000 + index * 120,
    height: 20 + index * 3,
    positive: index % 2 === 0,
  }))
  marketMock.orderBook.value = {
    asks: Array.from({ length: 6 }, (_, index) => ({
      price: 70050 + index * 10,
      amount: 0.1 + index * 0.02,
      total: 1 + index,
      depth: 40 + index * 8,
    })),
    bids: Array.from({ length: 6 }, (_, index) => ({
      price: 69950 - index * 10,
      amount: 0.12 + index * 0.02,
      total: 1 + index,
      depth: 42 + index * 8,
    })),
  }
  marketMock.recentTrades.value = Array.from({ length: 5 }, (_, index) => ({
    id: index,
    side: index % 2 === 0 ? 'buy' : 'sell',
    price: 70000 + index * 5,
    amount: 0.02 + index * 0.01,
    time: '12:00:00',
  }))
}

describe('HomeView exchange terminal', () => {
  beforeEach(() => {
    fillMarketData()
    marketMock.selectedSymbol.value = 'BTC/USDT'
    marketMock.selectedInterval.value = '5m'
    marketMock.positions.value = []
    marketMock.openOrders.value = []
    marketMock.isRefreshing.value = false
    marketMock.placeDemoOrder.mockReset()
    marketMock.closePosition.mockReset()
    marketMock.refreshMarketData.mockReset()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('renders the selected market and auto refresh status', () => {
    const wrapper = mount(HomeView)

    expect(wrapper.text()).toContain('StockDesk X')
    expect(wrapper.text()).toContain('BTC/USDT')
    expect(wrapper.text()).toContain('Авто · 5 сек')
    expect(wrapper.text()).toContain('Открыть Long')
  })

  it('changes the order side after user clicks Short', async () => {
    const wrapper = mount(HomeView)

    await wrapper.get('.trade-tabs button:nth-child(2)').trigger('click')

    expect(wrapper.get('.trade-button').text()).toContain('Открыть Short')
  })

  it('shows validation error when amount is empty', async () => {
    const wrapper = mount(HomeView)

    await wrapper.get('label input[type="number"]').setValue('0')
    await wrapper.get('.trade-button').trigger('click')

    expect(window.alert).toHaveBeenCalledWith('Укажите объем позиции больше нуля.')
    expect(marketMock.placeDemoOrder).not.toHaveBeenCalled()
  })

  it('calls closePosition when user closes an open position', async () => {
    marketMock.positions.value = [
      {
        id: 'POS-1',
        symbol: 'BTC/USDT',
        side: 'buy',
        entryPrice: 69000,
        amount: 0.1,
        leverage: 5,
        marginMode: 'cross',
        margin: 1380,
      },
    ]
    marketMock.closePosition.mockReturnValue({
      closedPositionId: 'POS-1',
      realizedPnl: 100,
      fee: 3.5,
    })
    const wrapper = mount(HomeView)

    await wrapper.get('.mini-table--positions button').trigger('click')

    expect(marketMock.closePosition).toHaveBeenCalledWith('POS-1')
    expect(wrapper.text()).toContain('POS-1 закрыта')
  })
})
