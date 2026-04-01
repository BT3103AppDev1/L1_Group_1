<template>
    <div class="flex-col">
  
      <!-- Loading State -->
      <div v-if="loading || cpiLoading" class="card"
        style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
        Loading inflation data...
      </div>
  
      <!-- Empty State: not enough data -->
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
  
      <!-- Main Content -->
      <template v-else>
  
        <!-- Period Toggle (US16) -->
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ active: period === 'monthly' }"
            @click="period = 'monthly'">Month-to-Month</button>
          <button class="toggle-btn" :class="{ active: period === 'yearly' }"
            @click="period = 'yearly'">Year-to-Year</button>
        </div>
  
        <div class="grid-3">
  
          <!-- Your Personal Inflation -->
          <div class="card">
            <div class="fs-12 text-secondary mb-8">Your Personal Inflation</div>
            <div v-if="personalInflation !== null"
              style="font-family:var(--font-display); font-size:36px; font-weight:700;">
              {{ personalInflation.toFixed(1) }}%
            </div>
            <div v-else
              style="font-family:var(--font-display); font-size:36px; font-weight:700; color:var(--text-muted);">
              --
            </div>
            <div class="text-muted mt-4" style="font-size:11px;">
              {{ period === 'monthly' ? 'Month-on-Month' : 'Year-on-Year' }}
            </div>
            <div v-if="inflationDelta !== null" class="mt-4">
              <div v-if="inflationDelta >= 0" class="badge-up">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 15l7-7 7 7"/>
                </svg>
                +{{ inflationDelta.toFixed(1) }}% from last {{ period === 'monthly' ? 'month' : 'year' }}
              </div>
              <div v-else class="badge-down">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
                {{ inflationDelta.toFixed(1) }}% from last {{ period === 'monthly' ? 'month' : 'year' }}
              </div>
            </div>
          </div>
  
          <!-- CPI National Average -->
          <div class="card">
            <div class="fs-12 text-secondary mb-8">CPI (National Average)</div>
            <div style="font-family:var(--font-display); font-size:36px; font-weight:700;">
              {{ cpiData?.overall?.toFixed(1) }}%
            </div>
            <div class="text-muted mt-4" style="font-size:11px;">
              Source: {{ cpiData?.source }}
            </div>
          </div>
  
          <!-- Difference from CPI -->
          <div class="card">
            <div class="fs-12 text-secondary mb-8">Difference from CPI</div>
            <div v-if="personalInflation !== null && cpiData"
              style="font-family:var(--font-display); font-size:36px; font-weight:700;"
              :style="{ color: diffFromCPI >= 0 ? 'var(--danger)' : 'var(--accent)' }">
              {{ diffFromCPI >= 0 ? '+' : '' }}{{ diffFromCPI.toFixed(1) }}%
            </div>
            <div v-else
              style="font-family:var(--font-display); font-size:36px; font-weight:700; color:var(--text-muted);">
              --
            </div>
            <div class="text-muted mt-4" style="font-size:11px;">
              <span v-if="personalInflation !== null && cpiData">
                {{ diffFromCPI >= 0 ? 'Your costs are rising faster than average' : 'Your costs are rising slower than average' }}
              </span>
            </div>
          </div>
  
        </div>
  
        <!-- Category Breakdown -->
        <div class="card">
          <div class="flex-between mb-20">
            <div>
              <div class="fs-15 fw-600">Inflation by Category</div>
              <div class="fs-12 text-secondary mt-4">
                Sorted highest to lowest ·
                <span class="text-danger">Red</span> = above CPI,
                <span class="text-accent">Green</span> = at/below CPI
              </div>
            </div>
            <div class="legend">
              <span style="display:flex; align-items:center; gap:4px;">
                <span class="legend-dot" style="background:var(--accent); width:10px; height:10px;"></span>
                Personal
              </span>
              <span style="display:flex; align-items:center; gap:4px;">
                <span class="legend-dot" style="background:#D1D5DB; width:10px; height:10px;"></span>
                CPI Category
              </span>
            </div>
          </div>
          <HorizontalBarChart :data="categoryChartData" />
        </div>
  
        <!-- 6-Month Trend -->
        <div class="card">
          <div class="fs-15 fw-600 mb-16">6-Month Trend</div>
          <MiniBarChart :data="trendChartData" :height="150" :bar-width="36" :gap="12" />
        </div>
  
      </template>
    </div>
  </template>
  
  <script>
  import HorizontalBarChart from '../components/HorizontalBarChart.vue'
  import MiniBarChart from '../components/MiniBarChart.vue'
  import { useInflation } from '../composables/useInflation'
  import { useCPI } from '../composables/useCPI'
  
  const CATEGORIES = [
    'Food', 'Housing', 'Transport', 'Healthcare',
    'Education', 'Recreation', 'Clothing', 'Communication'
  ]
  
  export default {
    name: 'InflationView',
    components: { HorizontalBarChart, MiniBarChart },
  
    data() {
      return {
        period: 'monthly',
        loading: true,
        cpiLoading: true,
        hasEnoughData: false,
        personalInflationMoM: null,
        personalInflationYoY: null,
        categoryInflation: {},
        sixMonthTrend: [],
        cpiData: null,
        getCategoryCPI: null,
      }
    },
  
    computed: {
      personalInflation() {
        return this.period === 'monthly'
          ? this.personalInflationMoM
          : this.personalInflationYoY
      },
  
      inflationDelta() {
        if (this.personalInflationMoM === null || this.personalInflationYoY === null) return null
        return this.period === 'monthly'
          ? this.personalInflationMoM - this.personalInflationYoY
          : null
      },
  
      diffFromCPI() {
        if (this.personalInflation === null || !this.cpiData) return null
        return this.personalInflation - this.cpiData.overall
      },
  
      categoryChartData() {
        return CATEGORIES
          .map(cat => ({
            category: cat,
            personal: this.categoryInflation[cat] !== null && this.categoryInflation[cat] !== undefined
              ? parseFloat(this.categoryInflation[cat].toFixed(1))
              : null,
            cpi: this.getCategoryCPI ? this.getCategoryCPI(cat) : null,
          }))
          .sort((a, b) => {
            if (a.personal === null) return 1
            if (b.personal === null) return -1
            return b.personal - a.personal
          })
      },
  
      trendChartData() {
        return this.sixMonthTrend.map(d => ({
          month: d.month,
          personal: d.personal,
          cpi: this.cpiData?.overall ?? 0,
        }))
      },
    },
  
    async mounted() {
      await this.initData()
    },
  
    methods: {
      async initData() {
        const inflation = useInflation()
        const cpi = useCPI()
  
        await Promise.all([
          inflation.fetchExpenses(),
          cpi.fetchCPI()
        ])
  
        this.loading = false
        this.cpiLoading = false
        this.hasEnoughData = inflation.hasEnoughData.value
        this.personalInflationMoM = inflation.personalInflationMoM.value
        this.personalInflationYoY = inflation.personalInflationYoY.value
        this.categoryInflation = inflation.categoryInflation.value
        this.sixMonthTrend = inflation.sixMonthTrend.value
        this.cpiData = cpi.cpiData.value
        this.getCategoryCPI = cpi.getCategoryCPI
      }
    }
  }
  </script>