<template>
  <div class="flex-col">

    <div class="flex-between">
      <div class="fs-12 text-secondary">
        Your personal inflation vs official CPI ({{ comparisonLabel }}) by category
      </div>
    </div>

    <!-- Loading -->
    <div v-if="cpiLoading || momCpiLoading || inflationLoading" class="card"
      style="text-align:center; padding:20px; font-size:13px; color:var(--text-muted);">
      {{ inflationLoading ? 'Loading your expense data...' : 'Fetching latest CPI data from SingStat...' }}
    </div>

    <!-- CPI unavailable note (AC3) -->
    <div v-if="cpiError && momCpiError" class="card"
      style="font-size:13px; color:var(--text-muted); text-align:center; padding:12px;">
      CPI data temporarily unavailable. Showing personal inflation rate only.
    </div>

    <!-- Not enough data -->
    <div v-if="!inflationLoading && !hasEnoughData" class="card"
      style="text-align:center; padding:40px; font-size:13px; color:var(--text-muted);">
      Log expenses across at least 2 months to see your personal inflation rate.
    </div>

    <template v-if="!cpiLoading && !momCpiLoading && !inflationLoading && hasEnoughData">

      <!-- Period Selector -->
      <div class="card" style="padding:16px 20px;">
        <div class="fs-12 text-secondary mb-8">Compare period</div>
        <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">

          <!-- Mode toggle -->
          <div style="display:flex; gap:6px;">
            <button
              class="btn-sm"
              :style="{ opacity: selectedMode === 'month' ? 1 : 0.4 }"
              @click="selectedMode = 'month'"
            >
              Month
            </button>
            <button
              class="btn-sm"
              :style="{ opacity: selectedMode === 'year' ? 1 : 0.4 }"
              @click="selectedMode = 'year'"
            >
              Year
            </button>
          </div>

          <!-- Year selector -->
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="fs-12 text-secondary">Year:</label>
            <select v-model="selectedYear" style="padding:4px 8px; font-size:13px;">
              <option v-for="y in availableExpenseYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>

          <!-- Month selector — only in month mode -->
          <div v-if="selectedMode === 'month'" style="display:flex; align-items:center; gap:8px;">
            <label class="fs-12 text-secondary">Month:</label>
            <select v-model="selectedMonth" style="padding:4px 8px; font-size:13px;">
              <option v-for="m in availableExpenseMonths" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
          </div>

        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid-3">
        <div class="card" style="text-align:center;">
          <div class="fs-12 text-secondary mb-8">Your Personal Inflation</div>
          <div class="fs-24 fw-600"
            :style="{ color: personalRate != null && activeCpi && personalRate > activeCpi.overall ? '#EF4444' : '#0FA878' }">
            {{ personalRate !== null ? personalRate.toFixed(2) + '%' : 'N/A' }}
          </div>
          <div class="fs-12 text-secondary" style="margin-top:4px;">{{ comparisonLabel }}</div>
        </div>

        <div class="card" style="text-align:center;">
          <div class="fs-12 text-secondary mb-8">Official CPI</div>
          <div v-if="!activeCpi" style="font-size:13px; color:var(--text-muted);">Unavailable</div>
          <template v-else>
            <div class="fs-24 fw-600" style="color:var(--accent);">
              {{ activeCpi.overall.toFixed(2) }}%
            </div>
            <div class="fs-12 text-secondary" style="margin-top:4px;">
              {{ activeCpi.source }}
            </div>
          </template>
        </div>

        <div class="card" style="text-align:center;">
          <div class="fs-12 text-secondary mb-8">Difference</div>
          <div class="fs-24 fw-600"
            :style="{ color: difference > 0 ? '#EF4444' : '#0FA878' }">
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
          No expense data found for this period.
        </div>

        <div v-if="activeCpi" class="fs-12 text-secondary" style="margin-top:16px;">
          Source: {{ activeCpi.source }} · Reference period: {{ activeCpi.period }}
        </div>
      </div>

    </template>
  </div>
</template>

<script>
import { useCPI_YoY } from '@/composables/useCPI_YoY.js'
import { useCPI_MoM } from '@/composables/useCPI_MoM.js'
import { useInflation } from '@/composables/useInflation.js'
import HorizontalBarChart from '@/components/HorizontalBarChart.vue'

