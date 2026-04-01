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

  let cachedRows = []

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

      // ✅ extract years
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

  function updateCPI() {
    if (!cachedRows.length || !selectedYear.value) return

    const columns = cachedRows[0].columns

    // get all months in selected year
    const indices = columns
      .map((col, i) => col.key.includes(selectedYear.value) ? i : -1)
      .filter(i => i !== -1)

    if (!indices.length) return

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