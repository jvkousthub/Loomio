/**
 * Test Data Factory
 * Generates test data matching database schema
 */

const { faker } = require('@faker-js/faker');

/**
 * User test data based on User model schema
 */
const createUserData = (overrides = {}) => {
  return {
    email: faker.internet.email(),
    password: 'Test@123456',
    full_name: faker.person.fullName(),
    role: 'member',
    points: 0,
    email_verified: false,
    is_active: true,
    ...overrides
  };
};

/**
 * Community test data based on Community model schema
 */
const createCommunityData = (overrides = {}) => {
  return {
    name: faker.company.name(),
    description: faker.lorem.paragraph(),
    type: 'public',
    is_active: true,
    ...overrides
  };
};

/**
 * Task test data based on Task model schema
 */
const createTaskData = (overrides = {}) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  
  return {
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    status: 'not_started',
    priority: 'medium',
    deadline: futureDate,
    points: 10,
    ...overrides
  };
};

/**
 * Event test data based on Event model schema
 */
const createEventData = (overrides = {}) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 14);
  
  return {
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    event_date: futureDate,
    location: faker.location.city(),
    max_participants: 50,
    is_active: true,
    ...overrides
  };
};

/**
 * Notification test data based on Notification model schema
 */
const createNotificationData = (overrides = {}) => {
  return {
    type: 'task_assigned',
    title: faker.lorem.sentence(),
    message: faker.lorem.paragraph(),
    priority: 'medium',
    is_read: false,
    ...overrides
  };
};

/**
 * Subtask test data based on Subtask model schema
 */
const createSubtaskData = (overrides = {}) => {
  return {
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    status: 'pending',
    order_index: 0,
    ...overrides
  };
};

/**
 * TaskTag test data based on TaskTag model schema
 */
const createTaskTagData = (overrides = {}) => {
  return {
    name: faker.word.noun(),
    color: faker.color.rgb(),
    description: faker.lorem.sentence(),
    ...overrides
  };
};

/**
 * Attendance test data based on Attendance model schema
 */
const createAttendanceData = (overrides = {}) => {
  return {
    status: 'present',
    attendance_date: new Date(),
    notes: faker.lorem.sentence(),
    ...overrides
  };
};

/**
 * LeaveRequest test data based on LeaveRequest model schema
 */
const createLeaveRequestData = (overrides = {}) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 5);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3);
  
  return {
    leave_type: 'vacation',
    start_date: startDate,
    end_date: endDate,
    reason: faker.lorem.paragraph(),
    status: 'pending',
    ...overrides
  };
};

module.exports = {
  createUserData,
  createCommunityData,
  createTaskData,
  createEventData,
  createNotificationData,
  createSubtaskData,
  createTaskTagData,
  createAttendanceData,
  createLeaveRequestData
};
