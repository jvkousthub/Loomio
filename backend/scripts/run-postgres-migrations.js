require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigrations() {
  console.log('🔄 Running PostgreSQL database migrations...\n');

  let client;

  try {
    // Create database connection
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

    client = new Client({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    });

    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Read all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));

    console.log(`Found ${files.length} migration file(s):\n`);

    // Run each migration
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      let sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running: ${file}...`);
      
      try {
        // Skip empty files
        if (!sql.trim()) {
          console.log(`   ⚠️  Empty file (skipping)\n`);
          continue;
        }

        // Convert MySQL syntax to PostgreSQL if needed
        sql = convertMySQLToPostgreSQL(sql);

        await client.query(sql);
        console.log(`   ✅ Success\n`);
      } catch (error) {
        // Check if error is "already exists" which is okay
        if (error.code === '42701' || // duplicate_column
            error.code === '42P07' || // duplicate_table
            error.code === '42710' || // duplicate_object
            error.message.includes('already exists') ||
            error.message.includes('duplicate')) {
          console.log(`   ⚠️  Already applied (skipping)\n`);
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    console.log('✅ All migrations completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

function convertMySQLToPostgreSQL(sql) {
  // Basic MySQL to PostgreSQL conversions
  return sql
    // Convert AUTO_INCREMENT to SERIAL
    .replace(/INT\s+AUTO_INCREMENT/gi, 'SERIAL')
    .replace(/BIGINT\s+AUTO_INCREMENT/gi, 'BIGSERIAL')
    
    // Convert TINYINT to SMALLINT
    .replace(/TINYINT/gi, 'SMALLINT')
    
    // Convert DATETIME to TIMESTAMP
    .replace(/DATETIME/gi, 'TIMESTAMP')
    
    // Convert backticks to double quotes for identifiers
    .replace(/`/g, '"')
    
    // Convert ENGINE=InnoDB
    .replace(/ENGINE\s*=\s*InnoDB/gi, '')
    
    // Convert DEFAULT CHARSET
    .replace(/DEFAULT\s+CHARSET\s*=\s*\w+/gi, '')
    
    // Convert CURRENT_TIMESTAMP() to CURRENT_TIMESTAMP
    .replace(/CURRENT_TIMESTAMP\(\)/gi, 'CURRENT_TIMESTAMP');
}

// Run migrations
runMigrations();
