<template>
  <div class="flex-col">
    <!-- Header -->
    <div class="flex-between">
      <div class="fs-12 text-secondary">
        {{ wages.length }} entries logged
      </div>
      <button class="btn-accent-flex" @click="openForm">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 4v16m8-8H4"/></svg>
        Log Wage
      </button>
    </div>

    <!-- Add Form -->
    <div v-if="showForm" class="card card-accent">
      <div class="fs-15 fw-600 mb-16">Log Monthly Wage</div>
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
            {{ submitting ? 'Saving...' : 'Add' }}
          </button>
          <button class="btn-outline" @click="closeForm">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card" style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
      Loading wages...
    </div>

    <!-- Wages Table -->
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
          <template v-for="(wage, i) in wages" :key="wage.id">
            <!-- Edit Row -->
            <tr v-if="editingId === wage.id" class="edit-row">
              <td>
                <input v-model="editForm.effectiveDate" type="date" class="form-input-sm" style="min-width:130px;" />
              </td>
              <td>
                <input v-model="editForm.amount" type="number" step="0.01" min="0.01" class="form-input-sm" style="min-width:110px;" placeholder="e.g. 3000" />
              </td>
              <td :style="{ color: calcChange(i).color, fontWeight: '600' }">
                {{ calcChange(i).text }}
              </td>
              <td>
                <div style="display:flex; gap:6px; justify-content:flex-end;">
                  <button class="icon-btn icon-btn-success" :disabled="editSubmitting" @click="submitEdit(wage.id)" title="Save">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  </button>
                  <button class="icon-btn icon-btn-muted" :disabled="editSubmitting" @click="cancelEdit" title="Cancel">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Inline edit error -->
            <tr v-if="editingId === wage.id && editError" class="edit-error-row">
              <td colspan="4">
                <div class="error-box" style="font-size:12px; padding:6px 12px; border-radius:8px; margin:0;">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {{ editError }}
                </div>
              </td>
            </tr>

            <!-- Normal Row -->
            <tr v-if="editingId !== wage.id">
              <td class="text-secondary">{{ wage.effectiveDateDisplay }}</td>
              <td style="font-weight:600;">${{ wage.amount.toFixed(2) }}</td>
              <td :style="{ color: calcChange(i).color, fontWeight: '600' }">
                {{ calcChange(i).text }}
              </td>
              <td>
                <div style="display:flex; gap:6px; justify-content:flex-end;">
                    <button class="icon-btn icon-btn-accent" @click="openEdit(wage)" title="Edit">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button class="icon-btn icon-btn-danger" :disabled="deletingId" @click="deleteWage(wage.id)" title="Delete">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4m-4 0a1 1 0 00-1 1v3h6V4a1 1 0 00-1-1m-4 0h4"/></svg>
                    </button> 
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="wages.length === 0" style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
        No wage entries yet.
      </div>
    </div>
  </div>
</template>

<script>
import { db, auth } from '../firebase'
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'

