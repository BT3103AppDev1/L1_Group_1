<template>
  <!-- Login page has no layout -->
  <router-view v-if="$route.meta.hideLayout" />

  <!-- Main app layout with sidebar -->
  <div v-else class="app-layout">
    <SidebarNav />
    <main class="main-content">
      <TopBar />
      <div class="page-content fade-enter-active" :key="$route.path">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script>
import SidebarNav from './components/SidebarNav.vue'
import TopBar from './components/TopBar.vue'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase.js'

const TIMEOUT_DURATION = 1000 * 60 * 30  // 30 minutes in milliseconds
const THROTTLE_DELAY = 1000  // 1 second in milliseconds
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']  // Events that will reset inactivity timer

export default {
  name: 'App',
  components: { SidebarNav, TopBar },

  data() {
    return {
      timer: null,  // Inactivity timer object
      throttledResetTimer: null,  // Throttled timer object
      authUnsubscribe: null  // Save unsubscribe function for clean up later
    }
  },

  methods: {
    // Resets/Initialises inactivity timer to 30 minutes, called whenver an activtity is sensed
    resetTimer() {
      clearTimeout(this.timer)
      this.timer = setTimeout(this.handleTimeout, TIMEOUT_DURATION)
    },

    // Signs user out, called after 30 minutes of inactivity
    async handleTimeout() {
      if (auth.currentUser) {
        await signOut(auth)
        this.$router.push({ name: 'Login' })
      }
    },

    // Initialises timer, throttler and activity event listeners
    startActivityTracking() {
      this.throttledResetTimer = this.throttle(this.resetTimer, THROTTLE_DELAY)
      ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, this.resetTimer))
      this.resetTimer()
    },

    // Cleans up timer, throttler, and activity event listeners to avoid memory leak
    stopActivityTracking() {
      if (this.throttledResetTimer) {
        ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, this.resetTimer))
        this.throttledResetTimer = null
      }
      clearTimeout(this.timer)
    },

    // Throttle function to prevent activity listeners from firing too many times in quick succession.
    throttle(fn, delay) {
      let lastCall = 0
      return function (...args) {
        const now = Date.now()
        if (now - lastCall >= delay) {
          lastCall = now
          fn.apply(this, args)
        }
      }
    }
  },

  // Only track inactivity on logged in pages
  // No need to track on login and register pages.
  mounted() {
    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.startActivityTracking()
      } else {
        this.stopActivityTracking()
      }
    })
  },

  // Clean up to prevent memory leak
  beforeUnmount() {
    this.stopActivityTracking()
    this.authUnsubscribe?.()
  },
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  margin-left: 240px;
  flex: 1;
  min-height: 100vh;
}

.page-content {
  padding: 28px 32px;
}
</style>
