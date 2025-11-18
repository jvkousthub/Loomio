// PostgreSQL Database Configuration for Render
// Use this file if deploying to Render with PostgreSQL

const { Sequelize } = require('sequelize');
const { parse } = require('pg-connection-string');
require('dotenv').config();

// Render provides DATABASE_URL in the format:
// postgres://user:password@host:port/database
let sequelize;

if (process.env.DATABASE_URL) {
  // Parse the connection string to extract components
  const config = parse(process.env.DATABASE_URL);
  
  sequelize = new Sequelize(config.database, config.user, config.password, {
    host: config.host,
    port: config.port || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = sequelize;
