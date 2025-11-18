const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole } = require('../../../src/middleware/auth');
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
        email: 'test@test.com',
        role: 'member',
        is_active: true
      };

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: { exclude: ['password_hash'] }
      });
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access token required' });
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

  describe('authorize', () => {
    it('should authorize user with correct role', () => {
      req.user = { role: 'admin' };
      const middleware = requireRole(['admin', 'organizer']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject user with insufficient role', () => {
      req.user = { role: 'member' };
      const middleware = requireRole(['admin', 'organizer']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request without user', () => {
      const middleware = requireRole(['admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
