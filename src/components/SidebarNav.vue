<!-- src/components/SidebarNav.vue -->
<template>
  <aside class="sidebar">
    <ConfirmModal
      v-model="showLogoutModal"
      variant="logout"
      title="Log Out"
      message="Are you sure you want to log out of Purchasing Power Pro?"
      confirmLabel="Log Out"
      cancelLabel="Stay"
      :loading="loggingOut"
      @confirm="confirmLogout"
      @cancel="showLogoutModal = false"
    />
    <div class="sidebar-logo">P3</div>
    <div class="sidebar-subtitle">Purchasing Power Pro</div>

    <nav>
      <router-link to="/expenses" class="nav-btn" active-class="active">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        Expenses
      </router-link>

      <router-link to="/inflation" class="nav-btn" active-class="active">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        My Inflation
      </router-link>

      <router-link to="/compare" class="nav-btn" active-class="active">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        CPI Comparison
      </router-link>

      <router-link to="/wages" class="nav-btn" active-class="active">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
        </svg>
        Wage Tracker
      </router-link>
    </nav>

    <div class="sidebar-spacer"></div>

    <button class="nav-btn logout-btn" @click="showLogoutModal = true">
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Logout
    </button>
  </aside>
</template>

<script>
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import ConfirmModal from './ConfirmModal.vue'

export default {
  name: 'SidebarNav',
  components: { ConfirmModal },
  data() {
    return {
      showLogoutModal: false,
      loggingOut: false,
    }
  },
  methods: {
    async confirmLogout() {
      this.loggingOut = true
      try {
        await signOut(auth)
        this.$router.push('/login')
      } catch (err) {
        console.error('Logout failed:', err)
      } finally {
        this.loggingOut = false
        this.showLogoutModal = false
      }
    },
  },
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: var(--sidebar);
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  z-index: 100;
  padding: 28px 16px 20px;
}
.sidebar-logo {
  font-family: var(--font-display);
  font-size: 22px; font-weight: 700;
  color: var(--accent);
  padding: 0 12px; margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.sidebar-subtitle {
  font-size: 10px; color: var(--text-muted);
  padding: 0 12px; margin-bottom: 32px;
  letter-spacing: 1.5px; text-transform: uppercase;
}
nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sidebar-spacer {
  flex: 1;
}
.nav-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px; border-radius: 10px; border: none;
  background: transparent; color: #9CA3AF;
  font-size: 14px; font-weight: 400;
  font-family: var(--font-body); cursor: pointer;
  transition: all 0.2s;
  width: 100%; text-align: left;
  text-decoration: none;
}
.nav-btn:hover {
  background: var(--sidebar-hover);
}
.nav-btn.active {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}
.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
}
</style>