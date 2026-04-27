<script setup>
import { computed } from 'vue'
import { useSettings } from '../composables/useSettings'

const {
  settings,
  setTheme,
  setViewMode,
  setConfirmDelete,
  setCompactMode,
  setMarketAnimation,
  resetSettings,
} = useSettings()

const themes = [
  { value: 'dark', label: 'Темная' },
  { value: 'light', label: 'Светлая' },
]

const viewModes = [
  { value: 'cards', label: 'Карточки' },
  { value: 'table', label: 'Таблица' },
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
    label: 'Журнал',
    value: settings.viewMode === 'cards' ? 'Карточки' : 'Таблица',
  },
  {
    label: 'Плотность',
    value: settings.compactMode ? 'Компактная' : 'Обычная',
  },
  {
    label: 'Рынок',
    value: settings.marketAnimation ? 'Live' : 'Пауза',
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
        <h2>Журнал</h2>
        <span>{{ settings.viewMode === 'cards' ? 'Cards' : 'Table' }}</span>
      </div>

      <div class="segmented-control">
        <button
          v-for="mode in viewModes"
          :key="mode.value"
          type="button"
          :class="{ selected: settings.viewMode === mode.value }"
          @click="setViewMode(mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-header">
        <h2>Рынок</h2>
        <span>{{ settings.marketAnimation ? 'Live' : 'Pause' }}</span>
      </div>

      <label class="toggle-row">
        <input
          :checked="settings.marketAnimation"
          type="checkbox"
          @change="setMarketAnimation($event.target.checked)"
        />
        <span>Обновлять демо-котировки</span>
      </label>
    </div>

    <div class="settings-group">
      <div class="settings-group-header">
        <h2>Удаление</h2>
        <span>{{ settings.confirmDelete ? 'Confirm' : 'Fast' }}</span>
      </div>

      <label class="toggle-row">
        <input
          :checked="settings.confirmDelete"
          type="checkbox"
          @change="setConfirmDelete($event.target.checked)"
        />
        <span>Запрашивать подтверждение</span>
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
