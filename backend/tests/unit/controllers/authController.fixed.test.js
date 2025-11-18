const jwt = require('jsonwebtoken');
const { User, Community } = require('../../../src/models');
const authController = require('../../../src/controllers/authController');
const { createUserData } = require('../../helpers/testDataFactory');
const emailService = require('../../../src/services/emailService');

// Mock dependencies
jest.mock('../../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  Community: jest.fn()
}));
jest.mock('../../../src/services/emailService', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

describe('AuthController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const userData = createUserData({
        email: 'test@example.com',
        password: 'Test@123456'
      });

      const mockUser = {
        user_id: 1,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        toJSON: () => ({ 
          user_id: 1, 
          email: userData.email, 
          full_name: userData.full_name,
          role: userData.role
        })
      };

      req.body = userData;

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(mockUser);
      User.findByPk = jest.fn().mockResolvedValue({
        ...mockUser,
        communities: []
      });

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          token: expect.any(String)
        })
      );
    });

    it('should return error if user already exists', async () => {
      const userData = createUserData({ email: 'existing@example.com' });
      req.body = userData;

      User.findOne = jest.fn().mockResolvedValue({ 
        email: userData.email,
        user_id: 1
      });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'User with this email already exists' 
      });
    });

    it('should validate required fields', async () => {
      req.body = { email: 'test@example.com' }; // Missing required fields

      User.findOne = jest.fn().mockResolvedValue(null);
      const validationError = new Error('Validation error');
      validationError.name = 'SequelizeValidationError';
      User.create = jest.fn().mockRejectedValue(validationError);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const userData = createUserData({
        email: 'test@example.com',
        password: 'Test@123456'
      });

      const mockUser = {
        user_id: 1,
        email: userData.email,
        password_hash: 'hashed_password',
        is_active: true,
        communities: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ 
          user_id: 1, 
          email: userData.email,
          full_name: userData.full_name,
          communities: []
        })
      };

      req.body = {
        email: userData.email,
        password: userData.password
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(mockUser.comparePassword).toHaveBeenCalledWith(userData.password);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          token: expect.any(String)
        })
      );
    });

    it('should return error for invalid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      User.findOne = jest.fn().mockResolvedValue(null);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Invalid email or password' 
      });
    });

    it('should return error for incorrect password', async () => {
      const mockUser = {
        email: 'test@example.com',
        is_active: true,
        communities: [],
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Invalid email or password' 
      });
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const userId = 123;
      const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(userId);
    });
  });
});
