<template>
  <!-- Full-page centered login layout -->
  <div class="login-bg">
    <div class="login-card">
      <!-- App branding -->
      <div style="text-align:center; margin-bottom:32px;">
        <div class="login-logo">P3</div>
        <div class="login-subtitle">Purchasing Power Pro</div>
      </div>

      <div class="login-title">Welcome back</div>

       <!-- Inline error message shown on failed login or validation -->
      <div v-if="loginError" class="error-box">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ loginError }}
      </div>

      <!-- Email and password fields — Enter key triggers login on both -->
      <div class="form-group">
        <label class="form-label">Email</label>
        <input v-model="email" type="email" class="form-input" placeholder="you@example.com" @keyup.enter="handleLogin" />
      </div>

      <div class="form-group">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-input" placeholder="Enter your password" @keyup.enter="handleLogin" />
      </div>

      <button class="btn-primary" @click="handleLogin">Sign In</button>

      <!-- Divider -->
      <div class="or-divider">
        <span class="or-line"></span>
        <span class="or-text">or</span>
        <span class="or-line"></span>
      </div>

      <!-- Google Sign-In Button -->
      <button class="btn-google" @click="handleGoogleLogin">
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.09 29.53 1 24 1 14.82 1 7.01 6.48 3.58 14.18l7.08 5.5C12.38 13.36 17.72 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.7c-.55 2.96-2.2 5.47-4.68 7.15l7.18 5.57C43.35 37.27 46.52 31.36 46.52 24.5z"/>
          <path fill="#FBBC05" d="M10.66 28.32A14.6 14.6 0 0 1 9.5 24c0-1.5.26-2.95.72-4.32l-7.08-5.5A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.57 10.77l8.09-6.45z"/>
          <path fill="#34A853" d="M24 47c5.53 0 10.17-1.83 13.56-4.97l-7.18-5.57C28.6 38.1 26.43 38.75 24 38.75c-6.28 0-11.62-3.86-13.34-9.18l-8.09 6.45C6.01 43.52 14.41 47 24 47z"/>
        </svg>
        Sign in with Google
      </button>

      <!-- Registration link -->
      <div style="text-align:center; margin-top:20px; font-size:13px; color:var(--text-secondary);">
        Don't have an account?
        <span class="link" @click="goToRegister">Register</span>
      </div>
    </div>
  </div>
</template>
  
  <script>
  import { auth } from '../firebase'
  import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
  
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
  
      // Basic regex check — Firebase does deeper validation server-side
      validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      },
  
      // Handle email + password login and potential errors
      async handleLogin() {
        // Client-side validation before hitting Firebase
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
        // Consolidate credential errors into a single vague message to avoid exposing whether the email exists
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

      // Handle google login and potential errors
      async handleGoogleLogin() {
        this.loginError = ''
        try {
          const provider = new GoogleAuthProvider()
          await signInWithPopup(auth, provider)
          this.$router.push('/')
        } catch (err) {
          this.loginError = 'Google sign-in failed. Please try again.'
        }
      },
    },
  }
  </script>
  
  <style scoped>
  /* Full-page gradient background */
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
  .or-divider {
    display: flex; align-items: center; gap: 12px; margin: 20px 0;
  }
  .or-line {
    flex: 1; height: 1px; background: var(--border, rgba(255,255,255,0.1));
  }
  .or-text {
    font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;
  }
  .btn-google {
    width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 500;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
    background: transparent; color: var(--text);
    border: 1px solid rgba(255,255,255,0.15);
    transition: background 0.2s, border-color 0.2s;
  }
  .btn-google:hover { background: rgba(255,0,0,0.05); border-color: rgba(255,0,0,0.1); }
</style>