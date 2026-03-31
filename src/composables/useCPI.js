import { cpiData, CPI_SOURCE, CPI_PERIOD } from '@/data/cpiData.js'

export function useCPI() {
  return {
    cpiOverall:    cpiData.overall,
    cpiByCategory: cpiData.byCategory,
    cpiSource:     CPI_SOURCE,
    cpiPeriod:     CPI_PERIOD,
    cpiError:      false
  }
}