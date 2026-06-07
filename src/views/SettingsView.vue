<script setup>
import { computed } from 'vue'
import { useSettings } from '../composables/useSettings'

const {
  settings,
  setTheme,
  setCompactMode,
  setMarketAnimation,
  resetSettings,
} = useSettings()

const themes = [
  { value: 'dark', label: 'Темная' },
  { value: 'light', label: 'Светлая' },
]

const interfaceModes = [
  { value: false, label: 'Обычный' },
  { value: true, label: 'Компактный' },
]

const summaryItems = computed(() => [
  {
    label: 'Тема',
    value: settings.theme === 'dark' ? 'Темная' : 'Светлая',
  },
  {
    label: 'Плотность',
    value: settings.compactMode ? 'Компактная' : 'Обычная',
  },
  {
    label: 'Автообновление',
    value: settings.marketAnimation ? '5 секунд' : 'Пауза',
  },
])
</script>

<template>
  <section class="page-header">
    <p class="eyebrow">Настройки</p>
    <h1>Параметры интерфейса</h1>
  </section>

  <section class="settings-layout settings-layout--advanced">
    <div class="settings-group">
      <div class="settings-group-header">
        <h2>Тема</h2>
        <span>{{ settings.theme === 'dark' ? 'Dark' : 'Light' }}</span>
      </div>

      <div class="segmented-control">
        <button
          v-for="theme in themes"
          :key="theme.value"
          type="button"
          :class="{ selected: settings.theme === theme.value }"
          @click="setTheme(theme.value)"
        >
          {{ theme.label }}
        </button>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-header">
        <h2>Плотность</h2>
        <span>{{ settings.compactMode ? 'Compact' : 'Default' }}</span>
      </div>

      <div class="segmented-control">
        <button
          v-for="mode in interfaceModes"
          :key="String(mode.value)"
          type="button"
          :class="{ selected: settings.compactMode === mode.value }"
          @click="setCompactMode(mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-header">
        <h2>Автообновление</h2>
        <span>{{ settings.marketAnimation ? '5 sec' : 'Pause' }}</span>
      </div>

      <label class="toggle-row">
        <input
          :checked="settings.marketAnimation"
          type="checkbox"
          @change="setMarketAnimation($event.target.checked)"
        />
        <span>Обновлять котировки, график, стакан и сделки</span>
      </label>
    </div>

    <div class="settings-group settings-preview">
      <div class="settings-group-header">
        <h2>Профиль</h2>
        <button class="text-button" type="button" @click="resetSettings">Сбросить</button>
      </div>

      <div class="settings-summary">
        <div v-for="item in summaryItems" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>

      <div class="preview-terminal" aria-hidden="true">
        <div></div>
        <span></span>
        <strong></strong>
      </div>
    </div>
  </section>
</template>
