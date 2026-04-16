<template>
  <div class="flex-col">

    <!-- ── Header + Period Toggle ── -->
    <div class="flex-between">
      <div>
        <h1 style="margin:0; font-size:22px;">Welcome to your Dashboard!</h1>
        <div class="fs-12 text-secondary">Your financial health at a glance</div>
      </div>
      <div class="toggle-group">
        <button :class="['toggle-btn', period === 'mom' ? 'toggle-active' : '']" @click="period = 'mom'">Month-on-Month</button>
        <button :class="['toggle-btn', period === 'yoy' ? 'toggle-active' : '']" @click="period = 'yoy'">Year-on-Year</button>
      </div>
    </div>

    <!-- ── Hero: Personal Inflation Rate (large % + trend arrow) ── -->
    <div class="card hero-card">
      <div class="hero-label">Your Personal Inflation Rate</div>
      <div v-if="inflationLoading" class="hero-empty">Loading your data…</div>
      <div v-else-if="personalRate === null" class="hero-empty">
        Insufficient Data — log expenses across at least 2 months to see your inflation rate.
      </div>
      <div v-else class="hero-row">
        <span class="hero-value" :style="{ color: personalRate >= 0 ? '#dc2626' : '#16a34a' }">
          {{ personalRate >= 0 ? '+' : '' }}{{ personalRate.toFixed(2) }}%
        </span>
        <!-- Trend arrow: compares current MoM to prior MoM -->
        <span v-if="trendDirection !== 'flat'" class="hero-trend" :class="trendDirection === 'up' ? 'trend-up' : 'trend-down'">
          <svg v-if="trendDirection === 'up'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l10-10M17 17V7H7"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 7L7 17M7 7v10h10"/></svg>
          <span>{{ trendDirection === 'up' ? 'Rising' : 'Falling' }} vs prior period</span>
        </span>
        <span class="hero-sub">{{ period === 'mom' ? 'vs last month' : 'vs 12 months ago' }}</span>
      </div>
    </div>

    <!-- ── Middle Row: CPI Comparison · Wage Growth · Purchasing Power ── -->
    <div class="summary-grid">

      <!-- (2) CPI Comparison -->
      <div class="card summary-card">
        <div class="summary-card-header">
          <span class="summary-label">vs SG National CPI</span>
          <span class="summary-badge">{{ period === 'mom' ? 'MoM' : 'YoY' }}</span>
        </div>
        <div v-if="cpiLoading" class="summary-empty">Loading CPI…</div>
        <div v-else-if="cpiOverall === null || personalRate === null" class="summary-empty">Awaiting data.</div>
        <div v-else>
          <div class="summary-value-row">
            <span class="summary-value" :style="{ color: cpiDiff > 0 ? '#dc2626' : '#16a34a' }">
              {{ cpiDiff > 0 ? '+' : '' }}{{ cpiDiff.toFixed(2) }}%
            </span>
            <span class="summary-sub">{{ cpiDiff > 0 ? 'above' : 'below' }} CPI</span>
          </div>
          <div class="cpi-split">
            <span>You: <b>{{ personalRate.toFixed(2) }}%</b></span>
            <span>CPI: <b>{{ cpiOverall.toFixed(2) }}%</b></span>
          </div>
        </div>
      </div>

      <!-- (3) Wage Growth -->
      <div class="card summary-card">
        <div class="summary-card-header">
          <span class="summary-label">Wage Growth</span>
          <span class="summary-badge">Monthly</span>
        </div>
        <div v-if="wageGrowth === null" class="summary-empty">Log at least 2 wages.</div>
        <div v-else class="summary-value-row">
          <span class="summary-value" :style="{ color: wageGrowth >= 0 ? '#16a34a' : '#dc2626' }">
            {{ wageGrowth >= 0 ? '+' : '' }}{{ wageGrowth.toFixed(2) }}%
          </span>
          <span class="summary-sub">vs last month</span>
        </div>
      </div>

      <!-- (4) Purchasing Power Indicator -->
      <div class="card summary-card">
        <div class="summary-card-header">
          <span class="summary-label">Purchasing Power</span>
        </div>
        <div v-if="purchasingPowerStatus === 'no-wage'" class="summary-empty">No wage entry provided.</div>
        <div v-else-if="purchasingPowerStatus === 'awaiting'" class="summary-empty">Awaiting data.</div>
        <div v-else class="summary-value-row">
          <span class="summary-value" :style="{ fontSize: '18px', color: purchasingPowerStatus === 'healthy' ? '#16a34a' : '#dc2626' }">
            {{ purchasingPowerStatus === 'healthy' ? '✅ Healthy' : '⚠️ Declining' }}
          </span>
          <span class="summary-sub">
            {{ realGrowth >= 0 ? '+' : '' }}{{ realGrowth.toFixed(2) }}% real
          </span>
        </div>
      </div>

    </div>

    <!-- ── (5) Top 3 Inflation Drivers ── -->
    <div class="card">
      <div class="flex-between" style="margin-bottom:14px;">
        <div>
          <div class="summary-label">Top Inflation Drivers</div>
          <div class="fs-12 text-secondary">Categories pushing your personal inflation up the most</div>
        </div>
      </div>

      <div v-if="topDrivers.length === 0" class="summary-empty">
        No categories are currently driving your inflation up. Add more expenses to see drivers.
      </div>
      <div v-else class="drivers-grid">
        <div v-for="(d, i) in topDrivers" :key="d.category" class="driver-card">
          <div class="driver-rank">#{{ i + 1 }}</div>
          <div class="driver-name">{{ d.category }}</div>
          <div class="driver-rates">
            <div class="driver-rate-row">
              <span class="driver-rate-label">You</span>
              <span class="driver-rate-val" :style="{ color: d.personal >= 0 ? '#dc2626' : '#16a34a' }">
                {{ d.personal >= 0 ? '+' : '' }}{{ d.personal.toFixed(2) }}%
              </span>
            </div>
            <div class="driver-rate-row">
              <span class="driver-rate-label">CPI</span>
              <span class="driver-rate-val" :style="{ color: 'var(--text-muted, #64748b)' }">
                {{ d.cpi !== null ? (d.cpi >= 0 ? '+' : '') + d.cpi.toFixed(2) + '%' : 'N/A' }}
              </span>
            </div>
          </div>
          <div class="driver-diff" v-if="d.cpi !== null">
            <span :style="{ color: d.personal > d.cpi ? '#dc2626' : '#16a34a', fontWeight: 600 }">
              {{ d.personal > d.cpi ? '▲' : '▼' }} {{ Math.abs(d.personal - d.cpi).toFixed(2) }}%
            </span>
            <span class="fs-12 text-secondary">{{ d.personal > d.cpi ? 'above' : 'below' }} national</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { db, auth } from '../firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { useInflation } from '../composables/useInflation'
