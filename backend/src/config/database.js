require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error', 'warn']
    });
  }
  prisma = global.prisma;
}

logger.info('📦 Database connection initialized via Prisma Client');

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.default = prisma;
