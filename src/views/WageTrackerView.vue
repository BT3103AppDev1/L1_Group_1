<template>
    <div class="wage-tracker-view">
        <h1>Wage Tracker</h1>
        <p>This is where you can track your wages and hours worked.</p>
        <form @submit.prevent="submitWageEntry">
            <div>
                <label>Amount (SGD)</label>
                <input v-model.number = "form.amount" type="number" placeholder="e.g. 3000" required />
                <span v-if="errors.amount" class="error">{{ errors.amount }}</span>
            </div>
            <div>
                <label>Effective Date</label>
                <input v-model="form.effectiveDate" type="text" placeholder="DD/MM/YYY" maxlength="10" />
                <span v-if="errors.effectiveDate" class="error">{{ errors.effectiveDate }}</span>
            </div>
            <button type="submit">Save Wage</button>
        </form>

        <h2>Wage History</h2>
        <table v-if="wages.length">
            <thead>
                <tr>
                    <th>Effective Date</th>
                    <th>Amount (SGD)</th>
                    <th>% Change</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(wage, i) in wages" :key="wage.id">
                    <td>{{ wage.effectiveDate }}</td>
                    <td>{{ wage.amount }}</td>
                    <td>{{ calcChange(i) }}</td>
                </tr>
            </tbody>
        </table>
        <p v-else>No wage entries yet.</p>
    </div>
</template>\

<script>
import { db } from '@/firebase'
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore'

export default {
    name: 'WageTrackerView',
    data() {
        return {
            form: {
                amount: null,
                effectiveDate: ''
            },
            errors: {},
            wages: []
        }
    },
    mounted() {
        this.fetchWages()
    },
    methods: {
        validate() {
            this.errors = {}
            if (!this.form.amount || this.form.amount === '') {
                this.errors.amount = 'Amount is required.'
            } else if (isNaN(this.form.amount) || Number(this.form.amount) <= 0) {
                this.errors.amount = 'Amount must be a positive number.'
            }

            if (!this.form.effectiveDate) {
                this.errors.effectiveDate = 'Effective date is required.'
            } else {
                const datePattern = /^\d{2}-\d{2}-\d{4}$/
                const match = this.form.effectiveDate.match(datePattern)
                if (!match) {
                    this.errors.effectiveDate = 'Date must be in DD-MM-YYYY format.'
                } else {
                    const [dd, mm, yyyy] = match
                    const date = new Date(`${yyyy}-${mm}-${dd}`)
                    const isValid = 
                        date instanceof Date &&
                        !isNaN(date) &&
                        date.getDate() === Number(dd) &&
                        date.getMonth() + 1 === Number(mm) &&
                        date.getFullYear() === Number(yyyy)
                    if (!isValid) {
                        this.errors.effectiveDate = 'Please enter a real calendar date (eg. 31-04-2024 is invalid).'
                    }
                }
            }
            return Object.keys(this.errors).length === 0
        },

        async submitWageEntry() {
            if (!this.validate()) return
            const [dd, mm, yyyy] = this.form.effectiveDate.split('/')
            const isoDate = `${yyyy}-${mm}-${dd}`

            const user = this.$store.state.user
            await addDoc(collection(db, 'wages'), {
                amount: Number(this.form.amount),
                effectiveDate: isoDate,
                effectiveDateDisplay: this.form.effectiveDate,
                userId: user?.uid,
                createdAt: serverTimestamp()
            })
            this.form = { amount: null, effectiveDate: '' }
        },
        async fetchWages() {
            const q = query(collection(db, 'wages'), orderBy('effectiveDate', 'asc'))
            const querySnapshot = await getDocs(q)
            this.wages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        },
        calcChange(index) {
            if (index === 0) return '-'
            const current = this.wages[index].amount
            const previous = this.wages[index - 1].amount
            const pct = (((current - previous) / previous) * 100).toFixed(2)
            return pct > 0 ? `+${pct}%` : `${pct}%`
        }
    }
}
</script>