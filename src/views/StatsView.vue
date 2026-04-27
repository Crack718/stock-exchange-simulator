<script setup>
import { computed } from 'vue'
import { useItems } from '../composables/useItems'

const { visibleItems, totalCount, activeCount, doneCount } = useItems()

const completionRate = computed(() =>
  totalCount.value ? Math.round((doneCount.value / totalCount.value) * 100) : 0,
)

const categoryStats = computed(() => {
  const stats = new Map()

  visibleItems.value.forEach((item) => {
    const current = stats.get(item.category) ?? { total: 0, done: 0 }
    current.total += 1
    current.done += item.isDone ? 1 : 0
    stats.set(item.category, current)
  })

  return [...stats.entries()]
    .map(([category, value]) => ({
      category,
      total: value.total,
      done: value.done,
      percent: Math.round((value.done / value.total) * 100),
    }))
    .sort((first, second) => second.total - first.total)
})

const latestItems = computed(() =>
  [...visibleItems.value].sort((first, second) => second.createdAt - first.createdAt).slice(0, 4),
)
</script>

<template>
  <section class="page-header">
    <p class="eyebrow">Аналитика</p>
    <h1>Статистика портфеля</h1>
  </section>

  <section class="stats-grid">
    <div class="stat-block">
      <span>Завершенность</span>
      <strong>{{ completionRate }}%</strong>
      <div class="progress-line">
        <span :style="{ width: `${completionRate}%` }"></span>
      </div>
    </div>
    <div class="stat-block">
      <span>Активные идеи</span>
      <strong>{{ activeCount }}</strong>
      <small>Еще требуют решения</small>
    </div>
    <div class="stat-block">
      <span>Закрытые идеи</span>
      <strong>{{ doneCount }}</strong>
      <small>Отмечены как выполненные</small>
    </div>
    <div class="stat-block">
      <span>В работе</span>
      <strong>{{ totalCount }}</strong>
      <small>Все актуальные планы</small>
    </div>
  </section>

  <section class="split-layout">
    <div>
      <h2>Категории</h2>
      <div v-if="categoryStats.length" class="category-list">
        <div v-for="item in categoryStats" :key="item.category" class="category-row">
          <div>
            <strong>{{ item.category }}</strong>
            <span>{{ item.done }} из {{ item.total }} закрыто</span>
          </div>
          <div class="progress-line compact">
            <span :style="{ width: `${item.percent}%` }"></span>
          </div>
        </div>
      </div>
      <p v-else class="muted-text">Нет данных для расчета категорий.</p>
    </div>

    <div>
      <h2>Последние записи</h2>
      <ul v-if="latestItems.length" class="plain-list">
        <li v-for="item in latestItems" :key="item.id">
          <span>{{ item.category }}</span>
          <strong>{{ item.title }}</strong>
        </li>
      </ul>
      <p v-else class="muted-text">Портфель пока пуст.</p>
    </div>
  </section>
</template>
