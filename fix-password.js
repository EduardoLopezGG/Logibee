// reset-db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function reset() {
    await pool.query('DELETE FROM "ChildProfile"');
    await pool.query('DELETE FROM "User"');
    console.log('✅ Base de datos limpiada');
    await pool.end();
}

reset().catch(console.error);