import { ref, watch } from 'vue'

const CPI_RESOURCE_ID = 'M213801'
const CPI_SOURCE = 'Department of Statistics Singapore'

export function useCPI() {
  const cpiOverall    = ref(null)
  const cpiByCategory = ref({})
  const cpiSource     = ref(CPI_SOURCE)
  const cpiPeriod     = ref('')

  const availableYears = ref([])
  const selectedYear   = ref(null)

  const cpiError   = ref(false)
  const cpiLoading = ref(true)

  // Stores the raw API rows so updateCPI() can recompute without re-fetching.
  let cachedRows = []

  // Fetches all CPI data from SingStat and extracts the list of available years.
  // Falls back to hardcoded 2025 values if the fetch fails.
  async function fetchCPI() {
    try {
      const res = await fetch(
        `https://tablebuilder.singstat.gov.sg/api/table/tabledata/${CPI_RESOURCE_ID}`
      )
      if (!res.ok) throw new Error('SingStat API error')

      const json = await res.json()
      const rows = json?.Data?.row

      if (!rows || rows.length === 0) throw new Error('No data')

      cachedRows = rows

      // Extract unique years from the column keys of the first row.
      // Column keys are formatted as 'YYYY Mon' e.g. '2025 Jan'.
      const columns = rows[0].columns
      const yearsSet = new Set()

      columns.forEach(col => {
        const year = col.key.split(' ').pop()
        yearsSet.add(year)
      })

      availableYears.value = Array.from(yearsSet).sort()
      selectedYear.value = availableYears.value.at(-1)

      updateCPI()

      cpiError.value = false

    } catch (err) {
      console.error('CPI fetch failed:', err)
      cpiError.value = true

      // Hardcoded fallback — update periodically
      cpiOverall.value = 1.2
      cpiByCategory.value = {
        Food: 2.1, Housing: 0.8, Transport: 1.5,
        Healthcare: 2.8, Education: 1.0, Recreation: 0.9,
        Clothing: -0.3, Communication: -1.2
      }
      cpiPeriod.value = '2025 (cached)'

    } finally {
      cpiLoading.value = false
    }
  }

  // Recomputes CPI values for the currently selected year from cachedRows.
  // Averages all monthly values within the year for each category.
  function updateCPI() {
    if (!cachedRows.length || !selectedYear.value) return

    const columns = cachedRows[0].columns

    // Find column indices that belong to the selected year.
    const indices = columns
      .map((col, i) => col.key.includes(selectedYear.value) ? i : -1)
      .filter(i => i !== -1)

    if (!indices.length) return

    // Maps SingStat row labels to internal category keys.
    const CATEGORY_MAP = {
      'All Items':                    'overall',
      'Food':                         'Food',
      'Clothing & Footwear':          'Clothing',
      'Housing & Utilities':          'Housing',
      'Health':                       'Healthcare',
      'Transport':                    'Transport',
      'Information & Communication':  'Communication',
      'Recreation, Sport & Culture':  'Recreation',
      'Education':                    'Education',
    }

    const newByCategory = {}

    cachedRows.forEach(row => {
      const label = row.rowText?.trim()
      const mapped = CATEGORY_MAP[label]
      if (!mapped) return

      let sum = 0
      let count = 0

      // Average all monthly values within the selected year.
      indices.forEach(i => {
        const val = parseFloat(row.columns?.[i]?.value)
        if (!isNaN(val)) {
          sum += val
          count++
        }
      })

      if (count === 0) return

      const avg = sum / count

      if (mapped === 'overall') {
        cpiOverall.value = avg
      } else {
        newByCategory[mapped] = avg
      }
    })

    cpiByCategory.value = newByCategory
    cpiPeriod.value = selectedYear.value
  }

  // Re-run updateCPI whenever the user changes the selected year.
  watch(selectedYear, updateCPI)

  fetchCPI()

  return {
    cpiOverall,
    cpiByCategory,
    cpiSource,
    cpiPeriod,
    cpiError,
    cpiLoading,
    availableYears,
    selectedYear
  }
}