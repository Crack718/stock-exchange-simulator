<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  viewMode: {
    type: String,
    default: 'cards',
  },
})

defineEmits(['toggle', 'delete'])

const createdAt = computed(() =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(props.item.createdAt),
)
</script>

<template>
  <article class="item-card" :class="[`item-card--${viewMode}`, { 'is-done': item.isDone }]">
    <div class="item-main">
      <div class="item-heading">
        <span class="asset-badge">{{ item.category }}</span>
        <span class="item-date">{{ createdAt }}</span>
      </div>

      <h3>{{ item.title }}</h3>
      <p>{{ item.description }}</p>
    </div>

    <div class="item-state">
      <button
        class="status-button"
        :class="{ 'status-button--done': item.isDone }"
        type="button"
        @click="$emit('toggle', item.id)"
      >
        {{ item.isDone ? 'Закрыта' : 'Активна' }}
      </button>
    </div>

    <div class="item-actions">
      <RouterLink class="text-button" :to="`/edit/${item.id}`">Редактировать</RouterLink>
      <button class="text-button danger" type="button" @click="$emit('delete', item.id)">
        Удалить
      </button>
    </div>
  </article>
</template>
