const jwt = require('jsonwebtoken');
const config = require('../../config/environment');

class AuthService {
  constructor() {
    this.users = [
      { id: 'usr-admin-1', email: 'admin@resqnet.org', password: 'password123', name: 'Command Chief Miller', role: 'ADMIN' },
      { id: 'usr-disp-1', email: 'dispatcher@resqnet.org', password: 'password123', name: 'Dispatcher John Davis', role: 'DISPATCHER' },
      { id: 'usr-resp-1', email: 'responder@resqnet.org', password: 'password123', name: 'Alex Chen (EMT)', role: 'RESPONDER' },
      { id: 'usr-comm-1', email: 'community@resqnet.org', password: 'password123', name: 'Dr. Priya Sharma', role: 'COMMUNITY_RESPONDER' },
      { id: 'usr-hosp-1', email: 'hospital@resqnet.org', password: 'password123', name: 'Metro Central Hospital Staff', role: 'HOSPITAL' },
      { id: 'usr-citi-1', email: 'citizen@resqnet.org', password: 'password123', name: 'Vignesh Kumar', role: 'CITIZEN' }
    ];
  }

  async login(email, password) {
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    };
  }

  async register(userData) {
    const existing = this.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) throw new Error('User with this email already exists');

    const newUser = {
      id: `usr-${Date.now()}`,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role || 'CITIZEN'
    };
    this.users.push(newUser);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return { token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } };
  }
}

module.exports = new AuthService();
