import { createRouter, createWebHistory } from 'vue-router'
import { useLoader } from '../composables/useLoader'
import HomeView from '../views/HomeView.vue'
import CreateView from '../views/CreateView.vue'
import EditView from '../views/EditView.vue'
import AboutView from '../views/AboutView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/create', name: 'create', component: CreateView },
    { path: '/edit/:id', name: 'edit', component: EditView },
    { path: '/about', name: 'about', component: AboutView },
    { path: '/stats', name: 'stats', component: StatsView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach(() => {
  // Router guard starts the blocking loader before each route transition.
  const { showLoader } = useLoader()
  showLoader()
})

router.afterEach(() => {
  // Small delay makes the overlay visible and keeps route changes feeling stable.
  const { hideLoader } = useLoader()
  hideLoader(420)
})

export default router
