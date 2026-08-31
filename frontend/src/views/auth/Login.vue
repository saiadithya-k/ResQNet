<template>
  <div class="login-container">
    <div class="tactical-card login-box">
      <div class="login-header">
        <span class="logo-badge">🚨</span>
        <h2>ResQNet Access Control</h2>
        <p>AI Emergency Intelligence & Coordination Platform</p>
      </div>

      <div v-if="errorMsg" class="login-err-banner">
        <span>{{ errorMsg }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div>
          <label for="loginEmail">Email Address / Call Sign:</label>
          <input id="loginEmail" type="email" v-model="email" class="form-input" required />
        </div>
        <div>
          <label for="loginPassword">Authentication Key / Password:</label>
          <input id="loginPassword" type="password" v-model="password" class="form-input" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading">Verifying credentials...</span>
          <span v-else> Authenticate & Enter Portal</span>
        </button>
      </form>

      <!-- Quick Role Auto-Fill for Testing -->
      <div class="demo-logins">
        <span class="demo-tag">Fast Demo Login Profiles:</span>
        <div class="role-pills">
          <button @click="fillLogin('admin@resqnet.org')"> Admin</button>
          <button @click="fillLogin('responder@resqnet.org')"> Responder</button>
          <button @click="fillLogin('hospital@resqnet.org')"> Hospital</button>
          <button @click="fillLogin('citizen@resqnet.org')"> Citizen</button>
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

const email = ref('citizen@resqnet.org');
const password = ref('password123');
const loading = ref(false);
const errorMsg = ref('');

function fillLogin(em) {
  email.value = em;
  password.value = 'password123';
  errorMsg.value = '';
}

async function handleLogin() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await api.post('/auth/login', { email: email.value, password: password.value });
    const user = res.data.data.user;
    const token = res.data.data.token;
    authStore.setUser(user, token);

    // Dynamic routing by role
    if (user.role === 'CITIZEN') {
      router.push('/citizen');
    } else if (user.role === 'RESPONDER') {
      router.push('/responder');
    } else if (user.role === 'HOSPITAL') {
      router.push('/hospital');
    } else {
      router.push('/admin/command');
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Invalid credentials. Please verify email and password.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 120px);
}

.login-box {
  width: 400px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-header {
  text-align: center;
}

.logo-badge {
  font-size: 2.5rem;
}

.login-header h2 {
  font-size: 1.25rem;
  color: #f8fafc;
  margin-top: 0.5rem;
}

.login-header p {
  font-size: 0.75rem;
  color: #94a3b8;
}

.login-err-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.8rem;
}

.form-input {
  width: 100%;
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.6rem;
  border-radius: 6px;
  margin-top: 0.25rem;
}

.btn-block {
  width: 100%;
  padding: 0.75rem;
}

.demo-logins {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid rgba(51, 65, 85, 0.6);
  padding-top: 0.75rem;
}

.demo-tag {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.role-pills {
  display: flex;
  gap: 0.35rem;
}

.role-pills button {
  background: #1e293b;
  border: 1px solid #334155;
  color: #cbd5e1;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
}

.role-pills button:hover {
  border-color: #3b82f6;
  color: #60a5fa;
}
</style>
