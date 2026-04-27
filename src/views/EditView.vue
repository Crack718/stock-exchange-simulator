<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ItemForm from '../components/ItemForm.vue'
import { useItems } from '../composables/useItems'

const route = useRoute()
const router = useRouter()
const { getItemById, updateItem } = useItems()

const item = computed(() => getItemById(String(route.params.id)))

function handleUpdate(payload) {
  const isUpdated = updateItem(String(route.params.id), payload)

  if (!isUpdated) {
    alert('Запись не найдена.')
    return
  }

  router.push('/')
}
</script>

<template>
  <template v-if="item">
    <section class="page-header">
      <p class="eyebrow">Редактирование</p>
      <h1>{{ item.title }}</h1>
      <p>Обновите торговый план, категорию или статус закрытия сделки.</p>
    </section>

    <section class="form-shell">
      <ItemForm :initial-item="item" submit-label="Сохранить изменения" @submit="handleUpdate" />
    </section>
  </template>

  <section v-else class="empty-state">
    <h1>Запись не найдена</h1>
    <p>Возможно, она была удалена или ссылка устарела.</p>
    <RouterLink class="primary-button" to="/">На главную</RouterLink>
  </section>
</template>
