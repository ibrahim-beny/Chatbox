/**
 * Database setup script voor MVP-005
 * Maakt database schema aan en vult demo data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuratie
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'chatbox_demo',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function setupDatabase() {
  try {
    console.log('🚀 Starting database setup for MVP-005...');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    
    // Read schema file
    console.log('📖 Reading schema file...');
    const schemaPath = path.join(__dirname, 'src', 'backend', 'database', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    console.log('🔧 Creating database schema...');
    await pool.query(schemaSQL);
    console.log('✅ Database schema created successfully');
    
    // Verify data
    console.log('🔍 Verifying demo data...');
    const tenantsResult = await pool.query('SELECT COUNT(*) as count FROM tenants');
    const documentsResult = await pool.query('SELECT COUNT(*) as count FROM documents');
    const chunksResult = await pool.query('SELECT COUNT(*) as count FROM document_chunks');
    
    console.log(`📊 Demo data verification:`);
    console.log(`   - Tenants: ${tenantsResult.rows[0].count}`);
    console.log(`   - Documents: ${documentsResult.rows[0].count}`);
    console.log(`   - Document chunks: ${chunksResult.rows[0].count}`);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Start the database-powered server: node server-database.js');
    console.log('2. Test the endpoints: http://localhost:3000/api/health');
    console.log('3. Try knowledge search: http://localhost:3000/api/knowledge/search?q=web development');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Create database: CREATE DATABASE chatbox_demo;');
    console.log('3. Check connection settings in setup-database.js');
    console.log('4. Run as PostgreSQL superuser if needed');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup
setupDatabase();
