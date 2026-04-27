import { ref } from 'vue'

const isLoading = ref(false)
let timerId = null

export function useLoader() {
  function showLoader() {
    window.clearTimeout(timerId)
    isLoading.value = true
  }

  function hideLoader(delay = 0) {
    window.clearTimeout(timerId)
    timerId = window.setTimeout(() => {
      isLoading.value = false
    }, delay)
  }

  return {
    isLoading,
    showLoader,
    hideLoader,
  }
}
