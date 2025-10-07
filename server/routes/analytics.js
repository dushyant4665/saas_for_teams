const express = require('express');
const { verifyToken, requirePro } = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');
const Task = require('../models/Task');

const router = express.Router();

// Demo analytics without auth
router.get('/demo/workspace/:workspaceId', (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const mockAnalytics = {
      workspaceId: workspaceId,
      totalMessages: 156,
      totalTasks: 23,
      completedTasks: 18,
      completionRate: 78.3,
      activeMembers: 5,
      messagesByDay: [
        { date: '2025-10-01', count: 12 },
        { date: '2025-10-02', count: 18 },
        { date: '2025-10-03', count: 15 },
        { date: '2025-10-04', count: 8 }
      ],
      tasksByStatus: {
        completed: 18,
        inProgress: 3,
        pending: 2
      },
      topContributors: [
        { name: 'Demo User 1', messages: 45, tasks: 8 },
        { name: 'Demo User 2', messages: 32, tasks: 6 },
        { name: 'Demo User 3', messages: 28, tasks: 4 }
      ]
    };

    res.json({ analytics: mockAnalytics });
  } catch (error) {
    console.error('Demo analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get workspace analytics (Pro only)
router.get('/workspace/:workspaceId', verifyToken, requirePro, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Verify user has access to workspace
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'members.user': req.user._id
    });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Get message analytics
    const totalMessages = await Message.countDocuments({ workspace: workspaceId });
    
    // Get task analytics
    const totalTasks = await Task.countDocuments({ workspace: workspaceId });
    const completedTasks = await Task.countDocuments({ 
      workspace: workspaceId, 
      status: 'completed' 
    });
    
    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentMessages = await Message.countDocuments({
      workspace: workspaceId,
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    const recentTasks = await Task.countDocuments({
      workspace: workspaceId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get active members count
    const activeMembers = workspace.members.length;

    res.json({
      analytics: {
        totalMessages,
        totalTasks,
        completedTasks,
        recentMessages,
        recentTasks,
        activeMembers,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get global user analytics (Pro only)
router.get('/user', verifyToken, requirePro, async (req, res) => {
  try {
    // Get user's workspaces
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    });

    const workspaceIds = workspaces.map(ws => ws._id);

    // Get total messages across all workspaces
    const totalMessages = await Message.countDocuments({
      workspace: { $in: workspaceIds }
    });

    // Get total tasks across all workspaces
    const totalTasks = await Task.countDocuments({
      workspace: { $in: workspaceIds }
    });

    const completedTasks = await Task.countDocuments({
      workspace: { $in: workspaceIds },
      status: 'completed'
    });

    // Get tasks created by user
    const userCreatedTasks = await Task.countDocuments({
      createdBy: req.user._id
    });

    const userCompletedTasks = await Task.countDocuments({
      createdBy: req.user._id,
      status: 'completed'
    });

    res.json({
      analytics: {
        totalWorkspaces: workspaces.length,
        totalMessages,
        totalTasks,
        completedTasks,
        userCreatedTasks,
        userCompletedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        userCompletionRate: userCreatedTasks > 0 ? Math.round((userCompletedTasks / userCreatedTasks) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

