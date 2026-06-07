<script setup>
import { computed } from 'vue'
import { useMarketSimulator } from '../composables/useMarketSimulator'

const { markets, marketSummary, accountSummary, positions, openOrders } = useMarketSimulator()

const growingMarkets = computed(() =>
  [...markets.value].sort((first, second) => second.change - first.change).slice(0, 4),
)

const fallingMarkets = computed(() =>
  [...markets.value].sort((first, second) => first.change - second.change).slice(0, 4),
)
</script>

<template>
  <section class="page-header">
    <p class="eyebrow">Аналитика</p>
    <h1>Статистика биржи</h1>
  </section>

  <section class="stats-grid">
    <div class="stat-block">
      <span>Среднее 24h</span>
      <strong :class="marketSummary.averageChange >= 0 ? 'positive-text' : 'negative-text'">
        {{ marketSummary.averageChange > 0 ? '+' : '' }}{{ marketSummary.averageChange.toFixed(2) }}%
      </strong>
      <small>{{ marketSummary.positive }} растут / {{ marketSummary.negative }} падают</small>
    </div>
    <div class="stat-block">
      <span>Equity</span>
      <strong>{{ accountSummary.equity.toFixed(2) }} USDT</strong>
      <small>Учебный баланс терминала</small>
    </div>
    <div class="stat-block">
      <span>Позиции</span>
      <strong>{{ positions.length }}</strong>
      <small>Открытые демо-позиции</small>
    </div>
    <div class="stat-block">
      <span>Ордера</span>
      <strong>{{ openOrders.length }}</strong>
      <small>Ожидают исполнения</small>
    </div>
  </section>

  <section class="split-layout">
    <div>
      <h2>Лидеры роста</h2>
      <ul class="plain-list">
        <li v-for="market in growingMarkets" :key="market.symbol">
          <span>{{ market.symbol }}</span>
          <strong :class="market.change >= 0 ? 'positive-text' : 'negative-text'">
            {{ market.change > 0 ? '+' : '' }}{{ market.change.toFixed(2) }}%
          </strong>
        </li>
      </ul>
    </div>

    <div>
      <h2>Слабые рынки</h2>
      <ul class="plain-list">
        <li v-for="market in fallingMarkets" :key="market.symbol">
          <span>{{ market.symbol }}</span>
          <strong :class="market.change >= 0 ? 'positive-text' : 'negative-text'">
            {{ market.change > 0 ? '+' : '' }}{{ market.change.toFixed(2) }}%
          </strong>
        </li>
      </ul>
    </div>
  </section>
</template>
