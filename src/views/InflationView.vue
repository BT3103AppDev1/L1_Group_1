<template>
  <div class="flex-col">

    <!-- Placeholder while data loads -->
    <div v-if="loading || cpiLoading" class="card"
      style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
      Loading inflation data...
    </div>

    <!-- Error message if not enough data for monthly view -->
    <div v-else-if="!hasEnoughData" class="card" style="text-align:center; padding:60px 40px;">
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor"
        stroke-width="1.5" style="margin:0 auto 16px; display:block; color:var(--text-muted); opacity:0.5;">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      <div style="font-size:15px; font-weight:600; margin-bottom:8px;">Not enough data yet</div>
      <div class="text-secondary" style="font-size:13px; max-width:320px; margin:0 auto;">
        Log the same items across at least 2 months to see your personal inflation rate.
      </div>
      <button class="btn-accent-flex" style="margin:20px auto 0;"
        @click="$router.push('/expenses')">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="M12 4v16m8-8H4"/>
        </svg>
        Log Expenses
      </button>
    </div>

    <template v-else>

      <!-- Toggle button automatically disables yearly toggle if insufficient data -->
      <div class="toggle-group">
        <button class="toggle-btn" :class="{ active: period === 'monthly' }"
          @click="period = 'monthly'">
          Month-to-Month
        </button>
        <button
          class="toggle-btn"
          :class="{ active: period === 'yearly' }"
          :disabled="!hasYoYData"
          :style="{
            opacity: hasYoYData ? 1 : 0.4,
            cursor: hasYoYData ? 'pointer' : 'not-allowed'
          }"
          :title="!hasYoYData ? 'Log expenses across 13+ months to unlock Year-to-Year view' : ''"
          @click="hasYoYData && (period = 'yearly')">
          Year-to-Year
        </button>
      </div>

      <!-- Error message if insufficient data for yearly view -->
      <div v-if="!hasYoYData" class="card" style="padding:10px 16px; font-size:12px; color:var(--text-muted); border-left:3px solid var(--border);">
        📅 Year-to-Year view requires 13+ months of expense data.
      </div>

      <!-- Summary cards -->
      <div class="grid-3">
        <!-- Personal inflation rate -->
        <div class="card">
          <div class="fs-12 text-secondary mb-8">Your Personal Inflation</div>
          <div v-if="personalInflation !== null" style="font-family:var(--font-display); font-size:36px; font-weight:700;">
            {{ personalInflation.toFixed(2) }}%
          </div>
          <div v-else style="font-family:var(--font-display); font-size:36px; font-weight:700; color:var(--text-muted);">--</div>
          <div class="text-muted mt-4" style="font-size:11px;">
            {{ period === 'monthly' ? 'Month-on-Month' : 'Year-on-Year' }}
          </div>
        </div>

        <!-- Official CPI data inflation rate -->
        <div class="card">
          <div class="fs-12 text-secondary mb-8">CPI (National Average)</div>
          <div style="font-family:var(--font-display); font-size:36px; font-weight:700;">
            {{ activeCpiData?.overall?.toFixed(2) ?? '--' }}%
          </div>
          <div class="text-muted mt-4" style="font-size:11px;">Source: {{ activeCpiData?.source ?? '—' }}</div>
        </div>

        <!-- Difference between personal and official CPI -->
        <div class="card">
          <div class="fs-12 text-secondary mb-8">Difference from CPI</div>
          <div v-if="diffFromCPI !== null" style="font-family:var(--font-display); font-size:36px; font-weight:700;"
            :style="{ color: diffFromCPI >= 0 ? 'var(--danger)' : 'var(--accent)' }">
            {{ diffFromCPI >= 0 ? '+' : '' }}{{ diffFromCPI.toFixed(2) }}%
          </div>
          <div v-else style="font-family:var(--font-display); font-size:36px; font-weight:700; color:var(--text-muted);">--</div>
        </div>
      </div>

      <!-- Inflation by category chart -->
      <div class="card">
        <div class="fs-15 fw-600 mb-20">
          Inflation by Category ({{ period === 'monthly' ? 'Month-on-Month' : 'Year-on-Year' }})
        </div>
        <HorizontalBarChart :data="categoryChartData" />
      </div>

      <!-- 6-month trend chart -->
      <div class="card">
        <div class="fs-15 fw-600 mb-16">6-Month Trend</div>
        <MiniBarChart :data="trendChartData" :height="150" :bar-width="36" :gap="12" />
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import HorizontalBarChart from '../components/HorizontalBarChart.vue'
import MiniBarChart from '../components/MiniBarChart.vue'
import { useInflation } from '../composables/useInflation'
import { useCPI_MoM } from '../composables/useCPI_MoM'
import { useCPI_YoY } from '../composables/useCPI_YoY'

