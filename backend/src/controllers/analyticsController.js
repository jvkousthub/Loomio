const { Community, User, UserCommunity, Task, Event, Contribution, TaskAssignment } = require('../models');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const PDFDocument = require('pdfkit');
const path = require('path');

// Helper function to format dates for both MySQL and PostgreSQL
const getDateFormat = (column, format) => {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    // PostgreSQL uses TO_CHAR
    const pgFormat = format.replace('%Y', 'YYYY').replace('%m', 'MM').replace('%d', 'DD');
    return Sequelize.fn('TO_CHAR', column, pgFormat);
  } else {
    // MySQL uses DATE_FORMAT
    return Sequelize.fn('DATE_FORMAT', column, format);
  }
};

// Get platform-wide analytics (platform admin only)
const getPlatformAnalytics = async (req, res) => {
  try {
    // Only platform admins can access platform analytics
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Only platform administrators can access platform analytics' });
    }

    const [
      totalUsers,
      totalCommunities,
      totalTasks,
      totalEvents,
      totalContributions,
      activeCommunities,
      activeUsers,
      completedTasks,
      pendingTasks
    ] = await Promise.all([
      User.count(),
      Community.count({ where: { is_active: true } }),
      Task.count(),
      Event.count(),
      Contribution.count(),
      Community.count({ 
        where: { 
          is_active: true,
          created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        } 
      }),
      User.count({
        where: {
          is_active: true,
          created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Recently joined users
        }
      }),
      Task.count({ where: { status: 'completed' } }),
      Task.count({ where: { status: { [Op.in]: ['not_started', 'in_progress', 'submitted'] } } })
    ]);

    // Get top communities by member count
    const topCommunities = await Community.findAll({
      attributes: [
        'community_id',
        'name',
        'description',
        [Sequelize.fn('COUNT', Sequelize.col('members.user_id')), 'memberCount']
      ],
      include: [
        {
          model: User,
          as: 'members',
          attributes: [],
          required: false
        }
      ],
      group: ['Community.community_id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('members.user_id')), 'DESC']],
      limit: 5,
      where: { is_active: true }
    });

    // Get user growth data for last 6 months
    const dialect = sequelize.getDialect();
    let userGrowthData;
    
    if (dialect === 'postgres') {
      userGrowthData = await sequelize.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(user_id)::integer as count
        FROM "Users"
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `, { type: Sequelize.QueryTypes.SELECT });
    } else {
      userGrowthData = await User.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('user_id')), 'count']
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m')],
        order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'ASC']]
      });
    }

    // Get task completion rate over time
    let taskCompletionData;
    
    if (dialect === 'postgres') {
      taskCompletionData = await sequelize.query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(task_id)::integer as "totalTasks",
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::integer as "completedTasks"
        FROM "Tasks"
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `, { type: Sequelize.QueryTypes.SELECT });
    } else {
      taskCompletionData = await Task.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
          [Sequelize.fn('COUNT', Sequelize.col('task_id')), 'totalTasks'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = \'completed\' THEN 1 ELSE 0 END')), 'completedTasks']
        ],
        where: {
          created_at: {
            [Op.gte]: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
          }
        },
        group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m')],
        order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'ASC']]
      });
    }

    // Get top contributors
    const topContributors = await User.findAll({
      attributes: [
        'user_id',
        'full_name',
        'email',
        'points',
        [Sequelize.fn('COUNT', Sequelize.col('assignedTasks.TaskAssignment.task_id')), 'completedTasks']
      ],
      include: [
        {
          model: Task,
          as: 'assignedTasks',
          through: {
            where: { status: 'completed' },
            attributes: []
          },
          attributes: [],
          required: false
        }
      ],
      group: ['User.user_id'],
      order: [['points', 'DESC']],
      limit: 10
    });

    res.json({
      overview: {
        totalUsers,
        totalCommunities,
        totalTasks,
        totalEvents,
        totalContributions,
        activeCommunities,
        activeUsers,
        completedTasks,
        pendingTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      topCommunities: topCommunities.map(community => ({
        ...community.toJSON(),
        memberCount: parseInt(community.dataValues.memberCount) || 0
      })),
      userGrowthData: userGrowthData.map(item => {
        // Handle both Sequelize model and raw query results
        const month = item.month || item.dataValues?.month;
        const count = item.count || item.dataValues?.count;
        return {
          month,
          count: parseInt(count)
        };
      }),
      taskCompletionData: taskCompletionData.map(item => {
        // Handle both Sequelize model and raw query results
        const month = item.month || item.dataValues?.month;
        const totalTasks = item.totalTasks || item.dataValues?.totalTasks;
        const completedTasks = item.completedTasks || item.dataValues?.completedTasks;
        return {
          month,
          totalTasks: parseInt(totalTasks),
          completedTasks: parseInt(completedTasks),
          completionRate: Math.round((parseInt(completedTasks) / parseInt(totalTasks)) * 100) || 0
        };
      }),
      topContributors: topContributors.map(user => ({
        ...user.toJSON(),
        completedTasks: parseInt(user.dataValues.completedTasks) || 0
      }))
    });
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch platform analytics', error: error.message });
  }
};

