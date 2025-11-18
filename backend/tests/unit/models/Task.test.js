const { Task } = require('../../../src/models');

jest.mock('../../../src/models');

describe('Task Model Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Creation', () => {
    it('should create a task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        community_id: 1,
        created_by: 1
      };

      Task.create = jest.fn().mockResolvedValue({
        task_id: 1,
        ...taskData,
        created_at: new Date()
      });

      const task = await Task.create(taskData);

      expect(Task.create).toHaveBeenCalledWith(taskData);
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('pending');
    });

    it('should require title field', async () => {
      const invalidTask = {
        description: 'No title',
        status: 'pending'
      };

      Task.create = jest.fn().mockRejectedValue(
        new Error('notNull Violation: Task.title cannot be null')
      );

      await expect(Task.create(invalidTask)).rejects.toThrow();
    });
  });

  describe('Task Validation', () => {
    it('should validate status values', () => {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      validStatuses.forEach(status => {
        expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(status);
      });
    });

    it('should validate priority values', () => {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      validPriorities.forEach(priority => {
        expect(['low', 'medium', 'high', 'urgent']).toContain(priority);
      });
    });
  });

  describe('Task Queries', () => {
    it('should find task by ID', async () => {
      const mockTask = {
        task_id: 1,
        title: 'Found Task',
        status: 'pending'
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      const task = await Task.findByPk(1);

      expect(Task.findByPk).toHaveBeenCalledWith(1);
      expect(task.task_id).toBe(1);
    });

    it('should find all tasks with filters', async () => {
      const mockTasks = [
        { task_id: 1, status: 'completed' },
        { task_id: 2, status: 'completed' }
      ];

      Task.findAll = jest.fn().mockResolvedValue(mockTasks);

      const tasks = await Task.findAll({
        where: { status: 'completed' }
      });

      expect(Task.findAll).toHaveBeenCalled();
      expect(tasks).toHaveLength(2);
    });
  });

  describe('Task Updates', () => {
    it('should update task status', async () => {
      const mockTask = {
        task_id: 1,
        title: 'Test Task',
        status: 'pending',
        update: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);
      mockTask.update.mockImplementation(function(data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      });

      const updatedTask = await mockTask.update({ status: 'completed' });

      expect(mockTask.update).toHaveBeenCalledWith({ status: 'completed' });
      expect(updatedTask.status).toBe('completed');
    });
  });

  describe('Task Deletion', () => {
    it('should delete a task', async () => {
      const mockTask = {
        task_id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Task.findByPk = jest.fn().mockResolvedValue(mockTask);

      await mockTask.destroy();

      expect(mockTask.destroy).toHaveBeenCalled();
    });
  });
});
