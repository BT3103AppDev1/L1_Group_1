<!-- src/components/SidebarNav.vue -->
<template>
  <aside class="sidebar">
    <div class="sidebar-logo">P3</div>
    <div class="sidebar-subtitle">Purchasing Power Pro</div>

    <div class="sidebar-spacer"></div>

    <button class="nav-btn logout-btn" @click="logout">
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

export default {
  name: 'SidebarNav',
  methods: {
    async logout() {
      try {
        await signOut(auth)
        this.$router.push('/login')
      } catch (err) {
        console.error('Logout failed:', err)
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
}
.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #EF4444;
}
</style>