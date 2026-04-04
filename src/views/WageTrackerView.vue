<template>
  <div class="flex-col">

    <!-- ── Delete Confirm Modal (same as ExpensesView) ── -->
    <ConfirmModal
      v-model="showDeleteModal"
      variant="danger"
      title="Delete Wage Entry"
      message="This wage entry will be permanently removed. This action cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- ── Growth Rate + Inflation Summary Cards ── -->
    <div class="summary-grid">

      <!-- Wage Growth Rate Card -->
      <div class="card summary-card">
        <div class="summary-card-header">
          <span class="summary-label">Wage Growth Rate</span>
          <div class="toggle-group">
            <button :class="['toggle-btn', interval === 'monthly' ? 'toggle-active' : '']" @click="interval = 'monthly'">Monthly</button>
            <button :class="['toggle-btn', interval === 'yearly' ? 'toggle-active' : '']" @click="interval = 'yearly'">Yearly</button>
          </div>
        </div>
        <div v-if="wageGrowth === null" class="summary-empty">Add at least 2 wage entries to see growth rate.</div>
        <div v-else class="summary-value-row">
          <span class="summary-value" :style="{ color: wageGrowth >= 0 ? 'var(--success, #22c55e)' : '#ef4444' }">
            {{ wageGrowth >= 0 ? '+' : '' }}{{ wageGrowth.toFixed(2) }}%
          </span>
          <span class="summary-sub">{{ interval === 'monthly' ? 'vs last month' : 'vs last year' }}</span>
        </div>
      </div>

      <!-- SG CPI Inflation Card -->
      <div class="card summary-card">
        <div class="summary-card-header">
          <span class="summary-label">SG Inflation Rate (CPI)</span>
          <span class="summary-badge">{{ interval === 'monthly' ? 'Monthly' : 'Yearly' }}</span>
        </div>
        <div v-if="cpiLoading" class="summary-empty">Loading CPI data...</div>
        <div v-else-if="cpiRate === null" class="summary-empty">No CPI data available.</div>
        <div v-else class="summary-value-row">
          <span class="summary-value" :style="{ color: cpiRate >= 0 ? '#ef4444' : 'var(--success, #22c55e)' }">
            {{ cpiRate >= 0 ? '+' : '' }}{{ cpiRate.toFixed(2) }}%
          </span>
          <span class="summary-sub">{{ cpiPeriodLabel }}</span>
        </div>
      </div>

      <!-- Real Wage Growth Card -->
      <div class="card summary-card">
        <div class="summary-card-header">
          <span class="summary-label">Real Wage Growth</span>
          <span class="summary-badge">After Inflation</span>
        </div>
        <div v-if="realGrowth === null" class="summary-empty">Requires both wage and CPI data.</div>
        <div v-else class="summary-value-row">
          <span class="summary-value" :style="{ color: realGrowth >= 0 ? 'var(--success, #22c55e)' : '#ef4444' }">
            {{ realGrowth >= 0 ? '+' : '' }}{{ realGrowth.toFixed(2) }}%
          </span>
          <span class="summary-sub">{{ realGrowth >= 0 ? '🟢 Beating inflation' : '🔴 Behind inflation' }}</span>
        </div>
      </div>

    </div>

    <!-- ── Header ── -->
    <div class="flex-between">
      <div class="fs-12 text-secondary">{{ wages.length }} entries logged</div>
      <button class="btn-accent-flex" @click="openForm">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 4v16m8-8H4"/></svg>
        Log Wage
      </button>
    </div>

    <!-- ── Add / Edit Form (same style as ExpensesView) ── -->
    <div v-if="showForm" class="card card-accent">
      <div class="fs-15 fw-600 mb-16">{{ editingId ? 'Edit Wage Entry' : 'Log Monthly Wage' }}</div>
      <div v-if="formError" class="error-box" style="font-size:12px; padding:8px 12px; border-radius:8px;">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ formError }}
      </div>
      <div class="grid-3 mb-16">
        <div>
          <label class="form-label-sm">Amount (SGD) *</label>
          <input v-model="form.amount" type="number" step="0.01" min="0.01" class="form-input-sm" placeholder="e.g. 3000" />
        </div>
        <div>
          <label class="form-label-sm">Date *</label>
          <input v-model="form.effectiveDate" type="date" class="form-input-sm" />
        </div>
        <div style="display:flex; align-items:flex-end; gap:8px;">
          <button class="btn-sm" style="flex:1;" @click="submitWageEntry" :disabled="submitting">
            {{ submitting ? 'Saving...' : (editingId ? 'Update' : 'Add') }}
          </button>
          <button class="btn-outline" @click="closeForm">Cancel</button>
        </div>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="card" style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
      Loading wages...
    </div>

    <!-- ── Wages Table ── -->
    <div v-else class="card">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount (SGD)</th>
            <th>% Change</th>
            <th style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(wage, i) in wages" :key="wage.id">
            <td class="text-secondary">{{ wage.effectiveDateDisplay }}</td>
            <td style="font-weight:600;">${{ wage.amount.toFixed(2) }}</td>
            <td :style="{ color: calcChange(i).color, fontWeight: '600' }">{{ calcChange(i).text }}</td>
            <td>
              <div style="display:flex; gap:6px; justify-content:flex-end;">
                <button class="icon-btn icon-btn-accent" @click="openEdit(wage)" title="Edit">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button class="icon-btn icon-btn-danger" @click="deleteWage(wage.id)" title="Delete">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v3h6V4a1 1 0 00-1-1m-4 0h4"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="wages.length === 0" style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
        No wage entries yet.
      </div>
    </div>

  </div>