// Get community analytics for user's admin community
const getMyCommunityAnalytics = async (req, res) => {
  try {
    // Platform admins should see platform-wide analytics, not individual community
    if (req.user.role === 'platform_admin') {
      // Redirect to platform analytics for platform admins
      return getPlatformAnalytics(req, res);
    }
    
    // Get the community where the user is admin
    let communityId;
    
    if (req.user.role === 'community_admin') {
      // Community admin sees their own community from user_communities table
      const userCommunity = await UserCommunity.findOne({
        where: { user_id: req.user.user_id },
        attributes: ['community_id']
      });
      
      if (!userCommunity) {
        return res.status(404).json({ message: 'You are not associated with any community' });
      }
      
      communityId = userCommunity.community_id;
    } else {
      return res.status(403).json({ message: 'Only administrators can access community analytics' });
    }

    if (!communityId) {
      return res.status(404).json({ message: 'No community found for user' });
    }

    return getCommunityAnalyticsData(communityId, res);
  } catch (error) {
    console.error('Get my community analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch community analytics', error: error.message });
  }
};

// Get community analytics (community admin and platform admin only)
const getCommunityAnalytics = async (req, res) => {
  try {
    const { communityId } = req.params;

    // Check permissions
    if (req.user.role !== 'platform_admin' && 
        (req.user.role !== 'community_admin' || req.user.community_id !== parseInt(communityId))) {
      return res.status(403).json({ message: 'Insufficient permissions to access community analytics' });
    }

    return getCommunityAnalyticsData(parseInt(communityId), res);
  } catch (error) {
    console.error('Get community analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch community analytics', error: error.message });
  }
};

