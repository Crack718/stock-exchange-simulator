import { computed, ref } from 'vue'
import { getItems, initDataIfEmpty, saveItems } from '../services/storage'

const items = ref([])
let isInitialized = false

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
}

function loadItems() {
  const storedItems = getItems()
  const initialItems = storedItems.length > 0 ? storedItems : initDataIfEmpty()
  items.value = initialItems
  isInitialized = true
}

function persistItems() {
  saveItems(items.value)
}

export function useItems() {
  if (!isInitialized) {
    // Initial data is loaded once so every view works with the same singleton state.
    loadItems()
  }

  const visibleItems = computed(() => items.value.filter((item) => !item.deletedAt))
  const archivedItems = computed(() => items.value.filter((item) => item.deletedAt))
  const totalCount = computed(() => visibleItems.value.length)
  const activeCount = computed(
    () => visibleItems.value.filter((item) => !item.isDone).length,
  )
  const doneCount = computed(
    () => visibleItems.value.filter((item) => item.isDone).length,
  )
  const deletedCount = computed(() => archivedItems.value.length)

  function addItem(payload) {
    const item = {
      id: createId(),
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      createdAt: Date.now(),
      isDone: Boolean(payload.isDone),
      deletedAt: null,
    }

    items.value = [item, ...items.value]
    persistItems()
    return item
  }

  function updateItem(id, payload) {
    const item = items.value.find((currentItem) => currentItem.id === id)

    if (!item) {
      return false
    }

    item.title = payload.title.trim()
    item.description = payload.description.trim()
    item.category = payload.category
    item.isDone = Boolean(payload.isDone)
    persistItems()
    return true
  }

  function toggleDone(id) {
    const item = items.value.find((currentItem) => currentItem.id === id)

    if (!item) {
      return
    }

    item.isDone = !item.isDone
    persistItems()
  }

  function softDelete(id) {
    const item = items.value.find((currentItem) => currentItem.id === id)

    if (!item) {
      return
    }

    item.deletedAt = Date.now()
    persistItems()
  }

  function restoreItem(id) {
    const item = items.value.find((currentItem) => currentItem.id === id)

    if (!item) {
      return
    }

    item.deletedAt = null
    persistItems()
  }

  function deleteForever(id) {
    items.value = items.value.filter((item) => item.id !== id)
    persistItems()
  }

  function getItemById(id) {
    return items.value.find((item) => item.id === id)
  }

  return {
    items,
    visibleItems,
    archivedItems,
    totalCount,
    activeCount,
    doneCount,
    deletedCount,
    addItem,
    updateItem,
    toggleDone,
    softDelete,
    restoreItem,
    deleteForever,
    getItemById,
  }
}
