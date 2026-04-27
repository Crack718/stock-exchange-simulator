<script setup>
import ItemCard from './ItemCard.vue'

defineProps({
  items: {
    type: Array,
    required: true,
  },
  viewMode: {
    type: String,
    default: 'cards',
  },
  emptyTitle: {
    type: String,
    default: 'Записей пока нет',
  },
  emptyText: {
    type: String,
    default: 'Добавьте первый торговый план, чтобы начать работу.',
  },
})

defineEmits(['toggle', 'delete'])
</script>

<template>
  <section v-if="items.length" class="item-list" :class="`item-list--${viewMode}`">
    <div v-if="viewMode === 'table'" class="table-head">
      <span>Инструмент</span>
      <span>Статус</span>
      <span>Действия</span>
    </div>

    <ItemCard
      v-for="item in items"
      :key="item.id"
      :item="item"
      :view-mode="viewMode"
      @toggle="$emit('toggle', $event)"
      @delete="$emit('delete', $event)"
    />
  </section>

  <section v-else class="empty-state">
    <h2>{{ emptyTitle }}</h2>
    <p>{{ emptyText }}</p>
  </section>
</template>
