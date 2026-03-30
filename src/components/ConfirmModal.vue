<template>
    <teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
      <transition name="modal" appear>
        <div class="modal-box">
            <!-- Icon -->
            <div class="modal-icon" :class="iconClass">
              <!-- Danger: trash / logout -->
              <svg v-if="variant === 'danger'" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              <!-- Warning: save changes -->
              <svg v-else-if="variant === 'warning'" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <!-- Logout -->
              <svg v-else-if="variant === 'logout'" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>
  
            <!-- Text -->
            <h2 class="modal-title">{{ title }}</h2>
            <p class="modal-message">{{ message }}</p>
  
            <!-- Actions -->
            <div class="modal-actions">
              <button class="btn-outline" @click="handleCancel" :disabled="loading">
                {{ cancelLabel }}
              </button>
              <button class="modal-confirm-btn" :class="confirmBtnClass" @click="$emit('confirm')" :disabled="loading">
                <svg v-if="loading" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                {{ loading ? 'Please wait...' : confirmLabel }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </teleport>
  </template>
  
  <script>
  export default {
    name: 'ConfirmModal',
    props: {
      modelValue: { type: Boolean, default: false },   // v-model: show/hide
      variant: { type: String, default: 'danger' },    // 'danger' | 'warning' | 'logout'
      title: { type: String, required: true },
      message: { type: String, required: true },
      confirmLabel: { type: String, default: 'Confirm' },
      cancelLabel: { type: String, default: 'Cancel' },
      loading: { type: Boolean, default: false },
    },
    emits: ['update:modelValue', 'confirm', 'cancel'],
    computed: {
      iconClass() {
        return {
          'icon-danger': this.variant === 'danger',
          'icon-warning': this.variant === 'warning',
          'icon-logout': this.variant === 'logout',
        }
      },
      confirmBtnClass() {
        return {
          'btn-confirm-danger': this.variant === 'danger',
          'btn-confirm-success': this.variant === 'warning',
          'btn-confirm-logout': this.variant === 'logout',
        }
      }
    },
    methods: {
      handleCancel() {
        this.$emit('update:modelValue', false)
        this.$emit('cancel')
      }
    }
  }
  </script>
  
  <style scoped>
  /* Overlay */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }
  
  /* Box */
  .modal-box {
    background: var(--card);
    border-radius: 18px;
    padding: 32px 28px 24px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.18);
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
  }
  
  /* Icon circle */
  .modal-icon {
    width: 52px; height: 52px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 4px;
  }
  .icon-danger  { background: var(--danger-light); color: var(--danger); }
  .icon-warning { background: var(--accent-light); color: var(--accent); }
  .icon-logout  { background: #FEF3C7; color: #D97706; }
  
  /* Text */
  .modal-title {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }
  .modal-message {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.55;
    margin: 0;
  }
  
  /* Actions */
  .modal-actions {
    display: flex;
    gap: 10px;
    width: 100%;
    margin-top: 10px;
  }
  .modal-actions .btn-outline {
    flex: 1;
    padding: 11px;
    text-align: center;
    font-size: 13px;
  }
  .modal-confirm-btn {
    flex: 1;
    padding: 11px;
    border-radius: 10px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-body);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    transition: opacity 0.15s;
  }
  .modal-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  
  .btn-confirm-danger  { background: var(--danger); color: #fff; }
  .btn-confirm-success { background: var(--accent); color: #fff; }
  .btn-confirm-logout  { background: #D97706; color: #fff; }
  
  /* Spinner animation */
  .spinner { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  /* Transition */
  .modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
  .modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }
  </style>