</template>

<script>
import ConfirmModal from '../components/ConfirmModal.vue'
import { db, auth } from '../firebase'
import {
  collection, addDoc, doc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { useCPI_MoM } from '../composables/useCPI_MoM'
import { useCPI_YoY } from '../composables/useCPI_YoY'

export default {
  name: 'WageTrackerView',
  components: { ConfirmModal },

  setup() {
    const momCpi = useCPI_MoM()
    const yoyCpi = useCPI_YoY()
    return { momCpi, yoyCpi }
  },

  data() {
    return {
      wages: [],
      loading: true,
      submitting: false,
      showForm: false,
      editingId: null,
      form: { amount: '', effectiveDate: '' },
      formError: '',
      unsubscribe: null,

      // ── Delete modal (same pattern as ExpensesView) ──
      showDeleteModal: false,
      pendingDeleteId: null,
      deleting: false,

      interval: 'monthly',
    }
  },

  computed: {
    activeCpi() {
      return this.interval === 'monthly' ? this.momCpi : this.yoyCpi
    },
    cpiLoading() {
      return this.activeCpi.cpiLoading.value
    },
    cpiRate() {
      const data = this.activeCpi.cpiData.value
      if (!data) return null
      return data.overall
    },
    cpiPeriodLabel() {
      const data = this.activeCpi.cpiData.value
      if (!data) return ''
      return data.source ?? ''
    },
    wageGrowth() {
      if (this.wages.length < 2) return null
      const latest = this.wages[0]
      if (this.interval === 'monthly') {
        const previous = this.wages[1]
        return ((latest.amount - previous.amount) / previous.amount) * 100
      } else {
        const latestDate = new Date(latest.effectiveDate)
        const targetDate = new Date(latestDate)
        targetDate.setFullYear(targetDate.getFullYear() - 1)
        let closest = null
        let minDiff = Infinity
        for (let i = 1; i < this.wages.length; i++) {
          const d = new Date(this.wages[i].effectiveDate)
          const diff = Math.abs(d - targetDate)
          if (diff < minDiff) { minDiff = diff; closest = this.wages[i] }
        }
        if (!closest) return null
        return ((latest.amount - closest.amount) / closest.amount) * 100
      }
    },
    realGrowth() {
      if (this.wageGrowth === null || this.cpiRate === null) return null
      return this.wageGrowth - this.cpiRate
    },
  },

  mounted() {
    this.listenToWages()
    this.momCpi.fetchCPI()
    this.yoyCpi.fetchCPI()
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  },

  methods: {
    listenToWages() {
      const uid = auth.currentUser.uid
      const wagesRef = collection(db, 'users', uid, 'wages')
      const q = query(wagesRef, orderBy('effectiveDate', 'desc'))
      this.unsubscribe = onSnapshot(q, (snapshot) => {
        this.wages = snapshot.docs.map(snap => ({ id: snap.id, ...snap.data() }))
        this.loading = false
      }, (error) => {
        console.error('Error listening to wages:', error)
        this.loading = false
      })
    },

    // ── Form: open for add ──
    openForm() {
      this.editingId = null
      this.form = { amount: '', effectiveDate: '' }
      this.formError = ''
      this.showForm = true
    },

    // ── Form: open for edit (same pattern as ExpensesView.editExpense) ──
    openEdit(wage) {
      this.editingId = wage.id
      this.form = {
        amount: String(wage.amount),
        effectiveDate: wage.effectiveDate,
      }
      this.formError = ''
      this.showForm = true
    },

    closeForm() {
      this.showForm = false
      this.editingId = null
      this.formError = ''
    },

    validateWage(amount, effectiveDate) {
      if (!amount) return 'Amount is required.'
      const parsed = parseFloat(amount)
      if (isNaN(parsed) || parsed <= 0) return 'Amount must be a positive number.'
      if (!effectiveDate) return 'Date is required.'
      if (isNaN(new Date(effectiveDate).getTime())) return 'Please select a valid date.'
      return null
    },

    // ── Submit: handles both add and update ──
    async submitWageEntry() {
      this.formError = ''
      const error = this.validateWage(this.form.amount, this.form.effectiveDate)
      if (error) { this.formError = error; return }

      const [yyyy, mm, dd] = this.form.effectiveDate.split('-')
      const displayDate = `${dd}/${mm}/${yyyy}`
      this.submitting = true

      try {
        const uid = auth.currentUser.uid
        if (this.editingId) {
          // Update existing entry
          const wageRef = doc(db, 'users', uid, 'wages', this.editingId)
          await updateDoc(wageRef, {
            amount: parseFloat(this.form.amount),
            effectiveDate: this.form.effectiveDate,
            effectiveDateDisplay: displayDate,
            updatedAt: serverTimestamp()
          })
        } else {
          // Add new entry
          await addDoc(collection(db, 'users', uid, 'wages'), {
            amount: parseFloat(this.form.amount),
            effectiveDate: this.form.effectiveDate,
            effectiveDateDisplay: displayDate,
            createdAt: serverTimestamp()
          })
        }
        this.closeForm()
      } catch (err) {
        console.error('Error saving wage:', err)
        this.formError = 'Failed to save. Please try again.'
      } finally {
        this.submitting = false
      }
    },

    // ── Delete: open modal (same as ExpensesView.deleteExpense) ──
    deleteWage(id) {
      this.pendingDeleteId = id
      this.showDeleteModal = true
    },

    // ── Delete: confirmed (same as ExpensesView.confirmDelete) ──
    async confirmDelete() {
      this.deleting = true
      try {
        const uid = auth.currentUser.uid
        await deleteDoc(doc(db, 'users', uid, 'wages', this.pendingDeleteId))
        this.showDeleteModal = false
        this.pendingDeleteId = null
      } catch (err) {
        console.error('Error deleting wage:', err)
        alert('Failed to delete. Please try again.')
      } finally {
        this.deleting = false
      }
    },

    calcChange(index) {
      if (index === this.wages.length - 1) return { text: '-', color: 'var(--text-muted)' }
      const current = this.wages[index].amount
      const previous = this.wages[index + 1].amount
      const pct = (((current - previous) / previous) * 100).toFixed(2)
      return {
        text: pct > 0 ? `+${pct}%` : `${pct}%`,
        color: pct > 0 ? 'var(--success, #22c55e)' : 'red'
      }
    }
  }
}
</script>

<style scoped>
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 4px; }
@media (max-width: 768px) { .summary-grid { grid-template-columns: 1fr; } }
.summary-card { display: flex; flex-direction: column; gap: 12px; }
.summary-card-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.summary-label { font-size: 12px; font-weight: 600; color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.04em; }
.summary-value-row { display: flex; align-items: baseline; gap: 8px; }
.summary-value { font-size: 26px; font-weight: 700; line-height: 1; }
.summary-sub { font-size: 12px; color: var(--text-muted, #94a3b8); }
.summary-empty { font-size: 12px; color: var(--text-muted, #94a3b8); padding: 8px 0; }
.summary-badge { font-size: 11px; font-weight: 600; background: var(--surface-2, #f1f5f9); color: var(--text-muted, #64748b); border-radius: 99px; padding: 2px 10px; }
.toggle-group { display: flex; background: var(--surface-2, #f1f5f9); border-radius: 8px; padding: 3px; gap: 2px; }
.toggle-btn { font-size: 11px; font-weight: 600; padding: 4px 10px; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: var(--text-muted, #94a3b8); transition: background 0.15s, color 0.15s; }
.toggle-active { background: var(--accent, #10b981); color: #fff; }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 7px; border: none; cursor: pointer; transition: background 0.15s, opacity 0.15s; flex-shrink: 0; }
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.icon-btn-accent  { background: var(--accent-light, #e0f2fe); color: var(--accent, #0ea5e9); }
.icon-btn-accent:hover:not(:disabled)  { background: var(--accent, #0ea5e9); color: #fff; }
.icon-btn-danger  { background: #fee2e2; color: #dc2626; }
.icon-btn-danger:hover:not(:disabled)  { background: #dc2626; color: #fff; }
</style>