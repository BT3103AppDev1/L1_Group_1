import { ref } from 'vue'

// Hardcoded CPI values (SingStat, Feb 2026) 
// TODO: Replace with live fetch once Crystal is done. Need to come back to this.
// MAY HAVE MERGE CONFLICT!!!

const CPI_FUNCTION_URL = null 

const HARDCODED_CPI = {
  month: '2026-02',
  overall: 1.2,
  source: 'SingStat · Feb 2026',
  categories: {
    Food: 1.6,
    Housing: 0.3,
    Transport: 2.7,
    Healthcare: 4.4,
    Education: 1.2,
    Recreation: 1.9,
    Clothing: 0.9,
    Communication: 1.4,
  }
}

export function useCPI() {
  const cpiData = ref(null)
  const cpiLoading = ref(true)
  const cpiError = ref(null)

  async function fetchCPI() {
    cpiLoading.value = true
    cpiError.value = null

    cpiData.value = HARDCODED_CPI
    cpiLoading.value = false
  }

  function getCategoryCPI(category) {
    return cpiData.value?.categories?.[category] ?? null
  }

  return {
    cpiData,
    cpiLoading,
    cpiError,
    fetchCPI,
    getCategoryCPI,
  }
}