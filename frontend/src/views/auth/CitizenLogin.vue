<template>
  <div class="citizen-login-container">
    <div class="citizen-card">
      <div class="top-nav">
        <router-link to="/login" class="back-link">
          ← Back to Gateway
        </router-link>
        <span class="citizen-badge">👤 CITIZEN ACCESS</span>
      </div>

      <div class="card-header">
        <h2>{{ isRegistering ? 'Create Citizen Profile' : 'Citizen Sign In' }}</h2>
        <p>{{ isRegistering ? 'Register for emergency tracking, family check-in and shelter access.' : 'Access your emergency dashboard and SOS broadcast services.' }}</p>
      </div>

      <div v-if="errorMsg" class="alert-banner error">
        <span>⚠️ {{ errorMsg }}</span>
      </div>
      <div v-if="successMsg" class="alert-banner success">
        <span>✅ {{ successMsg }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- Name field for registration only -->
        <div v-if="isRegistering" class="form-group">
          <label for="citiName">Full Name</label>
          <input
            id="citiName"
            type="text"
            v-model="name"
            placeholder="e.g. Vignesh Kumar"
            class="input-field"
            required
          />
        </div>

        <div class="form-group">
          <label for="citiMobile">Mobile Number</label>
          <div class="input-with-prefix">
            <span class="prefix">🇮🇳 +91</span>
            <input
              id="citiMobile"
              type="tel"
              v-model="mobile"
              placeholder="98765 43210"
              class="input-field-prefixed"
              required
            />
          </div>
          <span class="helper-text">Enter 10-digit mobile number</span>
        </div>

        <div class="form-group">
          <label for="citiPassword">Password</label>
          <input
            id="citiPassword"
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="input-field"
            required
          />
        </div>

        <!-- Registration extras -->
        <div v-if="isRegistering" class="form-group">
          <label for="citiEmergencyContact">Emergency Contact Number (Optional)</label>
          <input
            id="citiEmergencyContact"
            type="tel"
            v-model="emergencyContact"
            placeholder="+91 98765 43299"
            class="input-field"
          />
        </div>

        <div v-if="isRegistering" class="form-group">
          <label for="citiAddress">Residential Address / Zone (Optional)</label>
          <input
            id="citiAddress"
            type="text"
            v-model="address"
            placeholder="e.g. 42 Harbour Road, Sector 4"
            class="input-field"
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">Verifying credentials...</span>
          <span v-else>{{ isRegistering ? '✨ Register Citizen Account' : '🔐 Sign In to Emergency Portal' }}</span>
        </button>
      </form>

      <!-- Toggle between Sign in and Register -->
      <div class="toggle-mode">
        <span v-if="!isRegistering">Need an account? <button class="link-btn" @click="toggleMode">Create Account</button></span>
        <span v-else>Already registered? <button class="link-btn" @click="toggleMode">Sign In</button></span>
      </div>

      <!-- Fast Demo Auto-Fill -->
      <div class="demo-box">
        <span class="demo-label">Demo Citizen Profile:</span>
        <button class="demo-btn" @click="fillDemoCitizen">
          👤 Autofill Demo Citizen (+91 9876543210)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const router = useRouter();
const authStore = useAuthStore();

const isRegistering = ref(false);
const name = ref('');
const mobile = ref('9876543210');
const password = ref('password123');
const emergencyContact = ref('');
const address = ref('');
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

function toggleMode() {
  isRegistering.value = !isRegistering.value;
  errorMsg.value = '';
  successMsg.value = '';
}

function fillDemoCitizen() {
  isRegistering.value = false;
  mobile.value = '9876543210';
  password.value = 'password123';
  errorMsg.value = '';
}

async function handleSubmit() {
  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';

  try {
    const rawMobile = mobile.value.trim();
    const formattedMobile = rawMobile.startsWith('+') ? rawMobile : (rawMobile.startsWith('91') && rawMobile.length === 12 ? `+${rawMobile}` : `+91${rawMobile.replace(/\D/g, '')}`);

    if (isRegistering.value) {
      const res = await api.post('/auth/register', {
        name: name.value.trim(),
        mobileNumber: formattedMobile,
        password: password.value,
        role: 'CITIZEN',
        address: address.value.trim() || undefined,
        emergencyContact: emergencyContact.value.trim() || undefined
      });
      authStore.setUser(res.data.data.user, res.data.data.token);
      router.push('/citizen');
    } else {
      const res = await api.post('/auth/login', {
        mobileNumber: formattedMobile,
        password: password.value
      });
      authStore.setUser(res.data.data.user, res.data.data.token);
      router.push('/citizen');
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Authentication failed. Please verify your mobile number and password.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.citizen-login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 1.5rem;
}

.citizen-card {
  width: 100%;
  max-width: 440px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(16, 185, 129, 0.4);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.1);
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-link {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.8rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: #38bdf8;
}

.citizen-badge {
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
}

.card-header h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0 0 0.25rem 0;
}

.card-header p {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
}

.alert-banner {
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.775rem;
}

.alert-banner.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.alert-banner.success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.775rem;
  font-weight: 600;
  color: #cbd5e1;
}

.input-field {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-field:focus {
  border-color: #10b981;
}

.input-with-prefix {
  display: flex;
  align-items: center;
  background: #090e1a;
  border: 1px solid #334155;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.input-with-prefix:focus-within {
  border-color: #10b981;
}

.prefix {
  padding: 0.65rem 0.75rem;
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
  font-size: 0.8rem;
  font-family: var(--font-mono);
  border-right: 1px solid #334155;
}

.input-field-prefixed {
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
  outline: none;
  font-family: var(--font-mono);
}

.helper-text {
  font-size: 0.7rem;
  color: #64748b;
}

.submit-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-mode {
  text-align: center;
  font-size: 0.8rem;
  color: #94a3b8;
}

.link-btn {
  background: none;
  border: none;
  color: #34d399;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0 0.25rem;
}

.demo-box {
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.demo-label {
  font-size: 0.7rem;
  color: #64748b;
  font-family: var(--font-mono);
}

.demo-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #a7f3d0;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.demo-btn:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: #10b981;
}
</style>