// Helper function to get community analytics data
const getCommunityAnalyticsData = async (communityId, res) => {
  try {

      const community = await Community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Community not found' });
      }

      const [
        totalMembers,
        totalTasks,
        totalEvents,
        completedTasks,
        pendingTasks,
        activeMembers,
        totalContributions
      ] = await Promise.all([
        UserCommunity.count({ where: { community_id: communityId } }),
        Task.count({ where: { community_id: communityId } }),
        Event.count({ where: { community_id: communityId } }),
        Task.count({ where: { community_id: communityId, status: 'completed' } }),
        Task.count({ where: { community_id: communityId, status: { [Op.in]: ['not_started', 'in_progress', 'submitted'] } } }),
        UserCommunity.count({
          where: { community_id: communityId },
          include: [{
            model: User,
            as: 'user',
            where: {
              is_active: true,
              updated_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            attributes: []
          }]
        }),
        Contribution.count({
          include: [{
            model: User,
            as: 'user',
            where: { community_id: communityId },
            attributes: []
          }]
        })
      ]);

      // Get member activity data using UserCommunity junction table
      const userCommunities = await UserCommunity.findAll({
        where: { community_id: communityId },
        include: [{
          model: User,
          as: 'user',
          attributes: [
            'user_id',
            'full_name',
            'email',
            'points',
            'updated_at'
          ]
        }],
        order: [[{ model: User, as: 'user' }, 'points', 'DESC']],
        limit: 100 // Increased limit to show more members
      });

      // Transform the data to get user objects
      const memberActivity = userCommunities.map(uc => uc.user).filter(user => user !== null);

      // Get completed tasks count for each member separately
      for (let member of memberActivity) {
        const completedTasksCount = await TaskAssignment.count({
          where: {
            user_id: member.user_id,
            status: 'completed'
          }
        });
        member.dataValues.completedTasks = completedTasksCount;
      }

      // Get task completion trend for last 3 months
      const taskTrend = await Task.findAll({
        attributes: [
          [getDateFormat(Sequelize.col('created_at'), '%Y-%m-%d'), 'date'],
          [Sequelize.fn('COUNT', Sequelize.col('task_id')), 'totalTasks'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = \'completed\' THEN 1 ELSE 0 END')), 'completedTasks']
        ],
        where: {
          community_id: communityId,
          created_at: {
            [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        group: [getDateFormat(Sequelize.col('created_at'), '%Y-%m-%d')],
        order: [[getDateFormat(Sequelize.col('created_at'), '%Y-%m-%d'), 'ASC']]
      });

      res.json({
        community: {
          id: community.community_id,
          name: community.name,
          description: community.description,
          createdAt: community.created_at
        },
        overview: {
          totalMembers,
          totalTasks,
          totalEvents,
          completedTasks,
          pendingTasks,
          activeMembers,
          totalContributions,
          taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          memberActivityRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0
        },
        memberActivity: memberActivity.map(member => ({
          ...member.toJSON(),
          completedTasks: member.dataValues.completedTasks || 0,
          isActive: member.updated_at && new Date(member.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        })),
        taskTrend: taskTrend.map(item => ({
          date: item.dataValues.date,
          totalTasks: parseInt(item.dataValues.totalTasks),
          completedTasks: parseInt(item.dataValues.completedTasks),
          completionRate: Math.round((parseInt(item.dataValues.completedTasks) / parseInt(item.dataValues.totalTasks)) * 100) || 0
        }))
      });
    } catch (error) {
      console.error('Get community analytics data error:', error);
      res.status(500).json({ message: 'Failed to fetch community analytics data', error: error.message });
    }
};

// Generate member activity report as PDF
const generateMemberReport = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get community admin's community
    let communityId;
    if (req.user.role === 'community_admin') {
      // Find admin's community from user_communities table
      const adminCommunity = await UserCommunity.findOne({
        where: { user_id: req.user.user_id },
        attributes: ['community_id']
      });
      if (!adminCommunity) {
        return res.status(404).json({ message: 'You are not associated with any community' });
      }
      communityId = adminCommunity.community_id;
    } else if (req.user.role === 'platform_admin') {
      // Platform admin can get user's community from user_communities
      const targetUserCommunity = await UserCommunity.findOne({
        where: { user_id: userId },
        attributes: ['community_id']
      });
      if (!targetUserCommunity) {
        return res.status(404).json({ message: 'User is not associated with any community' });
      }
      communityId = targetUserCommunity.community_id;
    } else {
      return res.status(403).json({ message: 'Only administrators can generate member reports' });
    }

    // Verify the user is a member of this community
    const userCommunityMembership = await UserCommunity.findOne({
      where: { 
        user_id: userId,
        community_id: communityId 
      }
    });

    if (!userCommunityMembership) {
      return res.status(404).json({ message: 'Member not found in this community' });
    }

    // Get comprehensive member data
    const member = await User.findByPk(userId, {
      attributes: [
        'user_id',
        'full_name',
        'email',
        'role',
        'points',
        'total_tasks_completed',
        'current_streak',
        'longest_streak',
        'weekly_points',
        'monthly_points',
        'created_at',
        'updated_at'
      ]
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Get community details
    const community = await Community.findByPk(communityId, {
      attributes: ['name', 'description']
    });

    // Get task assignments
    const taskAssignments = await TaskAssignment.findAll({
      where: { user_id: userId },
      include: [{
        model: Task,
        as: 'task',
        attributes: ['title', 'status', 'priority', 'deadline', 'completion_date', 'created_at']
      }],
      order: [['created_at', 'DESC']]
    });

    // Get contributions
    const contributions = await Contribution.findAll({
      where: { user_id: userId },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['title', 'event_date']
      }],
      attributes: ['contribution_id', 'type', 'points', 'description', 'date', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    // Get event attendance
    const { Attendance } = require('../models');
    const attendance = await Attendance.findAll({
      where: { user_id: userId },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['title', 'event_date', 'event_type']
      }],
      attributes: ['status', 'check_in_time', 'check_out_time'],
      order: [['created_at', 'DESC']]
    });

    // Calculate statistics
    const stats = {
      totalTasksAssigned: taskAssignments.length,
      completedTasks: taskAssignments.filter(t => t.task.status === 'completed').length,
      inProgressTasks: taskAssignments.filter(t => t.task.status === 'in_progress').length,
      pendingTasks: taskAssignments.filter(t => t.task.status === 'not_started').length,
      totalContributions: contributions.length,
      totalPointsEarned: contributions.reduce((sum, c) => sum + (c.points || 0), 0),
      totalEventsAttended: attendance.filter(a => a.status === 'present').length,
      totalEventsAbsent: attendance.filter(a => a.status === 'absent').length,
      completionRate: taskAssignments.length > 0 
        ? Math.round((taskAssignments.filter(t => t.task.status === 'completed').length / taskAssignments.length) * 100) 
        : 0
    };

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=member-report-${member.full_name.replace(/\s/g, '-')}-${Date.now()}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add Loomio header/logo
    doc.fontSize(24)
       .fillColor('#4F46E5')
       .text('LOOMIO', { align: 'center' })
       .moveDown(0.5);
    
    doc.fontSize(12)
       .fillColor('#6B7280')
       .text('Community Management Platform', { align: 'center' })
       .moveDown(1);

    // Add title
    doc.fontSize(20)
       .fillColor('#111827')
       .text('Member Activity Report', { align: 'center' })
       .moveDown(0.5);

    // Add generation date
    doc.fontSize(10)
       .fillColor('#6B7280')
       .text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
         year: 'numeric', 
         month: 'long', 
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit'
       })}`, { align: 'center' })
       .moveDown(2);

    // Add horizontal line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(1);

    // Member Information Section
    doc.fontSize(16)
       .fillColor('#4F46E5')
       .text('Member Information', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#111827');
    
    const memberInfo = [
      `Name: ${member.full_name}`,
      `Email: ${member.email}`,
      `Role: ${member.role.replace(/_/g, ' ').toUpperCase()}`,
      `Community: ${community.name}`,
      `Member Since: ${new Date(member.created_at).toLocaleDateString()}`,
      `Total Points: ${member.points}`,
      `Current Streak: ${member.current_streak} days`,
      `Longest Streak: ${member.longest_streak} days`
    ];

    memberInfo.forEach(info => {
      doc.text(info).moveDown(0.3);
    });

    doc.moveDown(1);

    // Statistics Overview Section
    doc.fontSize(16)
       .fillColor('#4F46E5')
       .text('Performance Overview', { underline: true })
       .moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#111827');

    const statsInfo = [
      `Total Tasks Assigned: ${stats.totalTasksAssigned}`,
      `Tasks Completed: ${stats.completedTasks}`,
      `Tasks In Progress: ${stats.inProgressTasks}`,
      `Tasks Pending: ${stats.pendingTasks}`,
      `Task Completion Rate: ${stats.completionRate}%`,
      `Total Contributions: ${stats.totalContributions}`,
      `Total Points Earned: ${stats.totalPointsEarned}`,
      `Events Attended: ${stats.totalEventsAttended}`,
      `Events Absent: ${stats.totalEventsAbsent}`,
      `Weekly Points: ${member.weekly_points}`,
      `Monthly Points: ${member.monthly_points}`
    ];

    statsInfo.forEach(stat => {
      doc.text(stat).moveDown(0.3);
    });

    // Add new page for detailed activity
    doc.addPage();

    // Task History Section
    doc.fontSize(16)
       .fillColor('#4F46E5')
       .text('Task History', { underline: true })
       .moveDown(0.5);

    if (taskAssignments.length > 0) {
      doc.fontSize(10)
         .fillColor('#111827');

      taskAssignments.slice(0, 20).forEach((assignment, index) => {
        const task = assignment.task;
        doc.text(`${index + 1}. ${task.title}`, { continued: false })
           .fontSize(9)
           .fillColor('#6B7280')
           .text(`   Status: ${task.status} | Priority: ${task.priority} | Assigned: ${new Date(assignment.created_at).toLocaleDateString()}`)
           .fontSize(10)
           .fillColor('#111827')
           .moveDown(0.5);
        
        if (doc.y > 700) {
          doc.addPage();
        }
      });
    } else {
      doc.fontSize(10)
         .fillColor('#6B7280')
         .text('No tasks assigned yet.');
    }

    doc.moveDown(1);

    // Contributions Section
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(16)
       .fillColor('#4F46E5')
       .text('Contributions', { underline: true })
       .moveDown(0.5);

    if (contributions.length > 0) {
      doc.fontSize(10)
         .fillColor('#111827');

      contributions.slice(0, 20).forEach((contribution, index) => {
        doc.text(`${index + 1}. ${contribution.type}`, { continued: false })
           .fontSize(9)
           .fillColor('#6B7280')
           .text(`   Event: ${contribution.event?.title || 'N/A'} | Points: ${contribution.points || 0} | Date: ${new Date(contribution.created_at).toLocaleDateString()}`)
           .fontSize(10)
           .fillColor('#111827')
           .moveDown(0.5);

        if (doc.y > 700) {
          doc.addPage();
        }
      });
    } else {
      doc.fontSize(10)
         .fillColor('#6B7280')
         .text('No contributions recorded yet.');
    }

    doc.moveDown(1);

    // Event Attendance Section
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(16)
       .fillColor('#4F46E5')
       .text('Event Attendance', { underline: true })
       .moveDown(0.5);

    if (attendance.length > 0) {
      doc.fontSize(10)
         .fillColor('#111827');

      attendance.slice(0, 20).forEach((record, index) => {
        doc.text(`${index + 1}. ${record.event?.title || 'Event'}`, { continued: false })
           .fontSize(9)
           .fillColor('#6B7280')
           .text(`   Status: ${record.status} | Date: ${record.event?.event_date ? new Date(record.event.event_date).toLocaleDateString() : 'N/A'}`)
           .fontSize(10)
           .fillColor('#111827')
           .moveDown(0.5);

        if (doc.y > 700) {
          doc.addPage();
        }
      });
    } else {
      doc.fontSize(10)
         .fillColor('#6B7280')
         .text('No event attendance records.');
    }

    // Add footer on last page
    doc.moveDown(2);
    doc.fontSize(8)
       .fillColor('#9CA3AF')
       .text('This report is confidential and generated for administrative purposes only.', { align: 'center' })
       .moveDown(0.3)
       .text(`© ${new Date().getFullYear()} Loomio - Community Management Platform`, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Generate member report error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate member report', error: error.message });
    }
  }
};

// Get member report data as JSON (for modal view)
const getMemberReportData = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('getMemberReportData called with userId:', userId);
    console.log('req.params:', req.params);
    
    // Get community admin's community
    let communityId;
    if (req.user.role === 'community_admin') {
      // Find admin's community from user_communities table
      const adminCommunity = await UserCommunity.findOne({
        where: { user_id: req.user.user_id },
        attributes: ['community_id']
      });
      if (!adminCommunity) {
        return res.status(404).json({ message: 'You are not associated with any community' });
      }
      communityId = adminCommunity.community_id;
    } else if (req.user.role === 'platform_admin') {
      // Platform admin can get user's community from user_communities
      const targetUserCommunity = await UserCommunity.findOne({
        where: { user_id: userId },
        attributes: ['community_id']
      });
      if (!targetUserCommunity) {
        return res.status(404).json({ message: 'User is not associated with any community' });
      }
      communityId = targetUserCommunity.community_id;
    } else {
      return res.status(403).json({ message: 'Only administrators can view member reports' });
    }

    // Verify the user is a member of this community
    const userCommunityMembership = await UserCommunity.findOne({
      where: { 
        user_id: userId,
        community_id: communityId 
      }
    });

    if (!userCommunityMembership) {
      return res.status(404).json({ message: 'Member not found in this community' });
    }

    // Get comprehensive member data
    const member = await User.findByPk(userId, {
      attributes: [
        'user_id',
        'full_name',
        'email',
        'role',
        'points',
        'total_tasks_completed',
        'current_streak',
        'longest_streak',
        'weekly_points',
        'monthly_points',
        'created_at',
        'updated_at'
      ]
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Get community details
    const community = await Community.findByPk(communityId, {
      attributes: ['name', 'description']
    });

    // Get task assignments
    const taskAssignments = await TaskAssignment.findAll({
      where: { user_id: userId },
      include: [{
        model: Task,
        as: 'task',
        attributes: ['title', 'status', 'priority', 'deadline', 'completion_date', 'created_at']
      }],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Get contributions
    const contributions = await Contribution.findAll({
      where: { user_id: userId },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['title', 'event_date']
      }],
      attributes: ['contribution_id', 'type', 'points', 'description', 'date', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Get event attendance
    const { Attendance } = require('../models');
    const attendance = await Attendance.findAll({
      where: { user_id: userId },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['title', 'event_date', 'event_type']
      }],
      attributes: ['status', 'check_in_time', 'check_out_time', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    // Calculate statistics
    const stats = {
      totalTasksAssigned: taskAssignments.length,
      completedTasks: taskAssignments.filter(t => t.task.status === 'completed').length,
      inProgressTasks: taskAssignments.filter(t => t.task.status === 'in_progress').length,
      pendingTasks: taskAssignments.filter(t => t.task.status === 'not_started').length,
      totalContributions: contributions.length,
      totalPointsEarned: contributions.reduce((sum, c) => sum + (c.points || 0), 0),
      totalEventsAttended: attendance.filter(a => a.status === 'present').length,
      totalEventsAbsent: attendance.filter(a => a.status === 'absent').length,
      completionRate: taskAssignments.length > 0 
        ? Math.round((taskAssignments.filter(t => t.task.status === 'completed').length / taskAssignments.length) * 100) 
        : 0
    };

    // Return JSON data
    res.json({
      member: member.toJSON(),
      community: community.toJSON(),
      stats,
      taskAssignments: taskAssignments.map(ta => ta.toJSON()),
      contributions: contributions.map(c => c.toJSON()),
      attendance: attendance.map(a => a.toJSON())
    });

  } catch (error) {
    console.error('Get member report data error:', error);
    res.status(500).json({ message: 'Failed to fetch member report data', error: error.message });
  }
};

module.exports = {
  getPlatformAnalytics,
  getCommunityAnalytics,
  getMyCommunityAnalytics,
  generateMemberReport,
  getMemberReportData
};