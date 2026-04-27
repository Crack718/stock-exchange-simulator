<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <p class="eyebrow">404</p>
    <h1>Страница не найдена</h1>
    <p>Такого маршрута нет в приложении.</p>
    <RouterLink class="primary-button" to="/">На главную</RouterLink>
  </section>
</template>
