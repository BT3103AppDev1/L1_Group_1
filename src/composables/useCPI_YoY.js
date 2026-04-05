// src/composables/useCPI_YoY.js
// CPI composable for YoY % change data.
// Values are already YoY % change — no further calculation needed.
// Completely independent of useCPI_MoM.js — do not merge.

// M213811 — Percent Change In CPI Over Corresponding Period Of Previous Year (YoY), 2024 As Base Year


import { ref, computed } from 'vue'

const BASE_URL = `https://tablebuilder.singstat.gov.sg/api/table/tabledata/M213811`

// ─── Hardcoded fallback (SingStat 2025 YoY) ──────────────────────────────────
// Used when the SingStat API is unreachable. Update periodically.
const HARDCODED_CPI = {
  period: '2025',
  overall: 0.9,
  source: 'SingStat · 2025 (cached)',
  categories: {
    Food: 1.2,
    Housing: 0.5,
    Transport: 1.5,
    Healthcare: 3.5,
    Education: 1.1,
    Recreation: 0.7,
    Clothing: -0.4,
    Communication: -1.9,
  }
}

// Maps each category to its SingStat series number and internal key.
// seriesNo must match exactly what SingStat returns in the API response.
const SERIES = [
  { search: 'All Items',   seriesNo: '1',    mapped: 'overall'       },
  { search: 'Food',        seriesNo: '1.0',  mapped: 'Food'          },
  { search: 'Clothing',    seriesNo: '1.02', mapped: 'Clothing'      },
  { search: 'Housing',     seriesNo: '1.03', mapped: 'Housing'       },
  { search: 'Health',      seriesNo: '1.05', mapped: 'Healthcare'    },
  { search: 'Transport',   seriesNo: '1.06', mapped: 'Transport'     },
  { search: 'Information', seriesNo: '1.07', mapped: 'Communication' },
  { search: 'Recreation',  seriesNo: '1.08', mapped: 'Recreation'    },
  { search: 'Education',   seriesNo: '1.09', mapped: 'Education'     },
]

// Main exported function
export function useCPI_YoY() {
  const cpiOverall    = ref(null)  // Latest overall YoY CPI %
  const cpiByCategory = ref({})  // Latest YoY CPI % by category
  const cpiPeriod     = ref('')  // Period string of the latest data e.g. '2025'
  const cpiLoading    = ref(true)
  const cpiError      = ref(null)
  const yearlyHistory = ref({})  // Full history used for period lookup

  // Fetches a single series from the SingStat API,
  // matching by seriesNo first,
  // falling back to rowText match if seriesNo is not found.
  async function fetchSeries({ search, seriesNo }) {
    const res = await fetch(`${BASE_URL}?search=${encodeURIComponent(search)}&limit=100000`)
    if (!res.ok) throw new Error(`SingStat API returned ${res.status}`)
    const json = await res.json()
    const rows = json?.Data?.row ?? []
    return rows.find(r => r.seriesNo?.trim() === seriesNo)
        ?? rows.find(r => r.rowText?.trim() === search)
        ?? null
  }

  // Search columns from the end to find the most recent non-null value.
  // YoY keys are 4-digit year strings e.g. '2025'.
  function getLatestValue(columns) {
    for (let i = columns.length - 1; i >= 0; i--) {
      const col = columns[i]
      const key = col.key.trim()
      if (!key.match(/^\d{4}$/)) continue
      const val = parseFloat(col.value)
      if (isNaN(val)) continue
      return { period: key, val }
    }
    return null
  }

  // Builds a full yearly history object.
  // Keyed by 'YYYY-MM' -> { overall||category: number }.
  function buildHistory(columns, mapped) {
    columns.forEach(col => {
      const year = col.key.trim()
      if (!year.match(/^\d{4}$/)) return
      const val = parseFloat(col.value)
      if (isNaN(val)) return
      if (!yearlyHistory.value[year]) yearlyHistory.value[year] = {}
      yearlyHistory.value[year][mapped] = val
    })
  }

  // Live fetch of all series in parallel.
  // Falls back to hardcoded data if any error occurs.
  async function fetchCPI() {
    cpiLoading.value = true
    cpiError.value   = null
    try {
      const results = await Promise.all(
        SERIES.map(s => fetchSeries(s).then(row => ({ ...s, row })))
      )

      const newByCategory = {}

      results.forEach(({ mapped, row }) => {
        if (!row) {
          console.warn(`useCPI_YoY: row not found for ${mapped}`)
          return
        }

        buildHistory(row.columns, mapped)
        const latest = getLatestValue(row.columns)
        if (!latest) return

        if (mapped === 'overall') {
          cpiOverall.value = latest.val
          cpiPeriod.value  = latest.period
        } else {
          newByCategory[mapped] = latest.val
        }
      })

      if (cpiOverall.value === null) throw new Error('Could not read overall CPI')
      cpiByCategory.value = newByCategory

    } catch (err) {
      console.warn('useCPI_YoY: Live fetch failed, using hardcoded fallback.', err.message)
      cpiError.value      = err.message
      cpiOverall.value    = HARDCODED_CPI.overall
      cpiByCategory.value = { ...HARDCODED_CPI.categories }
      cpiPeriod.value     = HARDCODED_CPI.period
    } finally {
      cpiLoading.value = false
    }
  }

  // Get YoY inflation rate for a specific period (for cpi comparison page)
  function getYearlyRate(year) {
    return yearlyHistory.value[year]?.overall ?? null
  }

  // Get YoY inflation rate category breakdown for a specific period (for cpi comparison page)
  function getYearlyCategories(year) {
    const { overall, ...categories } = yearlyHistory.value[year] ?? {}
    return categories
  }

  // Returns the latest YoY CPI % for a single category.
  function getCategoryCPI(category) {
    return cpiByCategory.value?.[category] ?? null
  }

  // Unified shape for the latest CPI data.
  const cpiData = computed(() => {
    if (cpiOverall.value === null) return null
    return {
      overall:    cpiOverall.value,
      categories: cpiByCategory.value,
      source:     cpiError.value ? HARDCODED_CPI.source
        : `Department of Statistics Singapore · ${cpiPeriod.value}`,
      period:     cpiPeriod.value,
      isLive:     !cpiError.value,
    }
  })

  return {
    cpiData,
    cpiLoading,
    cpiError,
    fetchCPI,
    getCategoryCPI,
    getYearlyRate,
    getYearlyCategories,
  }
}