import { useCPI_MoM } from '../composables/useCPI_MoM'
import { useCPI_YoY } from '../composables/useCPI_YoY'

// SingStat CPI category weightings (2024 Base Year) — used to rank drivers
// by their contribution to weighted personal inflation.
const CATEGORY_WEIGHTS = {
  Food: 0.21, Housing: 0.25, Transport: 0.17, Healthcare: 0.07,
  Education: 0.07, Recreation: 0.08, Clothing: 0.02, Communication: 0.04,
}

export default {
  name: 'DashboardView',

  setup() {
    const inflation = useInflation()
    const mom = useCPI_MoM()
    const yoy = useCPI_YoY()
    return { inflation, mom, yoy }
  },

  data() {
    return {
      period: 'mom', // 'mom' | 'yoy'
      wages: [],
      wagesUnsub: null,
    }
  },

  computed: {
    inflationLoading() { return this.inflation.loading.value },
    cpiLoading() { return this.period === 'mom' ? this.mom.cpiLoading.value : this.yoy.cpiLoading.value },

    // Current personal inflation rate for the active period
    personalRate() {
      const v = this.period === 'mom'
        ? this.inflation.personalInflationMoM.value
        : this.inflation.personalInflationYoY.value
      return v === null || v === undefined ? null : v
    },

    // Per-category inflation map for the active period
    categoryRates() {
      return this.period === 'mom'
        ? this.inflation.categoryInflationMoM.value
        : this.inflation.categoryInflationYoY.value
    },

    // Trend arrow: compare latest MoM to the prior month's MoM from sixMonthTrend
    trendDirection() {
      const trend = this.inflation.sixMonthTrend.value
      if (!trend || trend.length < 2) return 'flat'
      const latest = trend[trend.length - 1].personal
      const prior = trend[trend.length - 2].personal
      if (latest > prior) return 'up'
      if (latest < prior) return 'down'
      return 'flat'
    },

    // CPI overall rate (from useCPI — already averaged for the selected year)
    cpiOverall() {
      const data = this.period === 'mom' ? this.mom.cpiData.value : this.yoy.cpiData.value
      return data?.overall ?? null
    },

    cpiDiff() {
      if (this.personalRate === null || this.cpiOverall === null) return 0
      return this.personalRate - this.cpiOverall
    },

    // Wage growth (monthly) — mirrors WageTrackerView logic
    wageGrowth() {
      if (this.wages.length < 2) return null
      const latest = this.wages[0]
      const previous = this.wages[1]
      return ((latest.amount - previous.amount) / previous.amount) * 100
    },

    // ── UPDATED: real growth now uses personal inflation instead of national CPI ──
    realGrowth() {
      if (this.wageGrowth === null || this.personalRate === null) return 0
      return this.wageGrowth - this.personalRate
    },

    // ── UPDATED: purchasing power status now depends on personalRate ──
    purchasingPowerStatus() {
      if (this.wages.length === 0) return 'no-wage'
      if (this.wageGrowth === null || this.personalRate === null) return 'awaiting'
      return this.realGrowth >= 0 ? 'healthy' : 'declining'
    },

    // Top 3 inflation drivers — ranked by contribution to weighted inflation
    // (personal category rate × CPI weight). Only positive contributors (rising).
    topDrivers() {
      const rates = this.categoryRates || {}
      const getCpi = this.period === 'mom' ? this.mom.getCategoryCPI : this.yoy.getCategoryCPI
      const drivers = []
      for (const [cat, rate] of Object.entries(rates)) {
        if (rate === null || rate === undefined) continue
        if (rate <= 0) continue // only categories pushing inflation up
        const weight = CATEGORY_WEIGHTS[cat] ?? 0
        drivers.push({
          category: cat,
          personal: rate,
          cpi: getCpi(cat),
          contribution: rate * weight,
        })
      }
      drivers.sort((a, b) => b.contribution - a.contribution)
      return drivers.slice(0, 3)
    },
  },

  async mounted() {
    await this.inflation.fetchExpenses()
    this.mom.fetchCPI()
    this.yoy.fetchCPI()
    this.listenToWages()
  },

  beforeUnmount() {
    if (this.wagesUnsub) this.wagesUnsub()
  },

  methods: {
    listenToWages() {
      if (!auth.currentUser) return
      const uid = auth.currentUser.uid
      const wagesRef = collection(db, 'users', uid, 'wages')
      const q = query(wagesRef, orderBy('effectiveDate', 'desc'))
      this.wagesUnsub = onSnapshot(q, (snap) => {
        this.wages = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      }, (err) => console.error('Dashboard wages listener:', err))
    },
  },
}
</script>

