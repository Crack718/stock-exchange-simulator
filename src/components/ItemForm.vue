<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  initialItem: {
    type: Object,
    default: null,
  },
  submitLabel: {
    type: String,
    default: 'Сохранить',
  },
})

const emit = defineEmits(['submit'])

const categories = ['Акции', 'Облигации', 'Криптовалюта', 'ETF', 'Валюта', 'Фьючерсы']

const form = reactive({
  title: '',
  description: '',
  category: categories[0],
  isDone: false,
})

watch(
  () => props.initialItem,
  (item) => {
    form.title = item?.title ?? ''
    form.description = item?.description ?? ''
    form.category = item?.category ?? categories[0]
    form.isDone = item?.isDone ?? false
  },
  { immediate: true },
)

function validateForm() {
  // Form validation keeps incomplete trading records out of the shared state.
  if (!form.title.trim() || !form.description.trim() || !form.category) {
    alert('Заполните название, описание и категорию.')
    return false
  }

  return true
}

function handleSubmit() {
  if (!validateForm()) {
    return
  }

  emit('submit', {
    title: form.title,
    description: form.description,
    category: form.category,
    isDone: form.isDone,
  })
}
</script>

<template>
  <form class="item-form" @submit.prevent="handleSubmit">
    <label>
      <span>Название сделки</span>
      <input v-model="form.title" type="text" placeholder="Например: NVDA покупка на откате" />
    </label>

    <label>
      <span>Категория</span>
      <select v-model="form.category">
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </label>

    <label class="full-width">
      <span>Описание</span>
      <textarea
        v-model="form.description"
        rows="6"
        placeholder="Кратко опишите идею, риск, цель или условие закрытия"
      ></textarea>
    </label>

    <label class="checkbox-row full-width">
      <input v-model="form.isDone" type="checkbox" />
      <span>Сделка закрыта</span>
    </label>

    <div class="form-actions full-width">
      <button class="primary-button" type="submit">{{ submitLabel }}</button>
    </div>
  </form>
</template>
