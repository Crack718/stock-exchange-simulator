<script setup>
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import HeaderNav from './components/HeaderNav.vue'
import AppFooter from './components/AppFooter.vue'
import AppLoader from './components/AppLoader.vue'
import { useSettings } from './composables/useSettings'

const { settings } = useSettings()

const shellClasses = computed(() => [
  `theme-${settings.theme}`,
  `scheme-${settings.colorScheme}`,
  settings.compactMode ? 'density-compact' : 'density-comfort',
  settings.marketAnimation ? 'motion-live' : 'motion-paused',
])
</script>

<template>
  <div class="app-shell" :class="shellClasses">
    <HeaderNav />
    <AppLoader />

    <main class="app-main">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>
