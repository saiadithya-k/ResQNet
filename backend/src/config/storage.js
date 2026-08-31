const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

module.exports = {
  type: process.env.STORAGE_TYPE || 'local',
  uploadDir,
  maxFileSize: 50 * 1024 * 1024 // 50MB
};
