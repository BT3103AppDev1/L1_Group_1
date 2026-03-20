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

export default {
  name: 'App',
  components: { SidebarNav, TopBar },
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
