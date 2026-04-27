import { reactive, watch } from 'vue'
import { defaultSettings, getSettings, saveSettings } from '../services/storage'

const settings = reactive(getSettings())

watch(
  settings,
  (currentSettings) => {
    saveSettings(currentSettings)
  },
  { deep: true },
)

export function useSettings() {
  function setTheme(theme) {
    settings.theme = theme
  }

  function setColorScheme(colorScheme) {
    settings.colorScheme = colorScheme
  }

  function setViewMode(viewMode) {
    settings.viewMode = viewMode
  }

  function setConfirmDelete(value) {
    settings.confirmDelete = value
  }

  function setCompactMode(value) {
    settings.compactMode = value
  }

  function setMarketAnimation(value) {
    settings.marketAnimation = value
  }

  function resetSettings() {
    Object.assign(settings, defaultSettings)
  }

  return {
    settings,
    setTheme,
    setColorScheme,
    setViewMode,
    setConfirmDelete,
    setCompactMode,
    setMarketAnimation,
    resetSettings,
  }
}
