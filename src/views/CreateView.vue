<script setup>
import { useRouter } from 'vue-router'
import ItemForm from '../components/ItemForm.vue'
import { useItems } from '../composables/useItems'

const router = useRouter()
const { addItem } = useItems()

function handleCreate(payload) {
  addItem(payload)
  router.push('/')
}
</script>

<template>
  <section class="page-header">
    <p class="eyebrow">Новая запись</p>
    <h1>Добавление торговой идеи</h1>
  </section>

  <section class="form-shell">
    <ItemForm submit-label="Добавить идею" @submit="handleCreate" />
  </section>
</template>
