<template>
  <div class="citizen-profile-view">
    <!-- Header -->
    <div class="header-card tactical-card">
      <div class="header-left">
        <router-link to="/citizen" class="back-link">← Back to Portal</router-link>
        <h2>👤 CITIZEN PROFILE & EMERGENCY DIRECTORY</h2>
        <p>Personal crisis identifiers, emergency triage medical data, and trusted contacts directory.</p>
      </div>

      <div class="header-actions">
        <button
          v-if="!isEditing"
          type="button"
          class="btn btn-primary btn-sm"
          @click="startEditing"
        >
          ✏️ Edit Profile
        </button>
        <div v-else class="edit-btn-group">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            @click="saveProfile"
            :disabled="saving"
          >
            <span v-if="saving" class="spinner-sm"></span>
            <span>{{ saving ? 'Saving...' : '💾 Save Profile' }}</span>
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="cancelEditing"
            :disabled="saving"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Success Feedback Alert -->
    <div v-if="successMessage" class="tactical-card success-banner">
      <span>✅ {{ successMessage }}</span>
      <button class="btn btn-xs btn-ghost" @click="successMessage = ''">Dismiss</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="tactical-card state-panel">
      <div class="spinner-sm"></div>
      <span>LOADING CITIZEN PROFILE & DIRECTORY...</span>
    </div>

    <!-- Main Grid -->
    <div v-else class="profile-grid">
      <!-- Left Column: Personal & Medical Identifiers -->
      <div class="left-col">
        <!-- 1. Citizen Identity Card -->
        <div class="tactical-card card-panel">
          <div class="section-title">
            <span>OFFICIAL CITIZEN IDENTIFIERS</span>
            <span class="sec-subtitle font-mono">{{ profile.id || 'CIT-9802' }}</span>
          </div>

          <div class="fields-list">
            <!-- Full Name -->
            <div class="field-item">
              <label class="field-lbl">FULL NAME</label>
              <input
                v-if="isEditing"
                type="text"
                v-model="editForm.name"
                class="form-input"
                required
              />
              <strong v-else class="field-val">{{ profile.name }}</strong>
            </div>

            <!-- Phone Number -->
            <div class="field-item">
              <label class="field-lbl">PRIMARY MOBILE</label>
              <input
                v-if="isEditing"
                type="text"
                v-model="editForm.phone"
                class="form-input"
                required
              />
              <span v-else class="field-val font-mono">{{ profile.phone }}</span>
            </div>

            <!-- Email Address -->
            <div class="field-item">
              <label class="field-lbl">EMAIL ADDRESS</label>
              <input
                v-if="isEditing"
                type="email"
                v-model="editForm.email"
                class="form-input"
              />
              <span v-else class="field-val">{{ profile.email }}</span>
            </div>

            <!-- Residential Address -->
            <div class="field-item full">
              <label class="field-lbl">REGISTERED RESIDENCE / SECTOR</label>
              <textarea
                v-if="isEditing"
                v-model="editForm.address"
                class="form-input textarea"
                rows="2"
              ></textarea>
              <span v-else class="field-val">{{ profile.address }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Medical & Crisis Triage Identifiers -->
        <div class="tactical-card card-panel">
          <div class="section-title">
            <span>TRIAGE & MEDICAL DIRECTIVES</span>
            <span class="sec-subtitle">Visible to First Responders</span>
          </div>

          <div class="fields-list">
            <!-- Blood Group -->
            <div class="field-item">
              <label class="field-lbl">BLOOD GROUP</label>
              <select v-if="isEditing" v-model="editForm.bloodGroup" class="form-input">
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <span v-else class="blood-badge font-mono">{{ profile.bloodGroup || 'O+' }}</span>
            </div>

            <!-- Language Preference -->
            <div class="field-item">
              <label class="field-lbl">LANGUAGE PREFERENCE</label>
              <input
                v-if="isEditing"
                type="text"
                v-model="editForm.language"
                class="form-input"
              />
              <span v-else class="field-val">{{ profile.language || 'Tamil & English' }}</span>
            </div>

            <!-- Medical Conditions / Allergies -->
            <div class="field-item full">
              <label class="field-lbl">MEDICAL CONDITIONS & KNOWN ALLERGIES</label>
              <textarea
                v-if="isEditing"
                v-model="editForm.medicalNotes"
                class="form-input textarea"
                rows="2"
                placeholder="e.g. Asthmatic, Penicillin allergy..."
              ></textarea>
              <p v-else class="medical-notes-box">
                {{ profile.medicalNotes || 'No specific medical conditions recorded.' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Emergency Contacts & Notifications -->
      <div class="right-col">
        <!-- 1. Emergency Contacts Section -->
        <div class="tactical-card card-panel">
          <div class="section-title">
            <span>EMERGENCY CONTACTS ({{ contactsList.length }})</span>
            <button
              v-if="!showAddContactForm"
              type="button"
              class="btn-link font-mono"
              @click="showAddContactForm = true"
            >
              + Add Contact
            </button>
          </div>

          <!-- Add Contact Form -->
          <div v-if="showAddContactForm" class="add-contact-card">
            <h4 class="form-title">Add Emergency Contact</h4>
            <div class="form-group-sm">
              <input
                type="text"
                v-model="newContact.name"
                class="form-input"
                placeholder="Contact Name (e.g. Ramesh Sundaram)"
                required
              />
            </div>
            <div class="form-row-sm">
              <input
                type="text"
                v-model="newContact.relationship"
                class="form-input"
                placeholder="Relationship (e.g. Father, Physician)"
              />
              <input
                type="text"
                v-model="newContact.phone"
                class="form-input font-mono"
                placeholder="Phone (+91 98401...)"
                required
              />
            </div>
            <div class="contact-actions-sm">
              <button
                type="button"
                class="btn btn-primary btn-xs"
                @click="addContact"
                :disabled="addingContact || !newContact.name || !newContact.phone"
              >
                {{ addingContact ? 'Saving...' : 'Add Contact' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                @click="showAddContactForm = false"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Contacts List -->
          <div v-if="contactsList.length === 0" class="empty-contacts">
            <span>No emergency contacts registered.</span>
          </div>

          <div v-else class="contacts-list">
            <div
              v-for="c in contactsList"
              :key="c.id"
              class="contact-item"
            >
              <div class="contact-left">
                <div class="contact-title-row">
                  <strong>{{ c.name }}</strong>
                  <span v-if="c.isPrimary" class="primary-tag font-mono">PRIMARY</span>
                </div>
                <div class="contact-sub font-mono">
                  <span>{{ c.relationship }}</span> · <span>{{ c.phone }}</span>
                </div>
              </div>

              <button
                type="button"
                class="btn-delete-contact"
                title="Remove Contact"
                @click="deleteContact(c.id)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Citizen System Notifications -->
        <div class="tactical-card card-panel">
          <div class="section-title">
            <span>SYSTEM NOTIFICATIONS ({{ unreadCount }} Unread)</span>
            <button
              v-if="unreadCount > 0"
              type="button"
              class="btn-link font-mono"
              @click="markAllRead"
            >
              Mark All Read
            </button>
          </div>

          <div v-if="notifications.length === 0" class="empty-notifs">
            <span>No notifications received.</span>
          </div>

          <div v-else class="notifs-list">
            <div
              v-for="n in notifications"
              :key="n.id"
              :class="['notif-item', { unread: !n.read }]"
              @click="markAsRead(n.id)"
            >
              <div class="notif-top">
                <div class="notif-cat-row">
                  <span class="notif-icon">{{ getNotificationIcon(n.category) }}</span>
                  <strong class="notif-title">{{ n.title }}</strong>
                </div>
                <span class="notif-time font-mono">{{ n.time }}</span>
              </div>
              <p class="notif-msg">{{ n.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';

const authStore = useAuthStore();

const profile = ref({});
const editForm = ref({});
const isEditing = ref(false);
const loading = ref(true);
const saving = ref(false);
const successMessage = ref('');

const showAddContactForm = ref(false);
const addingContact = ref(false);
const newContact = ref({
  name: '',
  relationship: '',
  phone: '',
  isPrimary: false
});

const notifications = ref([]);

const contactsList = computed(() => {
  return profile.value.emergencyContacts || [];
});

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

async function loadProfileAndData() {
  loading.value = true;
  try {
    const [profRes, notifRes] = await Promise.all([
      api.get('/citizens/profile'),
      api.get('/citizens/notifications')
    ]);

    if (profRes.data?.data) {
      profile.value = profRes.data.data;
    }
    if (notifRes.data?.data) {
      notifications.value = notifRes.data.data;
    }
  } catch (err) {
    console.error('Failed to load profile details', err);
  } finally {
    loading.value = false;
  }
}

function startEditing() {
  editForm.value = { ...profile.value };
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

async function saveProfile() {
  saving.value = true;
  successMessage.value = '';

  try {
    const res = await api.put('/citizens/profile', editForm.value);
    if (res.data?.data) {
      profile.value = res.data.data;
      if (authStore.user) {
        authStore.user.name = profile.value.name;
        authStore.user.phone = profile.value.phone;
      }
      isEditing.value = false;
      successMessage.value = 'Profile updated and synchronized successfully.';
    }
  } catch (err) {
    console.error('Failed to save citizen profile', err);
  } finally {
    saving.value = false;
  }
}

async function addContact() {
  if (!newContact.value.name || !newContact.value.phone) return;
  addingContact.value = true;

  try {
    const res = await api.post('/citizens/profile/contacts', newContact.value);
    if (res.data?.contacts) {
      profile.value.emergencyContacts = res.data.contacts;
      newContact.value = { name: '', relationship: '', phone: '', isPrimary: false };
      showAddContactForm.value = false;
      successMessage.value = 'Emergency contact added successfully.';
    }
  } catch (err) {
    console.error('Failed to add emergency contact', err);
  } finally {
    addingContact.value = false;
  }
}

async function deleteContact(id) {
  try {
    const res = await api.delete(`/citizens/profile/contacts/${id}`);
    if (res.data?.contacts) {
      profile.value.emergencyContacts = res.data.contacts;
    }
  } catch (err) {
    console.error('Failed to remove emergency contact', err);
  }
}

async function markAsRead(id) {
  const notif = notifications.value.find(n => n.id === id);
  if (notif && !notif.read) {
    notif.read = true;
    try {
      await api.put(`/citizens/notifications/${id}/read`);
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  }
}

async function markAllRead() {
  notifications.value.forEach(n => { n.read = true; });
  try {
    await api.put('/citizens/notifications/mark-all-read');
  } catch (err) {
    console.error('Failed to mark all notifications read', err);
  }
}

function getNotificationIcon(cat) {
  if (cat === 'RESPONDER') return '🚑';
  if (cat === 'FAMILY_SAFETY') return '👨‍👩‍👧';
  if (cat === 'PUBLIC_ALERT') return '📢';
  return '🚨';
}

onMounted(() => {
  loadProfileAndData();
});
</script>

<style scoped>
.citizen-profile-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1040px;
  margin: 0 auto;
}

.header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.back-link {
  font-size: 0.75rem;
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 0.25rem;
}

.back-link:hover {
  text-decoration: underline;
}

.header-card h2 {
  font-size: 1.25rem;
  color: #f8fafc;
}

.header-card p {
  font-size: 0.8rem;
  color: #94a3b8;
}

.edit-btn-group {
  display: flex;
  gap: 0.5rem;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.25rem;
}

.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-panel {
  padding: 1.25rem;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.775rem;
  font-family: var(--font-mono);
  font-weight: 700;
  color: #38bdf8;
  border-bottom: 1px solid rgba(51, 65, 85, 0.6);
  padding-bottom: 0.5rem;
  margin-bottom: 0.85rem;
}

.sec-subtitle {
  font-size: 0.675rem;
  color: #94a3b8;
  font-weight: 400;
}

.btn-link {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 0.7rem;
  cursor: pointer;
}

.btn-link:hover {
  text-decoration: underline;
}

.fields-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-item.full {
  grid-column: span 2;
}

.field-lbl {
  font-size: 0.65rem;
  font-family: var(--font-mono);
  color: #94a3b8;
}

.field-val {
  font-size: 0.85rem;
  color: #f1f5f9;
}

.form-input {
  background: #090e1a;
  border: 1px solid #334155;
  color: white;
  padding: 0.5rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.form-input.textarea {
  resize: vertical;
}

.blood-badge {
  display: inline-block;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #f87171;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.medical-notes-box {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  font-size: 0.775rem;
  color: #cbd5e1;
  line-height: 1.4;
}

/* Contacts List */
.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
}

.contact-left {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.contact-title-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.contact-title-row strong {
  font-size: 0.825rem;
  color: #f8fafc;
}

.primary-tag {
  font-size: 0.6rem;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
}

.contact-sub {
  font-size: 0.7rem;
  color: #94a3b8;
}

.btn-delete-contact {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
}

.btn-delete-contact:hover {
  color: #f87171;
}

/* Add Contact Form */
.add-contact-card {
  background: rgba(9, 14, 26, 0.9);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-title {
  font-size: 0.75rem;
  color: #60a5fa;
}

.form-row-sm {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.4rem;
}

.contact-actions-sm {
  display: flex;
  gap: 0.4rem;
}

/* Notifications */
.notifs-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notif-item {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: all 0.15s;
}

.notif-item.unread {
  border-left: 3px solid #3b82f6;
  background: rgba(15, 23, 42, 0.95);
}

.notif-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notif-cat-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.notif-title {
  font-size: 0.75rem;
  color: #f8fafc;
}

.notif-time {
  font-size: 0.65rem;
  color: #94a3b8;
}

.notif-msg {
  font-size: 0.725rem;
  color: #cbd5e1;
}

/* Success Banner */
.success-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  padding: 0.65rem 1rem;
  color: #34d399;
  font-size: 0.8rem;
}

.state-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
  color: #94a3b8;
  font-family: var(--font-mono);
}

.empty-contacts, .empty-notifs {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
  padding: 0.5rem 0;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.font-mono { font-family: var(--font-mono); }
.btn-sm { font-size: 0.75rem; padding: 0.35rem 0.75rem; }
.btn-xs { font-size: 0.7rem; padding: 0.2rem 0.5rem; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 860px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
