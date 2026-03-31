<template>
  <div class="flex-col">

    <!-- Header -->
    <div class="flex-between">
      <div class="fs-12 text-secondary">
        Your personal inflation vs official CPI by category
      </div>
    </div>

    <!-- CPI unavailable note -->
    <div v-if="cpiError" class="card" style="font-size:13px; color:var(--text-muted); text-align:center; padding:12px;">
      CPI data temporarily unavailable. Showing personal inflation rate only.
    </div>

    <!-- Summary Cards -->
    <div class="grid-3">
      <div class="card" style="text-align:center;">
        <div class="fs-12 text-secondary mb-8">Your Personal Inflation</div>
        <div class="fs-24 fw-600" :style="{ color: personalRate > cpiOverall ? '#EF4444' : '#0FA878' }">
          {{ personalRate !== null ? personalRate.toFixed(2) + '%' : 'N/A' }}
        </div>
        <div class="fs-12 text-secondary" style="margin-top:4px;">based on your expenses</div>
      </div>

      <div class="card" style="text-align:center;">
        <div class="fs-12 text-secondary mb-8">Official CPI</div>
        <div v-if="cpiError" style="font-size:13px; color:var(--text-muted);">
          Unavailable
        </div>
        <template v-else>
          <div class="fs-24 fw-600" style="color:var(--accent);">
            {{ cpiOverall.toFixed(2) }}%
          </div>
          <!-- AC2: source and period clearly visible -->
          <div class="fs-12 text-secondary" style="margin-top:4px;">
            {{ cpiSource }} · {{ cpiPeriod }}
          </div>
        </template>
      </div>

      <div class="card" style="text-align:center;">
        <div class="fs-12 text-secondary mb-8">Difference</div>
        <div class="fs-24 fw-600" :style="{ color: difference > 0 ? '#EF4444' : '#0FA878' }">
          {{ difference !== null ? (difference > 0 ? '+' : '') + difference.toFixed(2) + '%' : 'N/A' }}
        </div>
        <div class="fs-12 text-secondary" style="margin-top:4px;">
          {{ difference > 0 ? 'above national average' : difference < 0 ? 'below national average' : 'at national average' }}
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="card">
      <div class="fs-15 fw-600 mb-8">Breakdown by category</div>

      <!-- Legend -->
      <div style="display:flex; gap:16px; margin-bottom:16px; font-size:12px; color:var(--text-secondary);">
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="width:10px; height:10px; border-radius:2px; background:#EF4444; display:inline-block;"></span>
          Above CPI
        </span>
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="width:10px; height:10px; border-radius:2px; background:#0FA878; display:inline-block;"></span>
          Below CPI
        </span>
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="width:10px; height:10px; border-radius:2px; background:#94a3b8; display:inline-block;"></span>
          Official CPI
        </span>
      </div>

      <HorizontalBarChart v-if="chartData.length" :data="chartData" />
      <div v-else style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
        No expense data yet. Log expenses to see your comparison.
      </div>

      <div v-if="!cpiError" class="fs-12 text-secondary" style="margin-top:16px;">
        Source: {{ cpiSource }} · Reference period: {{ cpiPeriod }}
      </div>
    </div>

  </div>
</template>

<script>
import { useCPI } from '@/composables/useCPI.js'
import HorizontalBarChart from '@/components/HorizontalBarChart.vue'

const CATEGORIES = [
  'Food', 'Housing', 'Transport', 'Healthcare',
  'Education', 'Recreation', 'Clothing', 'Communication'
]

export default {
  name: 'CpiCompareView',
  components: { HorizontalBarChart },

  data() {
  return {
    // Personal inflation rate and breakdown by category (hardcoded for demo) to be taken from US-15
    personalRate: 3.5,
    personalByCategory: {
      Food:          4.2,
      Housing:       1.5,
      Transport:     3.8,
      Healthcare:    5.1,
      Education:     2.0,
      Recreation:    1.8,
      Clothing:      0.5,
      Communication: 0.2
    }
  }
},

  setup() {
    const { cpiOverall, cpiByCategory, cpiSource, cpiPeriod, cpiError } = useCPI()
    return { cpiOverall, cpiByCategory, cpiSource, cpiPeriod, cpiError }
  },

  computed: {
    difference() {
      if (this.personalRate === null) return null
      return parseFloat((this.personalRate - this.cpiOverall).toFixed(2))
    },
    
    chartData() {
        const cpiCats = this.cpiByCategory?.value ?? this.cpiByCategory ?? {}
        return CATEGORIES.map(cat => ({
            category: cat,
            personal: this.personalByCategory[cat] ?? 0,
            cpi: cpiCats[cat] ?? this.cpiOverall
        }))
    }
  }
}
</script>