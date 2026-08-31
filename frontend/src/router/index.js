import { createRouter, createWebHistory } from 'vue-router';

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

import ResponderDashboard from '../views/responder/ResponderDashboard.vue';
import CommunityDashboard from '../views/community/CommunityDashboard.vue';
import HospitalDashboard from '../views/hospital/HospitalDashboard.vue';
import Login from '../views/auth/Login.vue';

const routes = [
  { path: '/', redirect: '/admin/command' },

  // Admin & Command Center (Team 3)
  { path: '/admin/command', name: 'CommandCenter', component: CommandCenter },
  { path: '/admin/disaster', name: 'DisasterManagement', component: DisasterManagement },
  { path: '/admin/simulation', name: 'DisasterSimulation', component: DisasterSimulation },
  { path: '/admin/analytics', name: 'Analytics', component: Analytics },
  { path: '/admin/evidence', name: 'EvidenceAudit', component: EvidenceAudit },
  { path: '/admin/audit', name: 'AuditLogs', component: AuditLogs },

  // Citizen Platform (Team 1)
  { path: '/citizen', name: 'CitizenDashboard', component: CitizenDashboard },
  { path: '/citizen/report', name: 'ReportEmergency', component: ReportEmergency },
  { path: '/citizen/voice', name: 'VoiceReport', component: VoiceReport },
  { path: '/citizen/family', name: 'FamilySafety', component: FamilySafety },

  // Response Mesh & Hospitals (Team 2)
  { path: '/responder', name: 'ResponderDashboard', component: ResponderDashboard },
  { path: '/community', name: 'CommunityDashboard', component: CommunityDashboard },
  { path: '/hospital', name: 'HospitalDashboard', component: HospitalDashboard },

  // Auth
  { path: '/login', name: 'Login', component: Login }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