export default {
  name: 'WageTrackerView',
  data() {
    return {
      wages: [],
      loading: true,
      submitting: false,
      showForm: false,
      form: { amount: '', effectiveDate: '' },
      formError: '',
      unsubscribe: null,

      // ─── Edit state ───────────────────────────────────────────
      editingId: null,
      editForm: { amount: '', effectiveDate: '' },
      editError: '',
      editSubmitting: false,
      
      // ─── Delete state ───────────────────────────────────────────
      deletingId: null,
    }
  },     

  mounted() {
    this.listenToWages()
  },

  beforeUnmount() {
    if (this.unsubscribe) this.unsubscribe()
  },

  methods: {
    // ─── Firestore: Real-time listener ─────────────────────────
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

    // ─── Add Form handlers ──────────────────────────────────────
    openForm() {
      this.form = { amount: '', effectiveDate: '' }
      this.formError = ''
      this.showForm = true
      this.cancelEdit() // close any open edit row
    },

    closeForm() {
      this.showForm = false
      this.formError = ''
    },

    // ─── Edit handlers ──────────────────────────────────────────
    openEdit(wage) {
      this.editingId = wage.id
      this.editForm = {
        amount: String(wage.amount),
        effectiveDate: wage.effectiveDate, // stored as YYYY-MM-DD
      }
      this.editError = ''
      this.closeForm() // close add form if open
    },

    cancelEdit() {
      this.editingId = null
      this.editForm = { amount: '', effectiveDate: '' }
      this.editError = ''
    },

    // ─── Validation (shared) ────────────────────────────────────
    validateWage(amount, effectiveDate) {
      if (!amount) return 'Amount is required.'
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) return 'Amount must be a positive number.'
      if (!effectiveDate) return 'Date is required.'
      const date = new Date(effectiveDate)
      if (isNaN(date.getTime())) return 'Please select a valid date.'
      return null // no error
    },

    // ─── Submit new entry ───────────────────────────────────────
    async submitWageEntry() {
      this.formError = ''
      const error = this.validateWage(this.form.amount, this.form.effectiveDate)
      if (error) { this.formError = error; return }

      const [yyyy, mm, dd] = this.form.effectiveDate.split('-')
      const displayDate = `${dd}/${mm}/${yyyy}`

      this.submitting = true
      try {
        const uid = auth.currentUser.uid
        await addDoc(collection(db, 'users', uid, 'wages'), {
          amount: parseFloat(this.form.amount),
          effectiveDate: this.form.effectiveDate,
          effectiveDateDisplay: displayDate,
          createdAt: serverTimestamp()
        })
        this.closeForm()
      } catch (err) {
        console.error('Error saving wage:', err)
        this.formError = 'Failed to save. Please try again.'
      } finally {
        this.submitting = false
      }
    },

    // ─── Submit edit ────────────────────────────────────────────
    async submitEdit(wageId) {
      this.editError = ''
      const error = this.validateWage(this.editForm.amount, this.editForm.effectiveDate)
      if (error) { this.editError = error; return }

      const [yyyy, mm, dd] = this.editForm.effectiveDate.split('-')
      const displayDate = `${dd}/${mm}/${yyyy}`

      this.editSubmitting = true
      try {
        const uid = auth.currentUser.uid
        const wageRef = doc(db, 'users', uid, 'wages', wageId)
        await updateDoc(wageRef, {
          amount: parseFloat(this.editForm.amount),
          effectiveDate: this.editForm.effectiveDate,
          effectiveDateDisplay: displayDate,
          updatedAt: serverTimestamp()
        })
        this.cancelEdit()
      } catch (err) {
        console.error('Error updating wage:', err)
        this.editError = 'Failed to save. Please try again.'
      } finally {
        this.editSubmitting = false
      }
    },

    // ─── Delete entry ────────────────────────────────────────────
    async deleteWage(wageId) {
      if (!confirm('Delete this wage entry? This cannot be undone.')) return
      this.deletingId = wageId
      try {
        const uid = auth.currentUser.uid
        await deleteDoc(doc(db, 'users', uid, 'wages', wageId))
      } catch (err) {
        console.error('Error deleting wage:', err)
      } finally {
        this.deletingId = null
      }
    },

    // ─── % Change calculation ────────────────────────────────────
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
.edit-row td {
  padding-top: 6px;
  padding-bottom: 6px;
  background: var(--accent-light, #f0f9ff);
}

.edit-error-row td {
  padding-top: 0;
  padding-bottom: 8px;
  background: var(--accent-light, #f0f9ff);
}

/* Icon buttons */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  flex-shrink: 0;
}
.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.icon-btn-accent {
  background: var(--accent-light, #e0f2fe);
  color: var(--accent, #0ea5e9);
}
.icon-btn-accent:hover:not(:disabled) {
  background: var(--accent, #0ea5e9);
  color: #fff;
}
.icon-btn-success {
  background: #dcfce7;
  color: #16a34a;
}
.icon-btn-success:hover:not(:disabled) {
  background: #16a34a;
  color: #fff;
}

.icon-btn-danger {
  background: #fee2e2;
  color: #dc2626;
}
.icon-btn-danger:hover:not(:disabled) {
  background: #dc2626;
  color: #fff;
}

.icon-btn-muted {
  background: var(--surface-2, #f1f5f9);
  color: var(--text-muted, #94a3b8);
}
.icon-btn-muted:hover:not(:disabled) {
  background: #e2e8f0;
  color: var(--text, #1e293b);
}
</style>