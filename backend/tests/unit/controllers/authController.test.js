const jwt = require('jsonwebtoken');
const { User, Community } = require('../../../src/models');
const authController = require('../../../src/controllers/authController');
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
      const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'member',
        toJSON: () => ({ user_id: 1, email: 'test@example.com', full_name: 'Test User' })
      };

      const mockUserWithCommunity = {
        user_id: 1,
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'member',
        toJSON: () => ({ user_id: 1, email: 'test@example.com', full_name: 'Test User' })
      };

      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        full_name: 'Test User'
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      User.create = jest.fn().mockResolvedValue(mockUser);
      User.findByPk = jest.fn().mockResolvedValue(mockUserWithCommunity);

      await authController.register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          token: expect.any(String),
          user: expect.any(Object)
        })
      );
    });

    it('should return error if user already exists', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'Password123!'
      };

      User.findOne = jest.fn().mockResolvedValue({ email: 'existing@example.com' });

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User with this email already exists' });
    });

    it('should validate required fields', async () => {
      req.body = { email: 'test@example.com' }; // Missing password

      User.findOne = jest.fn().mockResolvedValue(null);
      const mockError = new Error('Validation error');
      mockError.name = 'SequelizeValidationError';
      User.create = jest.fn().mockRejectedValue(mockError);

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        is_active: true,
        communities: [],
        comparePassword: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ 
          user_id: 1, 
          email: 'test@example.com',
          communities: []
        })
      };

      req.body = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(User.findOne).toHaveBeenCalled();
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123!');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          token: expect.any(String),
          user: expect.any(Object)
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
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return error for incorrect password', async () => {
      const mockUser = {
        email: 'test@example.com',
        is_active: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT token', () => {
      const userId = 123;
      const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(userId);
    });
  });
});
