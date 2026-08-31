const express = require('express');
const router = express.Router();
const mockState = require('../services/mockData');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/my-reports', (req, res) => {
  res.json({ success: true, count: mockState.incidents.length, data: mockState.incidents });
});

router.get('/family-safety', (req, res) => {
  res.json({
    success: true,
    data: mockState.familyMembers
  });
});

// Citizen Profile
router.get('/profile', (req, res) => {
  res.json({ success: true, data: mockState.citizenProfile });
});

router.put('/profile', (req, res) => {
  const { name, phone, email, bloodGroup, address, language, medicalNotes, emergencyContacts } = req.body;
  if (name) mockState.citizenProfile.name = name;
  if (phone) mockState.citizenProfile.phone = phone;
  if (email) mockState.citizenProfile.email = email;
  if (bloodGroup) mockState.citizenProfile.bloodGroup = bloodGroup;
  if (address) mockState.citizenProfile.address = address;
  if (language) mockState.citizenProfile.language = language;
  if (medicalNotes !== undefined) mockState.citizenProfile.medicalNotes = medicalNotes;
  if (emergencyContacts) mockState.citizenProfile.emergencyContacts = emergencyContacts;

  res.json({ success: true, message: 'Profile updated successfully', data: mockState.citizenProfile });
});

router.post('/profile/contacts', (req, res) => {
  const { name, relationship, phone, isPrimary } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Contact name and phone are required' });
  }

  const newContact = {
    id: `EC-${Date.now().toString().slice(-4)}`,
    name,
    relationship: relationship || 'Family',
    phone,
    isPrimary: !!isPrimary
  };

  mockState.citizenProfile.emergencyContacts.push(newContact);
  res.status(201).json({ success: true, data: newContact, contacts: mockState.citizenProfile.emergencyContacts });
});

router.delete('/profile/contacts/:id', (req, res) => {
  const { id } = req.params;
  mockState.citizenProfile.emergencyContacts = mockState.citizenProfile.emergencyContacts.filter(c => c.id !== id);
  res.json({ success: true, message: 'Emergency contact removed', contacts: mockState.citizenProfile.emergencyContacts });
});

// Citizen Notifications
router.get('/notifications', (req, res) => {
  res.json({
    success: true,
    count: mockState.citizenNotifications.length,
    unreadCount: mockState.citizenNotifications.filter(n => !n.read).length,
    data: mockState.citizenNotifications
  });
});

router.put('/notifications/:id/read', (req, res) => {
  const notif = mockState.citizenNotifications.find(n => n.id === req.params.id);
  if (notif) notif.read = true;
  res.json({ success: true, data: notif });
});

router.put('/notifications/mark-all-read', (req, res) => {
  mockState.citizenNotifications.forEach(n => { n.read = true; });
  res.json({ success: true, message: 'All notifications marked as read' });
});

module.exports = router;
