<script setup>
import { useLoader } from '../composables/useLoader'

const { isLoading } = useLoader()
</script>

<template>
  <Transition name="loader-fade">
    <div v-if="isLoading" class="app-loader" aria-live="polite" aria-busy="true">
      <div class="loader-panel">
        <span class="loader-ring"></span>
        <span>Загрузка рынка...</span>
      </div>
    </div>
  </Transition>
</template>
