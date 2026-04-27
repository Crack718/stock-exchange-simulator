const ITEMS_KEY = 'stockdesk_items'
const SETTINGS_KEY = 'stockdesk_settings'

const seedItems = [
  {
    id: 'seed-aapl-long',
    title: 'AAPL: покупка от поддержки',
    description: 'Тестовая сделка: дождаться отката к зоне 190 и закрыть идею после достижения цели.',
    category: 'Акции',
    createdAt: Date.now() - 86400000 * 4,
    isDone: false,
    deletedAt: null,
  },
  {
    id: 'seed-bonds-income',
    title: 'ОФЗ: защитная позиция',
    description: 'Добавить облигации в портфель для снижения риска и стабильного купонного дохода.',
    category: 'Облигации',
    createdAt: Date.now() - 86400000 * 3,
    isDone: true,
    deletedAt: null,
  },
  {
    id: 'seed-btc-watch',
    title: 'BTC: наблюдение за пробоем',
    description: 'Открыть виртуальную позицию только после закрепления цены выше локального сопротивления.',
    category: 'Криптовалюта',
    createdAt: Date.now() - 86400000,
    isDone: false,
    deletedAt: null,
  },
]

export const defaultSettings = {
  theme: 'dark',
  colorScheme: 'cold',
  viewMode: 'cards',
  confirmDelete: true,
  compactMode: false,
  marketAnimation: true,
}

function readJson(key, fallback) {
  const rawValue = localStorage.getItem(key)

  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue)
  } catch (error) {
    console.warn(`Cannot parse ${key} from LocalStorage`, error)
    return fallback
  }
}

export function getItems() {
  const items = readJson(ITEMS_KEY, [])
  return Array.isArray(items) ? items : []
}

export function saveItems(items) {
  // Saving is centralized here so UI components never touch LocalStorage directly.
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
}

export function getSettings() {
  const settings = readJson(SETTINGS_KEY, defaultSettings)
  return {
    ...defaultSettings,
    ...(settings && typeof settings === 'object' ? settings : {}),
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function initDataIfEmpty() {
  const existingItems = getItems()

  if (existingItems.length > 0) {
    return existingItems
  }

  // Demo records are initialized only for an empty browser storage.
  saveItems(seedItems)
  return seedItems
}
