// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

import DashboardView from '../views/DashboardView.vue'
import EditExpenseView from '../views/Editexpenseview.vue'
import ExpensesView from '../views/ExpensesView.vue'
import InflationView from '../views/InflationView.vue'
import WageTrackerView from '../views/WageTrackerView.vue'
import CpiCompareView from '../views/CpiCompareView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginView, meta: { hideLayout: true } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { hideLayout: true } },
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/expenses/:id/edit', name: 'EditExpense', component: EditExpenseView },
  { path: '/expenses', name: 'Expenses', component: ExpensesView },
  { path: '/inflation', name: 'My Inflation', component: InflationView },
  { path: '/wages', name: 'Wage Tracker', component: WageTrackerView },
  { path: '/compare', name: 'CPI Compare', component: CpiCompareView },
  { path: '/settings', name: 'Settings', component: SettingsView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Used in route guard reliably get the current user's sign-in state by waiting for the SDK to finish initializing. 
function getCurrentUser() {
  return new Promise((resolve) => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

const authPages = ['Login', 'Register']

// Route guard, checks if user is authenticated when changing views
// Redirects to login if not authenticated
router.beforeEach(async (to, from, next) => {
  const user = await getCurrentUser()

  if (!authPages.includes(to.name) && !user) {
    next({ name: 'Login' })
  } else if (authPages.includes(to.name) && user) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router