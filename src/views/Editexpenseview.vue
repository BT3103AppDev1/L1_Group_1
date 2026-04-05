<template>
  <div class="edit-expense-page">
    <!-- Save Confirm Modal -->
    <ConfirmModal
      v-model="showSaveModal"
      variant="warning"
      title="Save Changes"
      message="Are you sure you want to update this expense? The following fields will be changed."
      confirmLabel="Yes, Save"
      cancelLabel="Go Back"
      :loading="submitting"
      @confirm="submitEdit"
      @cancel="showSaveModal = false"
    />
    <!-- Back nav -->
    <button class="back-btn" @click="$router.push('/expenses')">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path d="M15 19l-7-7 7-7"/>
      </svg>
      Back to Expenses
    </button>

    <!-- Page header -->
    <div class="page-header">
      <div class="page-header-icon">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </div>
      <div>
        <h1 class="page-title">Edit Expense</h1>
        <p class="page-subtitle" v-if="original">Editing: <strong>{{ original.item }}</strong></p>
        <p class="page-subtitle" v-else-if="loading">Loading expense...</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="card" style="text-align:center; padding:60px; color:var(--text-muted); font-size:13px;">
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px; display:block; opacity:0.4;">
        <path d="M12 3v3m0 12v3M3 12h3m12 0h3"/>
      </svg>
      Loading expense details...
    </div>

    <!-- Not found -->
    <div v-else-if="notFound" class="card card-danger" style="padding:40px; text-align:center;">
      <p style="font-size:15px; font-weight:600; margin-bottom:8px;">Expense not found</p>
      <p class="text-secondary fs-12">This expense may have been deleted.</p>
      <button class="btn-sm" style="margin-top:16px;" @click="$router.push('/expenses')">Go Back</button>
    </div>

    <!-- Edit form -->
    <div v-else class="card card-accent edit-form-card">
      <!-- Error -->
      <div v-if="formError" class="error-box">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ formError }}
      </div>

      <!-- Success -->
      <div v-if="saveSuccess" class="success-box">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        Expense updated successfully!
      </div>

      <!-- Form body -->
      <div class="form-section">
        <h2 class="form-section-title">Item Details</h2>
        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">Item Name *</label>
            <input v-model="form.item" class="form-input" placeholder="e.g. Rice (5kg)" maxlength="100" />
            <span class="char-count">{{ form.item.length }}/100</span>
          </div>
          <div class="form-group">
            <label class="form-label">Unit Price ($) *</label>
            <div class="input-prefix-wrapper">
              <span class="input-prefix">$</span>
              <input v-model="form.price" type="number" step="0.01" min="0.01" max="999999.99"
                class="form-input has-prefix" placeholder="0.00" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Quantity</label>
            <input v-model="form.quantity" type="number" min="1" class="form-input" />
          </div>
        </div>
      </div>

      <div class="form-divider"></div>

      <div class="form-section">
        <h2 class="form-section-title">Classification</h2>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input v-model="form.date" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select v-model="form.category" class="form-input" style="cursor:pointer;">
              <option value="">Select category</option>
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Live total preview -->
      <div class="total-preview" v-if="liveTotal > 0">
        <span class="total-label">Line Total</span>
        <span class="total-value">${{ liveTotal }}</span>
      </div>

      <div class="form-divider"></div>

      <!-- Changed fields summary -->
      <div v-if="changedFields.length" class="changes-summary">
        <span class="changes-label">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Unsaved changes:
        </span>
        <span v-for="f in changedFields" :key="f" class="change-tag">{{ f }}</span>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button class="btn-outline" @click="resetForm" :disabled="submitting">
          Reset Changes
        </button>
        <div style="display:flex; gap:8px;">
          <button class="btn-outline" @click="$router.push('/expenses')" :disabled="submitting">
            Cancel
          </button>
          <button class="btn-primary save-btn" @click="openSaveModal" :disabled="submitting || !hasChanges">
            <svg v-if="!submitting" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path d="M5 13l4 4L19 7"/>
            </svg>
            <span>{{ submitting ? 'Saving...' : 'Save Changes' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ConfirmModal from '../components/ConfirmModal.vue'
import { db, auth } from '../firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

const CATEGORIES = [
  'Food', 'Housing', 'Transport', 'Healthcare',
  'Education', 'Recreation', 'Clothing', 'Communication'
]

export default {
  name: 'EditExpenseView',

  components: { ConfirmModal },
  data() {
    return {
      CATEGORIES,
      loading: true,
      notFound: false,
      submitting: false,
      formError: '',
      saveSuccess: false,
      showSaveModal: false,
      original: null, // Snapshot of the expense as loaded — used for change detection and reset
      form: { item: '', price: '', quantity: '1', date: '', category: '' }, // Default values
    }
  },

  computed: {
    // Live price × quantity total shown below the form fields
    liveTotal() {
      const price = parseFloat(this.form.price)
      const qty = parseInt(this.form.quantity)
      if (isNaN(price) || isNaN(qty)) return 0
      return (price * qty).toFixed(2)
    },

    // True if any form field differs from the original loaded values
    hasChanges() {
      if (!this.original) return false
      return (
        this.form.item !== this.original.item ||
        parseFloat(this.form.price) !== this.original.price ||
        parseInt(this.form.quantity) !== this.original.quantity ||
        this.form.date !== this.original.date ||
        this.form.category !== this.original.category
      )
    },

    // List of field names that have changed — displayed as tags in the UI
    // Passed to the confirmation modal so the user can review before saving
    changedFields() {
      if (!this.original) return []
      const fields = []
      if (this.form.item !== this.original.item) fields.push('Name')
      if (parseFloat(this.form.price) !== this.original.price) fields.push('Price')
      if (parseInt(this.form.quantity) !== this.original.quantity) fields.push('Quantity')
      if (this.form.date !== this.original.date) fields.push('Date')
      if (this.form.category !== this.original.category) fields.push('Category')
      return fields
    }
  },

  async mounted() {
    await this.loadExpense()
  },

  methods: {
    // Fetches the expense by ID from the route params and populates the form
    async loadExpense() {
      try {
        const uid = auth.currentUser.uid
        const expenseId = this.$route.params.id
        const expenseRef = doc(db, 'users', uid, 'expenses', expenseId)
        const snap = await getDoc(expenseRef)

        if (!snap.exists()) {
          this.notFound = true
          this.loading = false
          return
        }

        const data = snap.data()
        this.original = { id: snap.id, ...data }
        this.form = {
          item: data.item,
          price: String(data.price),
          quantity: String(data.quantity),
          date: data.date,
          category: data.category,
        }
      } catch (err) {
        console.error('Failed to load expense:', err)
        this.notFound = true
      } finally {
        this.loading = false
      }
    },

    // Resets all form fields back to the original loaded values
    resetForm() {
      if (!this.original) return
      this.form = {
        item: this.original.item,
        price: String(this.original.price),
        quantity: String(this.original.quantity),
        date: this.original.date,
        category: this.original.category,
      }
      this.formError = ''
    },

    // Validates the form before showing the save confirmation modal.
    // The modal is only shown if all validation passes.
    openSaveModal() {
      // Run validation before showing the modal
      const f = this.form
      this.formError = ''

      if (!f.item || !f.price || !f.date || !f.category) {
        this.formError = 'All fields are required.'
        return
      }
      if (f.item.length > 100) {
        this.formError = 'Item name must be 100 characters or less.'
        return
      }
      const price = parseFloat(f.price)
      if (isNaN(price) || price < 0.01 || price > 999999.99) {
        this.formError = 'Price must be between $0.01 and $999,999.99.'
        return
      }
      const quantity = parseInt(f.quantity)
      if (isNaN(quantity) || quantity < 1) {
        this.formError = 'Quantity must be at least 1.'
        return
      }
      if (new Date(f.date) > new Date()) {
        this.formError = 'Date cannot be in the future.'
        return
      }
      if (!CATEGORIES.includes(f.category)) {
        this.formError = 'Please select a valid category.'
        return
      }

      // All valid — show confirm modal
      this.showSaveModal = true
    },

    // Called when the user confirms the save modal.
    // Writes the updated expense to Firestore and redirects back to the expenses list.
    async submitEdit() {
      const f = this.form
      this.formError = ''
      this.saveSuccess = false
      this.submitting = true
      try {
        const price = parseFloat(f.price)
        const quantity = parseInt(f.quantity)
        const uid = auth.currentUser.uid
        const expenseRef = doc(db, 'users', uid, 'expenses', this.$route.params.id)
        await updateDoc(expenseRef, {
          item: f.item.trim(),
          price: Math.round(price * 100) / 100,
          quantity,
          date: f.date,
          category: f.category,
          updatedAt: serverTimestamp(),
        })
        this.original = { ...this.original, item: f.item.trim(), price: Math.round(price * 100) / 100, quantity, date: f.date, category: f.category }
        this.showSaveModal = false
        this.saveSuccess = true
        setTimeout(() => this.$router.push('/expenses'), 1200)
      } catch (err) {
        console.error('Failed to update expense:', err)
        this.formError = 'Failed to save. Please try again.'
        this.showSaveModal = false
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.edit-expense-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 780px;
}

/* Back button */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-body);
  cursor: pointer;
  padding: 0;
  width: fit-content;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--accent); }

/* Page header */
.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.page-header-icon {
  width: 44px; height: 44px;
  background: var(--accent-light);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}
.page-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}
.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* Form card */
.edit-form-card {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  padding: 4px 0 16px;
}
.form-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted);
  margin-bottom: 14px;
}

.form-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 8px 0 20px;
}

/* Char count */
.char-count {
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  text-align: right;
  margin-top: 4px;
}

/* Dollar prefix input */
.input-prefix-wrapper {
  position: relative;
}
.input-prefix {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-secondary);
  pointer-events: none;
}
.form-input.has-prefix {
  padding-left: 26px;
}

/* Live total */
.total-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--accent-light);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 8px;
}
.total-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-dark);
}
.total-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent-dark);
  font-family: var(--font-display);
}

/* Changes summary */
.changes-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  border-radius: 10px;
  margin-bottom: 8px;
}
.changes-label {
  font-size: 12px;
  color: #92400E;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
}
.change-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: #FEF3C7;
  color: #92400E;
  font-weight: 500;
}

/* Success box */
.success-box {
  background: var(--accent-light);
  color: var(--accent-dark);
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding-top: 4px;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: auto;
  padding: 11px 22px;
}
.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>