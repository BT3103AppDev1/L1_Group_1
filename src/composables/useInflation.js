import { ref, computed } from 'vue'
import { db, auth } from '../firebase'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'

const CATEGORIES = [
  'Food', 'Housing', 'Transport', 'Healthcare',
  'Education', 'Recreation', 'Clothing', 'Communication'
]

// SingStat CPI category weightings (2024 Base Year)
const CATEGORY_WEIGHTS = {
  Food: 0.21,
  Housing: 0.25,
  Transport: 0.17,
  Healthcare: 0.07,
  Education: 0.07,
  Recreation: 0.08,
  Clothing: 0.02,
  Communication: 0.04,
}

export function useInflation() {
  const expenses = ref([])
  const loading = ref(true)
  const error = ref(null)

  async function fetchExpenses() {
    loading.value = true
    error.value = null
    try {
      const uid = auth.currentUser.uid
      const expensesRef = collection(db, 'users', uid, 'expenses')
      const q = query(expensesRef, orderBy('date', 'asc'))
      const snapshot = await getDocs(q)
      expenses.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (err) {
      console.error('useInflation: Failed to fetch expenses:', err)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // ─── Helpers ───────────────────────────────────────────────
  function getYearMonth(dateStr) {
    return dateStr.substring(0, 7)
  }

  function subtractMonths(yearMonth, n) {
    const [year, month] = yearMonth.split('-').map(Number)
    const date = new Date(year, month - 1 - n, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  function groupByMonth(expenseList) {
    const map = {}
    for (const exp of expenseList) {
      const ym = getYearMonth(exp.date)
      if (!map[ym]) map[ym] = []
      map[ym].push(exp)
    }
    return map
  }

  function calcLaspeyres(baseMonthExpenses, currentMonthExpenses) {
    if (!baseMonthExpenses?.length || !currentMonthExpenses?.length) return null
    const currentPriceMap = {}
    for (const exp of currentMonthExpenses) {
      const key = exp.item.trim().toLowerCase()
      currentPriceMap[key] = exp.price
    }
    let numerator = 0    
    let denominator = 0  
    for (const baseExp of baseMonthExpenses) {
      const key = baseExp.item.trim().toLowerCase()
      const currentPrice = currentPriceMap[key]
      if (currentPrice !== undefined) {
        numerator += currentPrice * baseExp.quantity
        denominator += baseExp.price * baseExp.quantity
      }
    }
    if (denominator === 0) return null
    return ((numerator / denominator) - 1) * 100
  }

  function calcCategoryLaspeyres(baseMonthExpenses, currentMonthExpenses) {
    const result = {}
    for (const category of CATEGORIES) {
      const baseItems = baseMonthExpenses?.filter(e => e.category === category) ?? []
      const currentItems = currentMonthExpenses?.filter(e => e.category === category) ?? []
      result[category] = calcLaspeyres(baseItems, currentItems)
    }
    return result
  }

  function calcWeightedInflation(categoryRates) {
    let weightedSum = 0
    let totalWeight = 0
    for (const category of CATEGORIES) {
      const rate = categoryRates[category]
      const weight = CATEGORY_WEIGHTS[category] ?? 0
      if (rate !== null && rate !== undefined) {
        weightedSum += rate * weight
        totalWeight += weight
      }
    }
    if (totalWeight === 0) return null
    return weightedSum / totalWeight
  }

  // Computation stuff.
  const personalInflationMoM = computed(() => {
    const byMonth = groupByMonth(expenses.value)
    const sortedMonths = Object.keys(byMonth).sort()
    if (sortedMonths.length < 2) return null
    const current = sortedMonths[sortedMonths.length - 1]
    const previous = sortedMonths[sortedMonths.length - 2]
    return calcWeightedInflation(calcCategoryLaspeyres(byMonth[previous], byMonth[current]))
  })

  const personalInflationYoY = computed(() => {
    const byMonth = groupByMonth(expenses.value)
    const sortedMonths = Object.keys(byMonth).sort()
    if (sortedMonths.length < 2) return null
    const current = sortedMonths[sortedMonths.length - 1]
    const oneYearAgo = subtractMonths(current, 12)
    return calcWeightedInflation(calcCategoryLaspeyres(byMonth[oneYearAgo], byMonth[current]))
  })

  const categoryInflationMoM = computed(() => {
    const byMonth = groupByMonth(expenses.value)
    const sortedMonths = Object.keys(byMonth).sort()
    if (sortedMonths.length < 2) return {}
    const current = sortedMonths[sortedMonths.length - 1]
    const previous = sortedMonths[sortedMonths.length - 2]
    return calcCategoryLaspeyres(byMonth[previous], byMonth[current])
  })

  const categoryInflationYoY = computed(() => {
    const byMonth = groupByMonth(expenses.value)
    const sortedMonths = Object.keys(byMonth).sort()
    if (sortedMonths.length < 2) return {}
    const current = sortedMonths[sortedMonths.length - 1]
    const oneYearAgo = subtractMonths(current, 12)
    return calcCategoryLaspeyres(byMonth[oneYearAgo], byMonth[current])
  })

  const sixMonthTrend = computed(() => {
    const byMonth = groupByMonth(expenses.value)
    const sortedMonths = Object.keys(byMonth).sort()
    if (sortedMonths.length < 2) return []
    const latest = sortedMonths[sortedMonths.length - 1]
    const months = []
    for (let i = 5; i >= 0; i--) {
      const ym = subtractMonths(latest, i)
      const prev = subtractMonths(ym, 1)
      const categoryRates = calcCategoryLaspeyres(byMonth[prev], byMonth[ym])
      const rate = calcWeightedInflation(categoryRates)
      const [year, month] = ym.split('-').map(Number)
      months.push({
        month: new Date(year, month - 1).toLocaleString('en-SG', { month: 'short' }),
        yearMonth: ym,
        personal: rate !== null ? parseFloat(rate.toFixed(1)) : 0,
      })
    }
    return months
  })

  const hasEnoughData = computed(() => Object.keys(groupByMonth(expenses.value)).length >= 2)

  return {
    loading,
    error,
    hasEnoughData,
    fetchExpenses,
    expenses,
    personalInflationMoM,
    personalInflationYoY,
    categoryInflationMoM,
    categoryInflationYoY,
    sixMonthTrend,
  }
}