const CATEGORIES = ['Food', 'Housing', 'Transport', 'Healthcare', 'Education', 'Recreation', 'Clothing', 'Communication']

// controls which inflation set is shown across all cards and charts, 'monthly' or 'yearly'
const period = ref('monthly')

// Fetch all inflation and CPI data using composables
const {
  loading, hasEnoughData, fetchExpenses,
  personalInflationMoM, personalInflationYoY,
  categoryInflationMoM, categoryInflationYoY,
  sixMonthTrend,
} = useInflation()

const { cpiData: momCpiData, cpiLoading: momLoading, fetchCPI: fetchMoM, getCategoryCPI: getMomCategory, getMonthlyRate } = useCPI_MoM()
const { cpiData: yoyCpiData, cpiLoading: yoyLoading, fetchCPI: fetchYoY, getCategoryCPI: getYoyCategory } = useCPI_YoY()

onMounted(() => { 
  fetchExpenses(); 
  fetchMoM(); 
  fetchYoY() 
})

// YoY toggle is disabled until personalInflationYoY returns a non-null value
const hasYoYData = computed(() => personalInflationYoY.value !== null)

// Show loading state while whichever CPI source is active is still fetching
const cpiLoading = computed(() => period.value === 'monthly' ? momLoading.value : yoyLoading.value)

// The active CPI dataset — switches between MoM and YoY based on the toggle
const activeCpiData = computed(() => period.value === 'monthly' ? momCpiData.value : yoyCpiData.value)

// The active per-category CPI getter function that is passed to the chart, switches with the toggle
const getActiveCategoryCPI = computed(() => period.value === 'monthly' ? getMomCategory : getYoyCategory)

// The active per-category personal inflation object, switches with the toggle
const activeCategoryInflation = computed(() => 
  period.value === 'monthly' ? categoryInflationMoM.value : categoryInflationYoY.value
)

// Overall personal inflation for the active period
const personalInflation = computed(() => period.value === 'monthly' ? personalInflationMoM.value : personalInflationYoY.value)

// Difference between personal inflation and the national CPI average
const diffFromCPI = computed(() => (personalInflation.value === null || !activeCpiData.value) ? null : personalInflation.value - activeCpiData.value.overall)

// Data for HorizontalBarChart — one entry per category, sorted by personal rate descending.
// Categories with no personal data are pushed to the bottom.
const categoryChartData = computed(() =>
  CATEGORIES.map(cat => ({
    category: cat,
    personal: activeCategoryInflation.value[cat] != null ? parseFloat(activeCategoryInflation.value[cat].toFixed(1)) : null,
    cpi: getActiveCategoryCPI.value(cat) != null ? parseFloat(getActiveCategoryCPI.value(cat).toFixed(1)) : null,
  }))
  .filter(d => d.personal !== null)
  .sort((a, b) => b.personal - a.personal)
)

// Data for MiniBarChart — the last 6 months of personal MoM inflation.
// The official MoM CPI as a benchmark bar where available.
const trendChartData = computed(() =>
  sixMonthTrend.value.map(d => ({
    month: d.month,
    personal: d.personal,
    // Pass null if no benchmark exists so the ghost bar appears in case no latest data.
    cpi: d.yearMonth ? getMonthlyRate(d.yearMonth) : null,
  }))
)
</script>