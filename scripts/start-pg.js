const { default: EmbeddedPostgres } = require('embedded-postgres');
const path = require('path');
const fs = require('fs');

const pgDir = path.join(__dirname, '../.pgdata');

const pg = new EmbeddedPostgres({
  port: 5432,
  databaseDir: pgDir,
  user: 'postgres',
  password: 'postgres',
  database: 'resqnet',
  persistent: true
});

async function start() {
  try {
    if (!fs.existsSync(pgDir)) {
      console.log('📦 Initializing PostgreSQL cluster...');
      await pg.initialise();
    }
    await pg.start();
    console.log('✅ PostgreSQL running on port 5432 (database: resqnet, user: postgres)');
  } catch (err) {
    if (err.message && (err.message.includes('already running') || err.message.includes('another server might be running'))) {
      console.log('ℹ️ PostgreSQL is already running.');
    } else {
      console.error('Error starting PostgreSQL:', err);
    }
  }
}

if (require.main === module) {
  start();
}

module.exports = { pg, start };
