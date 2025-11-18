const request = require('supertest');
const app = require('../../src/server');
const { sequelize, User, Community } = require('../../src/models');
const { createUserData, createCommunityData } = require('../helpers/testDataFactory');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    // Skip database sync for production environment
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
    }
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  beforeEach(async () => {
    // Skip clearing database in production
    if (process.env.NODE_ENV !== 'production') {
      await User.destroy({ where: {}, force: true });
      await Community.destroy({ where: {}, force: true });
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = createUserData({
        email: 'newuser@example.com',
        password: 'Test@123456',
        full_name: 'New User'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should not register user with existing email', async () => {
      const userData = createUserData({
        email: 'existing@example.com',
        password: 'Test@123456'
      });

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate email format', async () => {
      const invalidData = createUserData({
        email: 'invalid-email',
        password: 'Test@123456'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const userData = createUserData({
        email: 'testuser@example.com',
        password: 'Test@123456'
      });

      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Test@123456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('testuser@example.com');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@123456'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Register and login to get token
      const userData = createUserData({
        email: 'profileuser@example.com',
        password: 'Test@123456'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = response.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('profileuser@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
    });
  });
});
