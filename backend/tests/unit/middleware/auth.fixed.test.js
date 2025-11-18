const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../../src/middleware/auth');
const { User } = require('../../../src/models');

jest.mock('../../../src/models');

describe('Auth Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        role: 'member',
        is_active: true
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(User.findByPk).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.user_id).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access token required' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid_token';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      req.headers.authorization = `Bearer ${token}`;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
