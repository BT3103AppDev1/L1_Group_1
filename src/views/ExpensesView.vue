<template>
  <div class="flex-col">
    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      variant="danger"
      title="Delete Expense"
      message="This expense will be permanently removed. This action cannot be undone."
      confirmLabel="Delete"
      cancelLabel="Cancel"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
    <!-- Header -->
    <div class="flex-between">
      <div class="fs-12 text-secondary">
        {{ expenses.length }} items logged · Total: ${{ expenseTotal }}
      </div>
      <button class="btn-accent-flex" @click="openNewForm">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 4v16m8-8H4"/></svg>
        Log Expense
      </button>
    </div>

    <!-- Add / Edit Form -->
    <div v-if="showForm" class="card card-accent">
      <div class="fs-15 fw-600 mb-16">{{ editingId ? 'Edit Expense' : 'Log New Expense' }}</div>
      <div v-if="formError" class="error-box" style="font-size:12px; padding:8px 12px; border-radius:8px;">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ formError }}
      </div>
      <div class="grid-3 mb-12">
        <div>
          <label class="form-label-sm">Item Name *</label>
          <input v-model="form.item" class="form-input-sm" placeholder="e.g. Rice (5kg)" />
        </div>
        <div>
          <label class="form-label-sm">Unit Price ($) *</label>
          <input v-model="form.price" type="number" step="0.01" min="0.01" max="999999.99" class="form-input-sm" placeholder="0.00" />
        </div>
        <div>
          <label class="form-label-sm">Quantity</label>
          <input v-model="form.quantity" type="number" min="1" class="form-input-sm" />
        </div>
      </div>
      <div class="grid-3 mb-16">
        <div>
          <label class="form-label-sm">Date *</label>
          <input v-model="form.date" type="date" class="form-input-sm" />
        </div>
        <div>
          <label class="form-label-sm">Category *</label>
          <select v-model="form.category" class="form-input-sm" style="cursor:pointer;">
            <option value="">Select category</option>
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
        <div style="display:flex; align-items:flex-end; gap:8px;">
          <button class="btn-sm" style="flex:1;" @click="submitExpense" :disabled="submitting">
            {{ submitting ? 'Saving...' : (editingId ? 'Update' : 'Add') }}
          </button>
          <button class="btn-outline" @click="closeForm">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Filter Tabs (FR-04) -->
    <div style="display:flex; gap:6px; flex-wrap:wrap;">
      <button v-for="c in ['All', ...CATEGORIES]" :key="c"
        class="filter-btn" :class="{ active: filterCat === c }"
        @click="filterCat = c">
        {{ c }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card" style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
      Loading expenses...
    </div>

    <!-- Expenses Table -->
    <div v-else class="card">
      <table>
        <thead>
          <tr><th>Item</th><th>Category</th><th>Date</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr v-for="exp in filteredExpenses" :key="exp.id">
            <td style="font-weight:500;">{{ exp.item }}</td>
            <td><span class="category-tag">{{ exp.category }}</span></td>
            <td class="text-secondary">{{ exp.date }}</td>
            <td class="text-secondary">{{ exp.quantity }}</td>
            <td>${{ exp.price.toFixed(2) }}</td>
            <td style="font-weight:600;">${{ (exp.price * exp.quantity).toFixed(2) }}</td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn-icon" style="color:var(--text-secondary);" @click="$router.push(`/expenses/${exp.id}/edit`)">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button class="btn-icon" style="color:var(--danger);" @click="deleteExpense(exp.id)">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredExpenses.length === 0" style="text-align:center; padding:40px; color:var(--text-muted); font-size:13px;">
        No expenses found for this category.
      </div>
    </div>
  </div>
</template>

<script>
import ConfirmModal from '../components/ConfirmModal.vue'
import { db, auth } from '../firebase'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'

// 8 predefined CPI-aligned categories (FR-04)
const CATEGORIES = [
  'Food', 'Housing', 'Transport', 'Healthcare',
  'Education', 'Recreation', 'Clothing', 'Communication'
]

export default {
  name: 'ExpensesView',
  components: { ConfirmModal },
  data() {
    return {
      CATEGORIES,
      expenses: [],
      loading: true,
      submitting: false,
      showForm: false,
      editingId: null,
      form: { item: '', price: '', quantity: '1', date: '', category: '' },
      formError: '',
      filterCat: 'All',
      unsubscribe: null,
      showDeleteModal: false,
      pendingDeleteId: null,
      deleting: false,
    }
  },

  computed: {
    expenseTotal() {
      return this.expenses.reduce((s, e) => s + e.price * e.quantity, 0).toFixed(2)
    },
    filteredExpenses() {
      return this.filterCat === 'All'
        ? this.expenses
        : this.expenses.filter(e => e.category === this.filterCat)
    },
  },

  mounted() {
    this.listenToExpenses()
  },

  beforeUnmount() {
    // Clean up Firestore listener when leaving page
    if (this.unsubscribe) {
      this.unsubscribe()
    }
  },

  methods: {
    // ─── Firestore: Real-time listener ─────────────────────────
    listenToExpenses() {
      const uid = auth.currentUser.uid
      const expensesRef = collection(db, 'users', uid, 'expenses')
      const q = query(expensesRef, orderBy('date', 'desc'))

      this.unsubscribe = onSnapshot(q, (snapshot) => {
        this.expenses = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }))
        this.loading = false
      }, (error) => {
        console.error('Error listening to expenses:', error)
        this.loading = false
      })
    },

    // ─── Firestore: Add new expense ────────────────────────────
    async addExpenseToFirestore(expenseData) {
      const uid = auth.currentUser.uid
      const expensesRef = collection(db, 'users', uid, 'expenses')
      await addDoc(expensesRef, {
        ...expenseData,
        createdAt: serverTimestamp()
      })
    },

    // ─── Firestore: Update existing expense ────────────────────
    async updateExpenseInFirestore(expenseId, expenseData) {
      const uid = auth.currentUser.uid
      const expenseRef = doc(db, 'users', uid, 'expenses', expenseId)
      await updateDoc(expenseRef, {
        ...expenseData,
        updatedAt: serverTimestamp()
      })
    },

    // ─── Firestore: Delete expense ─────────────────────────────
    async deleteExpenseFromFirestore(expenseId) {
      const uid = auth.currentUser.uid
      const expenseRef = doc(db, 'users', uid, 'expenses', expenseId)
      await deleteDoc(expenseRef)
    },

    // ─── Form handlers ─────────────────────────────────────────
    openNewForm() {
      this.editingId = null
      this.form = { item: '', price: '', quantity: '1', date: '', category: '' }
      this.formError = ''
      this.showForm = true
    },

    closeForm() {
      this.showForm = false
      this.editingId = null
      this.formError = ''
    },

    async submitExpense() {
      // ── Validation (FR-03 AC2) ──
      const f = this.form

      if (!f.item || !f.price || !f.date || !f.category) {
        this.formError = 'All fields are required.'
        return
      }
      // Item name: alphanumeric up to 100 chars
      if (f.item.length > 100) {
        this.formError = 'Item name must be 100 characters or less.'
        return
      }
      // Price: positive, 2 decimal places, between 0.01 and 999999.99
      const price = parseFloat(f.price)
      if (isNaN(price) || price < 0.01 || price > 999999.99) {
        this.formError = 'Price must be between $0.01 and $999,999.99.'
        return
      }
      // Quantity: positive integer
      const quantity = parseInt(f.quantity)
      if (isNaN(quantity) || quantity < 1) {
        this.formError = 'Quantity must be at least 1.'
        return
      }
      // Date: no future dates
      if (new Date(f.date) > new Date()) {
        this.formError = 'Date cannot be in the future.'
        return
      }
      // Category: must be one of the 8 predefined
      if (!CATEGORIES.includes(f.category)) {
        this.formError = 'Please select a valid category.'
        return
      }

      this.formError = ''
      this.submitting = true

      const expenseData = {
        item: f.item.trim(),
        price: Math.round(price * 100) / 100,  // ensure 2 decimal places
        quantity,
        date: f.date,
        category: f.category
      }

      try {
        if (this.editingId) {
          await this.updateExpenseInFirestore(this.editingId, expenseData)
        } else {
          await this.addExpenseToFirestore(expenseData)
        }
        this.closeForm()
      } catch (error) {
        console.error('Error saving expense:', error)
        this.formError = 'Failed to save. Please try again.'
        // Form retains data so user can retry (NFR-09 AC2)
      } finally {
        this.submitting = false
      }
    },

    editExpense(exp) {
      this.form = {
        item: exp.item,
        price: String(exp.price),
        quantity: String(exp.quantity),
        date: exp.date,
        category: exp.category
      }
      this.editingId = exp.id
      this.showForm = true
    },

    deleteExpense(id) {
      this.pendingDeleteId = id
      this.showDeleteModal = true
    },

    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteExpenseFromFirestore(this.pendingDeleteId)
        this.showDeleteModal = false
        this.pendingDeleteId = null
      } catch (error) {
        console.error('Error deleting expense:', error)
        alert('Failed to delete expense. Please try again.')
      } finally {
        this.deleting = false
      }
    },
  },
}
</script>