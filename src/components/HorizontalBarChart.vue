<template>
  <div>
    <div v-for="(d, i) in data" :key="i" class="hbar-row">
      <div class="hbar-label">{{ d.category }}</div>
      <div class="hbar-track">
        <div style="display:flex; align-items:center; gap:6px;">
          <div
            class="hbar-personal"
            :style="{
              width: (d.personal / maxVal * 100) + '%',
              background: d.personal > d.cpi ? '#EF4444' : '#0FA878'
            }"
          ></div>
          <span class="hbar-val" :style="{ color: d.personal > d.cpi ? '#EF4444' : '#0FA878' }">
            {{ d.personal }}%
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <div class="hbar-cpi" :style="{ width: (d.cpi / maxVal * 100) + '%' }"></div>
          <span class="hbar-cpi-val">{{ d.cpi }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HorizontalBarChart',
  props: {
    data: { type: Array, required: true },
  },
  computed: {
    maxVal() {
      return Math.max(...this.data.map(d => Math.max(d.personal, d.cpi)))
    },
  },
}
</script>

<style scoped>
.hbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.hbar-label {
  width: 110px;
  font-size: 13px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.hbar-track {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hbar-personal {
  height: 10px;
  border-radius: 4px;
  min-width: 2px;
  transition: width 0.3s ease;
}

.hbar-cpi {
  height: 10px;
  border-radius: 4px;
  background: #94a3b8;
  min-width: 2px;
  transition: width 0.3s ease;
}

.hbar-val {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.hbar-cpi-val {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}
</style>