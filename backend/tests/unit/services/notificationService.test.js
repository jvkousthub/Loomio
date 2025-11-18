const { Notification, User } = require('../../../src/models');
const notificationService = require('../../../src/services/notificationService');
const emailService = require('../../../src/services/emailService');

// Mock dependencies
jest.mock('../../../src/models');
jest.mock('../../../src/services/emailService');

describe('NotificationService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotification = {
        notification_id: 1,
        user_id: 1,
        type: 'task_assigned',
        message: 'You have been assigned a new task',
        title: 'New Task',
        priority: 'medium'
      };

      const mockUser = {
        user_id: 1,
        email: 'test@test.com',
        full_name: 'Test User'
      };

      Notification.create = jest.fn().mockResolvedValue(mockNotification);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      const result = await notificationService.createNotification({
        userId: 1,
        title: 'New Task',
        type: 'task_assigned',
        message: 'You have been assigned a new task',
        priority: 'medium'
      });

      expect(Notification.create).toHaveBeenCalledWith({
        user_id: 1,
        title: 'New Task',
        type: 'task_assigned',
        message: 'You have been assigned a new task',
        priority: 'medium',
        related_id: undefined,
        related_type: undefined,
        community_id: undefined
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('sendEmailIfEnabled', () => {
    it('should send email if user has email notifications enabled', async () => {
      const mockUser = {
        email: 'test@example.com',
        email_preferences: {
          notifications: true,
          taskAssignments: true
        }
      };

      const notificationData = {
        type: 'task_assigned',
        message: 'New task assigned'
      };

      emailService.sendTaskAssignedEmail = jest.fn().mockResolvedValue(true);

      await notificationService.sendEmailIfEnabled(mockUser, notificationData, {
        task: { title: 'Test Task' },
        assignedBy: { full_name: 'Admin' },
        community: { name: 'Test Community' }
      });

      expect(emailService.sendTaskAssignedEmail).toHaveBeenCalled();
    });

    it('should not send email if user has disabled notifications', async () => {
      const mockUser = {
        email: 'test@example.com',
        email_preferences: {
          notifications: false
        }
      };

      const notificationData = {
        type: 'task_assigned',
        message: 'New task assigned'
      };

      emailService.sendTaskAssignedEmail = jest.fn();

      await notificationService.sendEmailIfEnabled(mockUser, notificationData, {});

      expect(emailService.sendTaskAssignedEmail).not.toHaveBeenCalled();
    });
  });

  describe('getUserNotifications', () => {
    it('should retrieve user notifications', async () => {
      const mockNotifications = [
        { notification_id: 1, message: 'Test 1', is_read: false },
        { notification_id: 2, message: 'Test 2', is_read: true }
      ];

      Notification.findAll = jest.fn().mockResolvedValue(mockNotifications);

      const result = await notificationService.getUserNotifications(1);

      expect(Notification.findAll).toHaveBeenCalledWith({
        where: { user_id: 1 },
        limit: 50,
        offset: 0,
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockNotifications);
    });
  });
});
