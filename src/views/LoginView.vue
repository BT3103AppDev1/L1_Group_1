<template>
    <div class="login-bg">
      <div class="login-card">
        <div style="text-align:center; margin-bottom:32px;">
          <div class="login-logo">P3</div>
          <div class="login-subtitle">Purchasing Power Pro</div>
        </div>
  
        <div class="login-title">Welcome back</div>
  
        <div v-if="loginError" class="error-box">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ loginError }}
        </div>
  
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="email" type="email" class="form-input" placeholder="you@example.com" @keyup.enter="handleLogin" />
        </div>
  
        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="password" type="password" class="form-input" placeholder="Enter your password" @keyup.enter="handleLogin" />
        </div>
  
        <button class="btn-primary" @click="handleLogin">Sign In</button>
  
        <div style="text-align:center; margin-top:20px; font-size:13px; color:var(--text-secondary);">
          Don't have an account?
          <span class="link" @click="goToRegister">Register</span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { auth } from '../firebase'
  import { signInWithEmailAndPassword } from 'firebase/auth'
  
  export default {
    name: 'LoginView',
    data() {
      return {
        email: '',
        password: '',
        loginError: '',
      }
    },
    methods: {
      goToRegister() {
        this.$router.push('/register')
      },
  
      validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      },
  
      async handleLogin() {
        if (!this.validateEmail(this.email)) {
          this.loginError = 'Please enter a valid email address.'
          return
        }
  
        if (!this.password) {
          this.loginError = 'Please enter your password.'
          return
        }
  
        this.loginError = ''
  
        try {
          await signInWithEmailAndPassword(auth, this.email, this.password)
          this.$router.push('/')
        } catch (err) {
          if (
            err.code === 'auth/user-not-found' ||
            err.code === 'auth/wrong-password' ||
            err.code === 'auth/invalid-credential'
          ) {
            this.loginError = 'Invalid email or password.'
          } else {
            this.loginError = 'Authentication failed. Please try again.'
          }
        }
      },
    },
  }
  </script>
  
  <style scoped>
  .login-bg {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #1A1D23 0%, #2d3748 50%, #1A1D23 100%);
  }
  .login-card {
    background: var(--card); border-radius: 20px; padding: 48px 40px; width: 420px;
    box-shadow: 0 25px 60px rgba(0,0,0,0.3);
    animation: slideUp 0.5s ease forwards;
  }
  .login-logo {
    font-family: var(--font-display); font-size: 28px; font-weight: 700;
    color: var(--accent); letter-spacing: -0.5px; margin-bottom: 4px;
  }
  .login-subtitle {
    font-size: 13px; color: var(--text-secondary); letter-spacing: 2px; text-transform: uppercase;
  }
  .login-title {
    font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 24px;
  }
</style>