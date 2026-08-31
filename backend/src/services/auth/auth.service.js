const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const config = require('../../config/environment');
const { AppError } = require('../../utils/errors');

class AuthService {
  constructor() {
    this.demoUsers = [
      { id: 'usr-admin-1', mobileNumber: '+919876543211', email: 'admin@resqnet.org', password: 'password123', name: 'Command Chief Miller', role: 'ADMIN' },
      { id: 'usr-disp-1', mobileNumber: '+919876543212', email: 'dispatcher@resqnet.org', password: 'password123', name: 'Dispatcher John Davis', role: 'DISPATCHER' },
      { id: 'usr-resp-1', mobileNumber: '+919876543213', email: 'responder@resqnet.org', password: 'password123', name: 'Alex Chen (EMT)', role: 'RESPONDER' },
      { id: 'usr-comm-1', mobileNumber: '+919876543214', email: 'community@resqnet.org', password: 'password123', name: 'Dr. Priya Sharma', role: 'COMMUNITY_RESPONDER' },
      { id: 'usr-hosp-1', mobileNumber: '+919876543215', email: 'hospital@resqnet.org', password: 'password123', name: 'Metro Central Hospital Staff', role: 'HOSPITAL' },
      { id: 'usr-citi-1', mobileNumber: '+919876543210', email: 'citizen@resqnet.org', password: 'password123', name: 'Vignesh Kumar', role: 'CITIZEN' }
    ];
  }

