<template>
  <div class="register-bg">
    <div class="register-card">
      <div class="mb-20">
        <div class="register-logo">P3</div>
        <div class="register-subtitle">Purchasing Power Pro</div>
      </div>

      <div class="register-title">Create Account</div>

      <div v-if="errors.general" class="error-box">
        <span>{{ errors.general }}</span>
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="you@example.com"
            required
          />
          <span v-if="errors.email" class="text-danger fs-12 mt-4" style="display:block">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Min 8 chars, 1 upper, 1 lower, 1 number/symbol"
            required
          />
          <span v-if="errors.password" class="text-danger fs-12 mt-4" style="display:block">{{ errors.password }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            class="form-input"
            placeholder="Re-enter password"
            required
          />
          <span v-if="errors.confirmPassword" class="text-danger fs-12 mt-4" style="display:block">{{ errors.confirmPassword }}</span>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading" style="margin-top:8px">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p class="register-footer">
        Already have an account? <router-link to="/login" class="link">Log in</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  general: ''
})

function clearErrors() {
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.general = ''
}

function validate() {
  clearErrors()
  let valid = true

  if (!email.value.trim()) {
    errors.email = 'Email is required.'
    valid = false
  }

  if (!password.value) {
    errors.password = 'Password is required.'
    valid = false
  } else if (password.value.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
    valid = false
  } else if (!/[A-Z]/.test(password.value)) {
    errors.password = 'Password must contain at least one uppercase letter.'
    valid = false
  } else if (!/[a-z]/.test(password.value)) {
    errors.password = 'Password must contain at least one lowercase letter.'
    valid = false
  } else if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password.value)) {
    errors.password = 'Password must contain at least one number or symbol.'
    valid = false
  }

  if (password.value !== confirmPassword.value) {
    errors.confirmPassword = 'Passwords do not match.'
    valid = false
  }

  return valid
}

async function handleRegister() {
  if (!validate()) return

  loading.value = true
  clearErrors()

  try {
    await createUserWithEmailAndPassword(auth, email.value.trim(), password.value)
    await auth.signOut()
    router.push('/login')
  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        errors.email = 'This email is already registered.'
        break
      case 'auth/invalid-email':
        errors.email = 'Invalid email format.'
        break
      case 'auth/weak-password':
        errors.password = 'Password must be at least 8 characters.'
        break
      default:
        errors.general = 'Registration failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-bg {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1A1D23 0%, #2d3748 50%, #1A1D23 100%);
}
.register-card {
  background: var(--card); border-radius: 20px; padding: 48px 40px; width: 420px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.5s ease forwards;
}
.register-logo {
  font-family: var(--font-display); font-size: 28px; font-weight: 700;
  color: var(--accent); letter-spacing: -0.5px; margin-bottom: 4px;
}
.register-subtitle {
  font-size: 13px; color: var(--text-secondary); letter-spacing: 2px; text-transform: uppercase;
}
.register-title {
  font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 24px;
}
.register-footer {
  text-align: center; margin-top: 24px; font-size: 13px; color: var(--text-secondary);
}
.btn-primary:disabled {
  opacity: 0.6; cursor: not-allowed;
}
</style>