// Test setup and global configuration
require('dotenv').config({ path: '.env.test' });

// Mock environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'loomio_db';

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close database connections if any
  const { sequelize } = require('../src/models');
  if (sequelize) {
    await sequelize.close();
  }
});
