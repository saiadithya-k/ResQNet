import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

// Views
import CommandCenter from '../views/admin/CommandCenter.vue';
import DisasterManagement from '../views/admin/DisasterManagement.vue';
import DisasterSimulation from '../views/admin/DisasterSimulation.vue';
import Analytics from '../views/admin/Analytics.vue';
import EvidenceAudit from '../views/admin/EvidenceAudit.vue';
import AuditLogs from '../views/admin/AuditLogs.vue';

import CitizenDashboard from '../views/citizen/CitizenDashboard.vue';
import ReportEmergency from '../views/citizen/ReportEmergency.vue';
import VoiceReport from '../views/citizen/VoiceReport.vue';
import FamilySafety from '../views/citizen/FamilySafety.vue';
import MyEmergencies from '../views/citizen/MyEmergencies.vue';
import EmergencyDetails from '../views/citizen/EmergencyDetails.vue';
import SurvivorCheckIn from '../views/citizen/SurvivorCheckIn.vue';
import PublicAlerts from '../views/citizen/PublicAlerts.vue';
import CitizenProfile from '../views/citizen/CitizenProfile.vue';
import CitizenRiskAwareness from '../views/citizen/CitizenRiskAwareness.vue';

import ResponderDashboard from '../views/responder/ResponderDashboard.vue';
import CommunityDashboard from '../views/community/CommunityDashboard.vue';
import HospitalDashboard from '../views/hospital/HospitalDashboard.vue';
import Login from '../views/auth/Login.vue';

const routes = [
  { path: '/', redirect: '/citizen' },

  // Citizen Platform (Team 1)
  { path: '/citizen', name: 'CitizenDashboard', component: CitizenDashboard, meta: { requiresAuth: true } },
  { path: '/citizen/report', name: 'ReportEmergency', component: ReportEmergency, meta: { requiresAuth: true } },
  { path: '/citizen/voice', name: 'VoiceReport', component: VoiceReport, meta: { requiresAuth: true } },
  { path: '/citizen/family', name: 'FamilySafety', component: FamilySafety, meta: { requiresAuth: true } },
  { path: '/citizen/emergencies', name: 'CitizenEmergencies', component: MyEmergencies, meta: { requiresAuth: true } },
  { path: '/citizen/emergencies/:id', name: 'CitizenEmergencyDetail', component: EmergencyDetails, meta: { requiresAuth: true } },
  { path: '/citizen/survivor', name: 'CitizenSurvivor', component: SurvivorCheckIn, meta: { requiresAuth: true } },
  { path: '/citizen/alerts', name: 'CitizenAlerts', component: PublicAlerts, meta: { requiresAuth: true } },
  { path: '/citizen/profile', name: 'CitizenProfile', component: CitizenProfile, meta: { requiresAuth: true } },
  { path: '/citizen/risk', name: 'CitizenRisk', component: CitizenRiskAwareness, meta: { requiresAuth: true } },

  // Admin & Command Center (Team 3)
  { path: '/admin/command', name: 'CommandCenter', component: CommandCenter, meta: { requiresAuth: true } },
  { path: '/admin/disaster', name: 'DisasterManagement', component: DisasterManagement, meta: { requiresAuth: true } },
  { path: '/admin/simulation', name: 'DisasterSimulation', component: DisasterSimulation, meta: { requiresAuth: true } },
  { path: '/admin/analytics', name: 'Analytics', component: Analytics, meta: { requiresAuth: true } },
  { path: '/admin/evidence', name: 'EvidenceAudit', component: EvidenceAudit, meta: { requiresAuth: true } },
  { path: '/admin/audit', name: 'AuditLogs', component: AuditLogs, meta: { requiresAuth: true } },

  // Response Mesh & Hospitals (Team 2)
  { path: '/responder', name: 'ResponderDashboard', component: ResponderDashboard, meta: { requiresAuth: true } },
  { path: '/community', name: 'CommunityDashboard', component: CommunityDashboard, meta: { requiresAuth: true } },
  { path: '/hospital', name: 'HospitalDashboard', component: HospitalDashboard, meta: { requiresAuth: true } },

  // Auth
  { path: '/login', name: 'Login', component: Login, meta: { public: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.path === '/login') {
    // Allow viewing the login page directly
    next();
  } else if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (authStore.isAuthenticated && authStore.user?.role === 'CITIZEN') {
    // Role Boundary Hardening: Prevent citizen from accessing admin, responder, or hospital internal screens
    if (to.path.startsWith('/admin') || to.path.startsWith('/responder') || to.path.startsWith('/hospital')) {
      next('/citizen');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;

