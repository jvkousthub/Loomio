const request = require('supertest');
const app = require('../../src/server');
const { sequelize, User, Task, Community } = require('../../src/models');

describe('Tasks API Integration Tests', () => {
  let authToken;
  let testUser;
  let testCommunity;

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
      await Task.destroy({ where: {}, force: true });
      await User.destroy({ where: {}, force: true });
      await Community.destroy({ where: {}, force: true });
    }

    // Create test community
    testCommunity = await Community.create({
      name: 'Test Community',
      description: 'Test Description'
    });

    // Create and login test user
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'taskuser@example.com',
        password: 'Password123!',
        full_name: 'Task User',
        community_id: testCommunity.community_id
      });

    authToken = response.body.token;
    testUser = response.body.user;
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Task',
          description: 'Task description',
          status: 'pending',
          priority: 'high',
          community_id: testCommunity.community_id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('task_id');
      expect(response.body.title).toBe('New Task');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Unauthorized Task',
          community_id: testCommunity.community_id
        });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing title'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await Task.create({
        title: 'Task 1',
        description: 'Description 1',
        status: 'pending',
        priority: 'high',
        community_id: testCommunity.community_id,
        created_by: testUser.user_id
      });

      await Task.create({
        title: 'Task 2',
        description: 'Description 2',
        status: 'completed',
        priority: 'medium',
        community_id: testCommunity.community_id,
        created_by: testUser.user_id
      });
    });

    it('should get all tasks', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=completed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(task => task.status === 'completed')).toBe(true);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await Task.create({
        title: 'Original Task',
        description: 'Original Description',
        status: 'pending',
        priority: 'medium',
        community_id: testCommunity.community_id,
        created_by: testUser.user_id
      });
    });

    it('should update a task', async () => {
      const response = await request(app)
        .put(`/api/tasks/${testTask.task_id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task',
          status: 'in_progress'
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Task');
      expect(response.body.status).toBe('in_progress');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTask;

    beforeEach(async () => {
      testTask = await Task.create({
        title: 'Task to Delete',
        description: 'Will be deleted',
        status: 'pending',
        priority: 'low',
        community_id: testCommunity.community_id,
        created_by: testUser.user_id
      });
    });

    it('should delete a task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask.task_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify task is deleted
      const task = await Task.findByPk(testTask.task_id);
      expect(task).toBeNull();
    });
  });
});
