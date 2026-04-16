<template>
  <div class="hbar-container">

    <!-- Legend -->
    <div class="hbar-legend">
      <div class="hbar-legend-item">
        <span class="hbar-legend-dot hbar-legend-personal-green"></span>
        <span>Your Inflation (below CPI)</span>
      </div>
      <div class="hbar-legend-item">
        <span class="hbar-legend-dot hbar-legend-personal-red"></span>
        <span>Your Inflation (above CPI)</span>
      </div>
      <div class="hbar-legend-item">
        <span class="hbar-legend-dot hbar-legend-cpi"></span>
        <span>National CPI</span>
      </div>
    </div>

    <div v-for="(d, i) in data" :key="i" class="hbar-row">

      <!-- Category Label -->
      <div class="hbar-label">{{ d.category }}</div>

      <!-- Bars -->
      <div class="hbar-track">

        <!-- Personal bar -->
        <div class="hbar-bar-row">
          <div class="hbar-bar-label">You</div>
          <template v-if="d.personal !== null && d.personal !== undefined">
            <div class="hbar-bar-wrap">
              <div class="hbar-bar-inner" :style="barStyle(d.personal, d)"></div>
            </div>
            <span class="hbar-val" :style="{ color: valColor(d) }">
              {{ d.personal.toFixed(1) }}%
            </span>
          </template>
          <template v-else>
            <div class="hbar-bar-wrap"><div class="hbar-bar-inner"></div></div>
            <span class="hbar-na">N/A</span>
          </template>
        </div>

        <!-- CPI bar -->
        <div class="hbar-bar-row">
          <div class="hbar-bar-label">CPI</div>
          <div class="hbar-bar-wrap">
            <div class="hbar-bar-inner hbar-bar-cpi" :style="barStyle(d.cpi, null)"></div>
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
    // Largest absolute value across all personal and CPI values.
    // Used to scale bar widths so the largest bar fills the available track width.
    maxAbsVal() {
      const vals = this.data.flatMap(d => [
        Math.abs(d.personal ?? 0),
        Math.abs(d.cpi ?? 0),
      ])
      const max = Math.max(...vals)
      return max > 0 ? max : 1
    },

    // True if any value in the dataset is negative.
    // Switches the chart from simple left-aligned bars to a diverging (centre-axis) layout.
    hasNegative() {
      return this.data.some(
        d => (d.personal != null && d.personal < 0) || (d.cpi != null && d.cpi < 0)
      )
    },
  },
  methods: {
    // Returns the inline style for a bar element.
    // In non-diverging mode: bars grow from the left edge (0%) up to 100%.
    // In diverging mode: the centre axis sits at 50%, positive bars extend right, negative bars extend left from the centre.
    barStyle(value, d) {
      if (value === null || value === undefined) return { width: '0%' }

      const pct = (Math.abs(value) / this.maxAbsVal) * 50

      if (!this.hasNegative) {
        const fullPct = (Math.abs(value) / this.maxAbsVal) * 100
        const bg = d ? this.barColor(d) : undefined
        return {
          width: fullPct + '%',
          left: '0%',
          ...(bg ? { background: bg } : {}),
        }
      }

      const bg = d ? this.barColor(d) : undefined
      if (value >= 0) {
        return {
          width: pct + '%',
          left: '50%',
          ...(bg ? { background: bg } : {}),
        }
      } else {
        return {
          width: pct + '%',
          left: (50 - pct) + '%',
          ...(bg ? { background: bg } : {}),
        }
      }
    },

    // Red bar if personal inflation exceeds the CPI benchmark, green otherwise
    barColor(d) {
      if (d.cpi === null || d.cpi === undefined || d.personal > d.cpi) return '#EF4444'
      return '#0FA878'
    },

    // Same logic as barColor — applied to the numeric label beside each bar
    valColor(d) {
      if (d.cpi === null || d.cpi === undefined || d.personal > d.cpi) return '#EF4444'
      return '#0FA878'
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

/* ── Legend ── */
.hbar-legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border, #F3F4F6);
  margin-bottom: 4px;
}

.hbar-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted, #6B7280);
}

.hbar-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.hbar-legend-personal-green { background: #0FA878; }
.hbar-legend-personal-red   { background: #EF4444; }
.hbar-legend-cpi            { background: #D1D5DB; }

/* ── Row layout ── */
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

/* Small "You" / "CPI" inline label */
.hbar-bar-label {
  width: 26px;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted, #9CA3AF);
  text-align: right;
}

.hbar-bar-wrap {
  flex: 1;
  background: var(--border, #F3F4F6);
  border-radius: 4px;
  height: 10px;
  position: relative;
  overflow: hidden;
}

.hbar-bar-inner {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 4px;
  transition: width 0.4s ease, left 0.4s ease;
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