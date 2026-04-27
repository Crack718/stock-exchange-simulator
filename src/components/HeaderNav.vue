<script setup>
import { RouterLink } from 'vue-router'
import { useItems } from '../composables/useItems'

const { activeCount } = useItems()

const navItems = [
  { to: '/', label: 'Терминал' },
  { to: '/create', label: 'План' },
  { to: '/stats', label: 'Аналитика' },
  { to: '/settings', label: 'Настройки' },
  { to: '/about', label: 'О проекте' },
]
</script>

<template>
  <header class="header-nav">
    <RouterLink class="brand-link" to="/">
      <span class="brand-mark">SX</span>
      <span class="brand-copy">
        <strong>StockDesk X</strong>
        <small>perpetual terminal</small>
      </span>
    </RouterLink>

    <nav class="main-nav" aria-label="Главная навигация">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        class="nav-link"
        active-class="is-active"
        :to="item.to"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="market-status" aria-label="Состояние портфеля">
      <span class="status-dot"></span>
      <span>{{ activeCount }} активных</span>
    </div>
  </header>
</template>
