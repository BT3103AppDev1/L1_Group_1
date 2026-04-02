<template>
  <div class="hbar-container">
    <div v-for="(d, i) in data" :key="i" class="hbar-row">

      <!-- Category Label -->
      <div class="hbar-label">{{ d.category }}</div>

      <!-- Bars -->
      <div class="hbar-track">

        <!-- Personal bar -->
        <div class="hbar-bar-row">
          <template v-if="d.personal !== null && d.personal !== undefined">
            <div class="hbar-bar-wrap">
              <div
                class="hbar-bar"
                :style="{
                  width: (d.personal / maxVal * 100) + '%',
                  background: (d.cpi === null || d.personal > d.cpi) ? '#EF4444' : '#0FA878'
                }"
              ></div>
            </div>
            <span class="hbar-val" :style="{ color: (d.cpi === null || d.personal > d.cpi) ? '#EF4444' : '#0FA878' }">
              {{ d.personal.toFixed(1) }}%
            </span>
          </template>
          <template v-else>
            <div class="hbar-bar-wrap">
              <div class="hbar-bar" style="width:0%"></div>
            </div>
            <span class="hbar-na">N/A</span>
          </template>
        </div>

        <!-- CPI bar -->
        <div class="hbar-bar-row">
          <div class="hbar-bar-wrap">
            <div
              class="hbar-bar hbar-bar-cpi"
              :style="{ width: d.cpi !== null ? (d.cpi / maxVal * 100) + '%' : '0%' }"
            ></div>
          </div>
          <span class="hbar-cpi-val">
            {{ d.cpi !== null ? d.cpi.toFixed(1) + '%' : '—' }}
          </span>
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
      const vals = this.data.flatMap(d => [d.personal ?? 0, d.cpi ?? 0])
      const max = Math.max(...vals)
      return max > 0 ? max : 1
    },
  },
}
</script>

<style scoped>
.hbar-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hbar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hbar-label {
  width: 110px;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  text-align: right;
}

.hbar-track {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hbar-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hbar-bar-wrap {
  flex: 1;
  background: var(--border, #F3F4F6);
  border-radius: 4px;
  height: 10px;
  overflow: hidden;
}

.hbar-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease;
  min-width: 0;
}

.hbar-bar-cpi {
  background: #D1D5DB;
}

.hbar-val {
  width: 42px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.hbar-cpi-val {
  width: 42px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-muted, #9CA3AF);
  text-align: right;
}

.hbar-na {
  width: 42px;
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-muted, #9CA3AF);
  font-style: italic;
  text-align: right;
}
</style>