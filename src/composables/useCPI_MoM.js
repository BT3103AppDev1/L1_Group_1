// src/composables/useCPI_MoM.js
// CPI composable for MoM % change data.
// Completely independent of useCPI.js — do not merge.

// M213771 — Percent Change In CPI Over Previous Period (MoM), 2024 As Base Year

import { ref, computed } from 'vue'

const BASE_URL = `https://tablebuilder.singstat.gov.sg/api/table/tabledata/M213771`

// ─── Hardcoded fallback (SingStat Feb 2026 MoM) ──────────────────────────────
// Used when the SingStat API is unreachable. Update periodically.
const HARDCODED_CPI = {
  period: 'Feb 2026',
  overall: 0.6,
  source: 'SingStat · Feb 2026 (cached)',
  categories: {
    Food: 0.5,
    Housing: 1.3,
    Transport: -0.4,
    Healthcare: -0.2,
    Education: 0.0,
    Recreation: 1.6,
    Clothing: 0.9,
    Communication: 0.3,
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

// Converts SingStat month abbreviations to zero-padded month numbers.
const MONTH_TO_NUM = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04',
  May: '05', Jun: '06', Jul: '07', Aug: '08',
  Sep: '09', Oct: '10', Nov: '11', Dec: '12'
}

// Main exported function
export function useCPI_MoM() {
  const cpiOverall     = ref(null)  // Latest overall MoM CPI %
  const cpiByCategory  = ref({})  // Latest MoM CPI % by category
  const cpiPeriod      = ref('')  // Period string of the latest data e.g. 'Feb 2026'
  const cpiLoading     = ref(true)
  const cpiError       = ref(null)
  const monthlyHistory = ref({}) // Full history used for trend chart and period lookup

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
  // MoM keys are formatted as 'YYYY Mon' e.g. '2026 Feb'.
  function getLatestValue(columns) {
    for (let i = columns.length - 1; i >= 0; i--) {
      const col   = columns[i]
      const parts = col.key.trim().split(' ')
      if (parts.length !== 2) continue
      const [year, mon] = parts
      const monthNum = MONTH_TO_NUM[mon]
      if (!monthNum || !year.match(/^\d{4}$/)) continue
      const val = parseFloat(col.value)
      if (isNaN(val)) continue
      return { ym: `${year}-${monthNum}`, val, period: `${mon} ${year}` }
    }
    return null
  }

  // Builds a full monthly history object.
  // Keyed by 'YYYY-MM' -> { overall: number }.
  function buildHistory(columns) {
    const history = {}
    columns.forEach(col => {
      const parts = col.key.trim().split(' ')
      if (parts.length !== 2) return
      const [year, mon] = parts
      const monthNum = MONTH_TO_NUM[mon]
      if (!monthNum || !year.match(/^\d{4}$/)) return
      const val = parseFloat(col.value)
      if (isNaN(val)) return
      const ym = `${year}-${monthNum}`
      if (!history[ym]) history[ym] = {}
      history[ym].overall = val
    })
    return history
  }

  // Live fetch of all series in parallel
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
          console.warn(`useCPI_MoM: row not found for ${mapped}`)
          return
        }

        const latest = getLatestValue(row.columns)
        if (!latest) {
          console.warn(`useCPI_MoM: no valid value for ${mapped}`)
          return
        }

        console.log(`useCPI_MoM: ${mapped} → ${latest.period} = ${latest.val}`)

        if (mapped === 'overall') {
          cpiOverall.value    = latest.val
          cpiPeriod.value     = latest.period
          monthlyHistory.value = buildHistory(row.columns)
        } else {
          newByCategory[mapped] = latest.val
        }
      })

      if (cpiOverall.value === null) throw new Error('Could not read overall CPI')
      cpiByCategory.value = newByCategory

    } catch (err) {
      console.warn('useCPI_MoM: Live fetch failed, using hardcoded fallback.', err.message)
      cpiError.value      = err.message
      cpiOverall.value    = HARDCODED_CPI.overall
      cpiByCategory.value = { ...HARDCODED_CPI.categories }
      cpiPeriod.value     = HARDCODED_CPI.period
    } finally {
      cpiLoading.value = false
    }
  }

  // Returns the overall MoM CPI % for a specific month.
  function getMonthlyRate(ym) {
    return monthlyHistory.value[ym]?.overall ?? null
  }

  // Returns the category breakdown for a specific month.
  function getMonthlyCategories(ym) {
    return monthlyHistory.value[ym]?.categories ?? {}
  }

  // Returns the latest MoM CPI % for a single category.
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
    getMonthlyRate,
    getMonthlyCategories
  }
}