  /**
   * Normalizes Indian and international mobile numbers into a standard canonical format (+91XXXXXXXXXX)
   */
  normalizeMobileNumber(input) {
    if (!input || typeof input !== 'string') return null;

    // Strip whitespace, hyphens, parentheses, and dots
    const cleaned = input.trim().replace(/[\s\-\(\)\.]/g, '');

    // 1. Standard 10-digit Indian mobile number (e.g. "9876543210")
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    // 2. 12-digit format starting with country code 91 (e.g. "919876543210")
    if (/^91[6-9]\d{9}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    // 3. E.164 international format (e.g. "+919876543210")
    if (/^\+[1-9]\d{9,14}$/.test(cleaned)) {
      return cleaned;
    }

    throw new AppError('Invalid mobile number format. Please provide a valid 10-digit mobile number.', 400);
  }

  /**
   * Authenticate user with mobileNumber (or email) and bcrypt password
   */
  async login(identifierOrBody, maybePassword) {
    let identifier = '';
    let password = '';

    if (typeof identifierOrBody === 'object' && identifierOrBody !== null) {
      identifier = identifierOrBody.mobileNumber || identifierOrBody.email || identifierOrBody.identifier || '';
      password = identifierOrBody.password || '';
    } else {
      identifier = String(identifierOrBody || '');
      password = String(maybePassword || '');
    }

    if (!identifier || !password) {
      throw new AppError('Mobile number (or email) and password are required', 400);
    }

    let canonicalMobile = null;
    let isEmail = identifier.includes('@');

    if (!isEmail) {
      canonicalMobile = this.normalizeMobileNumber(identifier);
    }

    // 1. Query PostgreSQL via Prisma
    let user = null;
    try {
      const orConditions = [];
      if (canonicalMobile) {
        orConditions.push({ mobileNumber: canonicalMobile });
      }
      if (isEmail) {
        orConditions.push({ email: identifier.trim().toLowerCase() });
      } else {
        orConditions.push({ email: identifier.trim().toLowerCase() });
      }

      user = await prisma.user.findFirst({
        where: {
          OR: orConditions
        }
      });
    } catch (dbErr) {
      // Graceful fallback to demoUsers if DB offline
    }

    // 2. Verify password with bcrypt
    if (user && user.passwordHash) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        throw new AppError('Invalid mobile number or password', 401);
      }

      const token = jwt.sign(
        {
          id: user.id,
          mobileNumber: user.mobileNumber,
          email: user.email,
          role: user.role,
          name: user.name
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return {
        token,
        user: {
          id: user.id,
          mobileNumber: user.mobileNumber,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    }

    // 3. Fallback to in-memory demo profiles if not in DB
    const demo = this.demoUsers.find(u => {
      if (canonicalMobile && u.mobileNumber === canonicalMobile) return true;
      if (u.email && u.email.toLowerCase() === identifier.toLowerCase()) return true;
      return false;
    });

    if (demo && demo.password === password) {
      const token = jwt.sign(
        {
          id: demo.id,
          mobileNumber: demo.mobileNumber,
          email: demo.email,
          role: demo.role,
          name: demo.name
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return {
        token,
        user: {
          id: demo.id,
          mobileNumber: demo.mobileNumber,
          email: demo.email,
          name: demo.name,
          role: demo.role
        }
      };
    }

    throw new AppError('Invalid mobile number or password', 401);
  }

  /**
   * Register a new Citizen account with mobileNumber, name, and bcrypt hashed password
   */
  async register(userData) {
    const { name, password, email, role, address, emergencyContact } = userData;

    if (!password || password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    const canonicalMobile = this.normalizeMobileNumber(userData.mobileNumber || userData.phone);
    if (!canonicalMobile && !email) {
      throw new AppError('A valid mobile number is required for registration', 400);
    }

    const canonicalEmail = email ? email.trim().toLowerCase() : null;
    const userRole = (role || 'CITIZEN').toUpperCase();

    // Check duplicate in PostgreSQL
    try {
      const orChecks = [];
      if (canonicalMobile) orChecks.push({ mobileNumber: canonicalMobile });
      if (canonicalEmail) orChecks.push({ email: canonicalEmail });

      const existing = await prisma.user.findFirst({
        where: { OR: orChecks }
      });

      if (existing) {
        if (canonicalMobile && existing.mobileNumber === canonicalMobile) {
          throw new AppError('An account with this mobile number already exists', 409);
        }
        if (canonicalEmail && existing.email === canonicalEmail) {
          throw new AppError('An account with this email already exists', 409);
        }
      }

      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name: name || 'Citizen User',
          mobileNumber: canonicalMobile,
          email: canonicalEmail,
          passwordHash,
          role: userRole,
          citizenProfile: userRole === 'CITIZEN' ? {
            create: {
              address: address || null,
              emergencyContact: emergencyContact || null
            }
          } : undefined
        }
      });

      const token = jwt.sign(
        {
          id: newUser.id,
          mobileNumber: newUser.mobileNumber,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return {
        token,
        user: {
          id: newUser.id,
          mobileNumber: newUser.mobileNumber,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      };
    } catch (dbErr) {
      if (dbErr instanceof AppError) throw dbErr;

      // Fallback in-memory registration if DB offline
      const duplicate = this.demoUsers.find(u =>
        (canonicalMobile && u.mobileNumber === canonicalMobile) ||
        (canonicalEmail && u.email.toLowerCase() === canonicalEmail)
      );
      if (duplicate) {
        throw new AppError('User with this mobile number or email already exists', 409);
      }

      const memoryUser = {
        id: `usr-${Date.now()}`,
        name: name || 'Citizen User',
        mobileNumber: canonicalMobile,
        email: canonicalEmail,
        password: password,
        role: userRole
      };
      this.demoUsers.push(memoryUser);

      const token = jwt.sign(
        {
          id: memoryUser.id,
          mobileNumber: memoryUser.mobileNumber,
          email: memoryUser.email,
          role: memoryUser.role,
          name: memoryUser.name
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return {
        token,
        user: {
          id: memoryUser.id,
          mobileNumber: memoryUser.mobileNumber,
          email: memoryUser.email,
          name: memoryUser.name,
          role: memoryUser.role
        }
      };
    }
  }
}

module.exports = new AuthService();
