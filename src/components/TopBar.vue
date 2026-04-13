<!-- src/components/TopBar.vue -->
<template>
  <header class="topbar">
    <div>
      <div class="topbar-title">{{ $route.name || 'Dashboard' }}</div>
      <div class="topbar-date">{{ todayFormatted }}</div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'TopBar',
  data() {
    return { showNotif: false }
  },
  computed: {
    todayFormatted() {
      return new Date().toLocaleDateString('en-SG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    },
  },
}
</script>

<style scoped>
.topbar {
  display: flex; align-items: center;
  padding: 18px 32px; background: var(--card);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 50;
}
.topbar-title { font-size: 20px; font-weight: 600; color: var(--text); }
.topbar-date { font-size: 12px; color: var(--text-muted); }
</style>
