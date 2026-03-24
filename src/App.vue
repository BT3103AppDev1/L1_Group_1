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

const TIMEOUT_DURATION = 1000 * 60 * 30
const THROTTLE_DELAY = 1000
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']

export default {
  name: 'App',
  components: { SidebarNav, TopBar },

  data() {
    return {
      timer: null,
      throttledResetTimer: null,
      authUnsubscribe: null
    }
  },

  methods: {
    resetTimer() {
      clearTimeout(this.timer)
      this.timer = setTimeout(this.handleTimeout, TIMEOUT_DURATION)
    },

    async handleTimeout() {
      if (auth.currentUser) {
        await signOut(auth)
        this.$router.push({ name: 'Login' })
      }
    },

    startActivityTracking() {
      this.throttledResetTimer = this.throttle(this.resetTimer, THROTTLE_DELAY)
      ACTIVITY_EVENTS.forEach(event => window.addEventListener(event, this.resetTimer))
      this.resetTimer()
    },

    stopActivityTracking() {
      if (this.throttledResetTimer) {
        ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, this.resetTimer))
        this.throttledResetTimer = null
      }
      clearTimeout(this.timer)
    },

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

  mounted() {
    this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        this.startActivityTracking()
      } else {
        this.stopActivityTracking()
      }
    })
  },

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
