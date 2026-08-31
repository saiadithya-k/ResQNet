<template>
  <div class="ops-login-container">
    <div class="ops-card">
      <div class="top-nav">
        <router-link to="/login" class="back-link">
          ← Back to Gateway
        </router-link>
        <span class="ops-badge"> OPERATIONS & COMMAND</span>
      </div>

      <div class="card-header">
        <h2>Tactical Operations Login</h2>
        <p>Restricted access for Emergency Dispatchers, Tactical Commanders, Field Responders, and Hospital Staff.</p>
      </div>

      <div v-if="errorMsg" class="alert-banner error">
        <span>{{ errorMsg }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="opsMobile">Registered Mobile Number / Call Sign</label>
          <div class="input-with-prefix">
            <span class="prefix"> +91</span>
            <input
              id="opsMobile"
              type="tel"
              v-model="mobile"
              placeholder="98765 43211"
              class="input-field-prefixed"
              required
            />
          </div>
          <span class="helper-text">Enter your 10-digit registered staff mobile</span>
        </div>

        <div class="form-group">
          <label for="opsPassword">Security Key / Password</label>
          <input
            id="opsPassword"
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="input-field"
            required
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading">Verifying clearance credentials...</span>
          <span v-else> Authenticate & Enter Tactical Console</span>
        </button>
      </form>

      <!-- Fast Demo Profile Quick-Select -->
      <div class="demo-box">
        <span class="demo-label"> Fast Demo Staff Profiles:</span>
        <div class="role-grid">
          <button class="role-chip admin" @click="fillDemo('9876543211')">
            <span class="chip-icon"></span>
            <div class="chip-text">
              <strong>Admin</strong>
              <small>+91 9876543211</small>
            </div>
          </button>

          <button class="role-chip disp" @click="fillDemo('9876543212')">
            <span class="chip-icon">️</span>
            <div class="chip-text">
              <strong>Dispatcher</strong>
              <small>+91 9876543212</small>
            </div>
          </button>

          <button class="role-chip resp" @click="fillDemo('9876543213')">
            <span class="chip-icon"></span>
            <div class="chip-text">
              <strong>Paramedic</strong>
              <small>+91 9876543213</small>
            </div>
          </button>

          <button class="role-chip comm" @click="fillDemo('9876543214')">
            <span class="chip-icon"></span>
            <div class="chip-text">
              <strong>Community</strong>
              <small>+91 9876543214</small>
            </div>
          </button>

          <button class="role-chip hosp" @click="fillDemo('9876543215')">
            <span class="chip-icon"></span>
            <div class="chip-text">
              <strong>Hospital</strong>
              <small>+91 9876543215</small>
            </div>
          </button>
        </div>
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

const mobile = ref('9876543211');
const password = ref('password123');
const loading = ref(false);
const errorMsg = ref('');

function fillDemo(num) {
  mobile.value = num;
  password.value = 'password123';
  errorMsg.value = '';
}

async function handleSubmit() {
  loading.value = true;
  errorMsg.value = '';

  try {
    const rawMobile = mobile.value.trim();
    const formattedMobile = rawMobile.startsWith('+') ? rawMobile : (rawMobile.startsWith('91') && rawMobile.length === 12 ? `+${rawMobile}` : `+91${rawMobile.replace(/\D/g, '')}`);

    const res = await api.post('/auth/login', {
      mobileNumber: formattedMobile,
      password: password.value
    });

    const user = res.data.data.user;
    const token = res.data.data.token;
    authStore.setUser(user, token);

    // Server-enforced role routing
    if (user.role === 'RESPONDER') {
      router.push('/responder');
    } else if (user.role === 'COMMUNITY_RESPONDER') {
      router.push('/community');
    } else if (user.role === 'HOSPITAL') {
      router.push('/hospital');
    } else if (user.role === 'CITIZEN') {
      router.push('/citizen');
    } else {
      // ADMIN or DISPATCHER
      router.push('/admin/command');
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Authentication failed. Please check your credentials and clearance level.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ops-login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 120px);
  padding: 1.5rem;
}

.ops-card {
  width: 100%;
  max-width: 480px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(59, 130, 246, 0.4);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(59, 130, 246, 0.15);
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

  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}

.back-link:hover {
  color: #38bdf8;
}

.ops-badge {
  font-size: 0.7rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
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
  border-color: #3b82f6;
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
  border-color: #3b82f6;
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
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
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
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-box {
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  padding-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.demo-label {
  font-size: 0.7rem;
  color: #64748b;
  font-family: var(--font-mono);
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.4rem;
}

.role-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.7);
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.role-chip:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  transform: translateY(-1px);
}

.chip-icon {
  font-size: 1.1rem;
}

.chip-text {
  display: flex;
  flex-direction: column;
}

.chip-text strong {
  font-size: 0.725rem;
  color: #f8fafc;
}

.chip-text small {
  font-size: 0.625rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}
</style>