const CATEGORIES = [
  'Food', 'Housing', 'Transport', 'Healthcare',
  'Education', 'Recreation', 'Clothing', 'Communication'
]

const MONTH_LABELS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const WEIGHTS = {
  Food: 0.21, Housing: 0.25, Transport: 0.17,
  Healthcare: 0.07, Education: 0.07,
  Recreation: 0.08, Clothing: 0.02, Communication: 0.04
}

export default {
  name: 'CpiCompareView',
  components: { HorizontalBarChart },

  setup() {
    const { cpiData, cpiLoading, cpiError, fetchCPI } = useCPI_YoY()

    const {
      cpiData: momCpiData,
      cpiLoading: momCpiLoading,
      cpiError: momCpiError,
      fetchCPI: fetchCPIMoM,
      getMonthlyRate,
      getMonthlyCategories,
    } = useCPI_MoM()

    const {
      loading: inflationLoading,
      hasEnoughData,
      fetchExpenses,
      expenses,
    } = useInflation()

    fetchCPI()
    fetchCPIMoM()
    fetchExpenses()

    return {
      cpiData, cpiLoading, cpiError,
      momCpiData, momCpiLoading, momCpiError,
      inflationLoading, hasEnoughData,
      expenses,
      getMonthlyRate,
      getMonthlyCategories,
    }
  },

  data() {
    return {
      selectedMode: 'month',
      selectedYear: null,
      selectedMonth: null,
    }
  },

  computed: {
    // ─── Available years from user expenses ───────────────────
    availableExpenseYears() {
      if (!this.expenses?.length) return []
      const years = new Set(this.expenses.map(e => e.date.slice(0, 4)))
      return [...years].sort((a, b) => b - a)
    },

    // ─── Available months in selected year ────────────────────
    availableExpenseMonths() {
      if (!this.expenses?.length || !this.selectedYear) return []
      const months = new Set(
        this.expenses
          .filter(e => e.date.startsWith(this.selectedYear))
          .map(e => e.date.slice(5, 7))
      )
      return MONTH_LABELS.filter(m => months.has(m.value))
    },

    // ─── Selected period string ───────────────────────────────
    selectedPeriod() {
      if (!this.selectedYear) return null
      if (this.selectedMode === 'year') return this.selectedYear
      if (!this.selectedMonth) return null
      return `${this.selectedYear}-${this.selectedMonth}`
    },

    // ─── Personal inflation for selected period ───────────────
    personalRate() {
      if (!this.expenses?.length || !this.selectedPeriod) return null
      const byMonth = this.groupExpensesByMonth()

      if (this.selectedMode === 'year') {
        const currentKey = Object.keys(byMonth)
          .filter(ym => ym.startsWith(this.selectedYear))
          .sort().at(-1)
        const prevYear = String(parseInt(this.selectedYear) - 1)
        const prevKey = Object.keys(byMonth)
          .filter(ym => ym.startsWith(prevYear))
          .sort().at(-1)
        if (!currentKey || !prevKey) return null
        return this.calcWeightedInflation(
          this.calcCategoryRates(byMonth[prevKey], byMonth[currentKey])
        )
      } else {
        const sortedMonths = Object.keys(byMonth).sort()
        const idx = sortedMonths.indexOf(this.selectedPeriod)
        if (idx < 1) return null
        return this.calcWeightedInflation(
          this.calcCategoryRates(byMonth[sortedMonths[idx - 1]], byMonth[this.selectedPeriod])
        )
      }
    },

    // ─── Category breakdown for selected period ───────────────
    personalByCategory() {
      if (!this.expenses?.length || !this.selectedPeriod) return {}
      const byMonth = this.groupExpensesByMonth()

      if (this.selectedMode === 'year') {
        const currentKey = Object.keys(byMonth)
          .filter(ym => ym.startsWith(this.selectedYear))
          .sort().at(-1)
        const prevYear = String(parseInt(this.selectedYear) - 1)
        const prevKey = Object.keys(byMonth)
          .filter(ym => ym.startsWith(prevYear))
          .sort().at(-1)
        if (!currentKey || !prevKey) return {}
        return this.calcCategoryRates(byMonth[prevKey], byMonth[currentKey])
      } else {
        const sortedMonths = Object.keys(byMonth).sort()
        const idx = sortedMonths.indexOf(this.selectedPeriod)
        if (idx < 1) return {}
        return this.calcCategoryRates(byMonth[sortedMonths[idx - 1]], byMonth[this.selectedPeriod])
      }
    },

    comparisonLabel() {
      return this.selectedMode === 'year' ? 'year-on-year' : 'month-on-month'
    },

    // ─── CPI for selected period ──────────────────────────────
    activeCpi() {
      if (this.selectedMode === 'year') {
        if (!this.cpiData) return null
        return {
          ...this.cpiData,
          period: this.selectedYear,
          source: `Department of Statistics Singapore · ${this.selectedYear}`
        }
      } else {
        if (!this.momCpiData || !this.selectedPeriod) return null
        const overallRate = this.getMonthlyRate
          ? this.getMonthlyRate(this.selectedPeriod)
          : null
        const categoryRates = this.getMonthlyCategories
          ? this.getMonthlyCategories(this.selectedPeriod)
          : {}

        // No data for selected month — fall back to latest
        if (overallRate === null) {
          return {
            ...this.momCpiData,
            period: `${this.selectedPeriod} (latest available)`,
            source: `Department of Statistics Singapore · latest`
          }
        }

        return {
          overall: overallRate,
          categories: Object.keys(categoryRates).length
            ? categoryRates
            : (this.momCpiData.categories ?? {}),
          period: this.selectedPeriod,
          source: `Department of Statistics Singapore · ${this.selectedPeriod}`,
          isLive: this.momCpiData.isLive,
        }
      }
    },

    difference() {
      if (this.personalRate == null || !this.activeCpi) return null
      return parseFloat((this.personalRate - this.activeCpi.overall).toFixed(2))
    },

    chartData() {
      if (!this.activeCpi) return []
      return CATEGORIES
        .filter(cat => this.personalByCategory[cat] != null)
        .map(cat => ({
          category: cat,
          personal: parseFloat((this.personalByCategory[cat] ?? 0).toFixed(2)),
          cpi: parseFloat(
            (this.activeCpi.categories[cat] ?? this.activeCpi.overall).toFixed(2)
          )
        }))
    }
  },

  watch: {
    availableExpenseYears(years) {
      if (years.length && !this.selectedYear) {
        this.selectedYear = years[0]
      }
    },
    availableExpenseMonths(months) {
      if (months.length && !this.selectedMonth) {
        this.selectedMonth = months[months.length - 1].value
      }
    },
    selectedYear() {
      const months = this.availableExpenseMonths
      if (months.length) {
        this.selectedMonth = months[months.length - 1].value
      }
    }
  },

  methods: {
    groupExpensesByMonth() {
      const map = {}
      for (const exp of this.expenses ?? []) {
        const ym = exp.date.slice(0, 7)
        if (!map[ym]) map[ym] = []
        map[ym].push(exp)
      }
      return map
    },

    calcCategoryRates(baseList, currentList) {
      const result = {}
      for (const cat of CATEGORIES) {
        const base = baseList?.filter(e => e.category === cat) ?? []
        const curr = currentList?.filter(e => e.category === cat) ?? []
        if (!base.length || !curr.length) continue
        const currPriceMap = {}
        curr.forEach(e => { currPriceMap[e.item.trim().toLowerCase()] = e.price })
        let num = 0, den = 0
        base.forEach(e => {
          const cp = currPriceMap[e.item.trim().toLowerCase()]
          if (cp !== undefined) {
            num += cp * e.quantity
            den += e.price * e.quantity
          }
        })
        if (den > 0) result[cat] = parseFloat((((num / den) - 1) * 100).toFixed(2))
      }
      return result
    },

    calcWeightedInflation(categoryRates) {
      let weightedSum = 0, totalWeight = 0
      for (const cat of CATEGORIES) {
        const rate = categoryRates[cat]
        const weight = WEIGHTS[cat] ?? 0
        if (rate != null) {
          weightedSum += rate * weight
          totalWeight += weight
        }
      }
      return totalWeight === 0
        ? null
        : parseFloat((weightedSum / totalWeight).toFixed(2))
    }
  }
}
</script>