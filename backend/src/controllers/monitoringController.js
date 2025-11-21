const { Community, User, UserCommunity, Task, Event, Contribution, TaskAssignment } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get real-time platform usage stats (Developer/Admin monitoring)
const getUsageStats = async (req, res) => {
  try {
    // Only platform admins can access
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Total counts
    const totalUsers = await User.count();
    const totalCommunities = await Community.count({ where: { is_active: true } });
    const totalTasks = await Task.count();
    const totalEvents = await Event.count();

    // Recent activity (last 24 hours)
    const newUsersToday = await User.count({
      where: { created_at: { [Op.gte]: last24Hours } }
    });

    const tasksCreatedToday = await Task.count({
      where: { created_at: { [Op.gte]: last24Hours } }
    });

    const tasksCompletedToday = await Task.count({
      where: { 
        status: 'completed',
        updated_at: { [Op.gte]: last24Hours }
      }
    });

    const eventsCreatedToday = await Event.count({
      where: { created_at: { [Op.gte]: last24Hours } }
    });

    // Weekly activity
    const newUsersThisWeek = await User.count({
      where: { created_at: { [Op.gte]: last7Days } }
    });

    const activeUsersThisWeek = await TaskAssignment.count({
      distinct: true,
      col: 'user_id',
      where: { created_at: { [Op.gte]: last7Days } }
    });

    // Monthly activity
    const newUsersThisMonth = await User.count({
      where: { created_at: { [Op.gte]: last30Days } }
    });

    // Most active communities
    const activeCommunities = await Community.findAll({
      attributes: [
        'community_id',
        'name',
        [sequelize.fn('COUNT', sequelize.col('tasks.task_id')), 'task_count']
      ],
      include: [{
        model: Task,
        as: 'tasks',
        attributes: [],
        required: false
      }],
      where: { is_active: true },
      group: ['Community.community_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('tasks.task_id')), 'DESC']],
      limit: 5,
      raw: true
    });

    // Most active users (by task completion)
    const activeUsers = await User.findAll({
      attributes: [
        'user_id',
        'full_name',
        'email',
        [sequelize.fn('COUNT', sequelize.col('taskAssignments.assignment_id')), 'completed_tasks']
      ],
      include: [{
        model: TaskAssignment,
        as: 'taskAssignments',
        attributes: [],
        where: { status: 'completed' },
        required: false
      }],
      group: ['User.user_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('taskAssignments.assignment_id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Recent users (last 10 registered)
    const recentUsers = await User.findAll({
      attributes: ['user_id', 'full_name', 'email', 'role', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    // Task status breakdown
    const tasksByStatus = await Task.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('task_id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Response
    res.json({
      timestamp: now,
      totals: {
        users: totalUsers,
        communities: totalCommunities,
        tasks: totalTasks,
        events: totalEvents
      },
      last24Hours: {
        newUsers: newUsersToday,
        tasksCreated: tasksCreatedToday,
        tasksCompleted: tasksCompletedToday,
        eventsCreated: eventsCreatedToday
      },
      last7Days: {
        newUsers: newUsersThisWeek,
        activeUsers: activeUsersThisWeek
      },
      last30Days: {
        newUsers: newUsersThisMonth
      },
      activeCommunities,
      activeUsers,
      recentUsers,
      tasksByStatus
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch usage stats', 
      error: error.message 
    });
  }
};

// Get recent activity log
const getActivityLog = async (req, res) => {
  try {
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { limit = 50 } = req.query;

    // Recent tasks
    const recentTasks = await Task.findAll({
      attributes: ['task_id', 'title', 'status', 'created_at'],
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name'] 
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit) / 2
    });

    // Recent task submissions
    const recentSubmissions = await TaskAssignment.findAll({
      attributes: ['assignment_id', 'status', 'submitted_at', 'accepted_at'],
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['user_id', 'full_name'] 
        },
        {
          model: Task,
          as: 'task',
          attributes: ['task_id', 'title'],
          include: [{
            model: Community,
            as: 'community',
            attributes: ['community_id', 'name']
          }]
        }
      ],
      where: {
        submitted_at: { [Op.not]: null }
      },
      order: [['submitted_at', 'DESC']],
      limit: parseInt(limit) / 2
    });

    res.json({
      recentTasks,
      recentSubmissions
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch activity log', 
      error: error.message 
    });
  }
};

module.exports = {
  getUsageStats,
  getActivityLog
};
