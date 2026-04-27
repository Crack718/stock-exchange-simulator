<script setup>
defineProps({
  search: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'all',
  },
  status: {
    type: String,
    default: 'all',
  },
  categories: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:search', 'update:category', 'update:status', 'reset'])
</script>

<template>
  <section class="filters-panel">
    <label>
      <span>Поиск</span>
      <input
        :value="search"
        type="search"
        placeholder="Название или описание"
        @input="$emit('update:search', $event.target.value)"
      />
    </label>

    <label>
      <span>Категория</span>
      <select :value="category" @change="$emit('update:category', $event.target.value)">
        <option value="all">Все категории</option>
        <option v-for="option in categories" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </label>

    <label>
      <span>Статус</span>
      <select :value="status" @change="$emit('update:status', $event.target.value)">
        <option value="all">Все</option>
        <option value="active">Активные</option>
        <option value="done">Закрытые</option>
      </select>
    </label>

    <button class="text-button" type="button" @click="$emit('reset')">Сбросить</button>
  </section>
</template>