<style scoped>
.hero-card { padding: 24px 28px; }
.hero-label { font-size: 12px; font-weight: 600; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; }
.hero-row { display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap; }
.hero-value { font-size: 56px; font-weight: 700; line-height: 1; font-family: 'Fraunces', serif; }
.hero-trend { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 99px; }
.trend-up { background: #fee2e2; color: #dc2626; }
.trend-down { background: #dcfce7; color: #16a34a; }
.hero-sub { font-size: 13px; color: var(--text-muted, #94a3b8); }
.hero-empty { font-size: 14px; color: var(--text-muted, #94a3b8); padding: 16px 0; }

.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 900px) { .summary-grid { grid-template-columns: 1fr; } }
.summary-card { display: flex; flex-direction: column; gap: 12px; }
.summary-card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.summary-label { font-size: 12px; font-weight: 600; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.04em; }
.summary-value-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.summary-value { font-size: 26px; font-weight: 700; line-height: 1; }
.summary-sub { font-size: 12px; color: var(--text-muted, #94a3b8); }
.summary-empty { font-size: 12px; color: var(--text-muted, #94a3b8); padding: 8px 0; }
.summary-badge { font-size: 11px; font-weight: 600; background: var(--surface-2, #f1f5f9); color: var(--text-muted, #64748b); border-radius: 99px; padding: 2px 10px; }
.cpi-split { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; color: var(--text-muted, #64748b); }

.toggle-group { display: flex; background: var(--surface-2, #f1f5f9); border-radius: 8px; padding: 3px; gap: 2px; }
.toggle-btn { font-size: 12px; font-weight: 600; padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: var(--text-muted, #94a3b8); transition: background 0.15s, color 0.15s; }
.toggle-active { background: var(--accent, #0FA878); color: #fff; }

.drivers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 900px) { .drivers-grid { grid-template-columns: 1fr; } }
.driver-card { position: relative; border: 1px solid var(--border, #e2e8f0); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: var(--surface-2, #f8fafc); }
.driver-rank { position: absolute; top: 10px; right: 12px; font-size: 11px; font-weight: 700; color: var(--text-muted, #94a3b8); }
.driver-name { font-size: 15px; font-weight: 700; }
.driver-rates { display: flex; flex-direction: column; gap: 4px; }
.driver-rate-row { display: flex; justify-content: space-between; font-size: 13px; }
.driver-rate-label { color: var(--text-muted, #64748b); }
.driver-rate-val { font-weight: 700; }
.driver-diff { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed var(--border, #e2e8f0); font-size: 12px; }
</style>