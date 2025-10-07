const express = require('express');
const { verifyToken } = require('../middleware/auth');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { checkConnection } = require('../config/database');

const router = express.Router();

// In-memory demo workspace store: slug -> workspace (to preserve inviteCode)
const demoWorkspaces = new Map();

// Test route without auth
router.get('/test-route', (req, res) => {
  res.json({ message: 'Workspace route is working', timestamp: new Date().toISOString() });
});

// Demo workspace fetch without auth
router.get('/demo/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    
    if (demoWorkspaces.has(slug)) {
      return res.json({ workspace: demoWorkspaces.get(slug) });
    }

    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
      return result;
    };

    const mockWorkspace = {
      id: `workspace_${slug}`,
      name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
      slug: slug,
      description: `This is the ${slug} workspace`,
      inviteCode: generateInviteCode(),
      owner: {
        _id: 'demo_user_123',
        displayName: 'Demo User',
        email: 'demo@example.com',
        photoURL: null
      },
      members: [{
        user: {
          _id: 'demo_user_123',
          displayName: 'Demo User',
          email: 'demo@example.com',
          photoURL: null
        },
        role: 'admin'
      }],
      settings: {
        allowInvites: true,
        requireApproval: false
      },
      analytics: {
        totalMessages: 0,
        totalTasks: 0,
        totalMembers: 1,
        lastActivity: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    demoWorkspaces.set(slug, mockWorkspace);
    res.json({ workspace: mockWorkspace });
  } catch (error) {
    console.error('Demo workspace fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Demo workspace creation without auth
router.post('/demo-create', (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Generate unique invite code
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const inviteCode = generateInviteCode();
    // Use consistent demo user ID for owner detection
    const ownerId = 'demo_user_123';
    const ownerName = 'Demo User';

  const mockWorkspace = {
      id: `workspace_${Date.now()}`,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description?.trim() || '',
      inviteCode: inviteCode,
      owner: {
        _id: ownerId,
        displayName: ownerName,
        email: 'demo@example.com',
        photoURL: null
      },
      members: [{
        user: {
          _id: ownerId,
          displayName: ownerName,
          email: 'demo@example.com',
          photoURL: null
        },
        role: 'admin'
      }],
      settings: {
        isPublic: false,
        allowGuestAccess: false,
        requireInvite: true
      },
      analytics: {
        totalMessages: 0,
        totalTasks: 0,
        completedTasks: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

  demoWorkspaces.set(mockWorkspace.slug, mockWorkspace);
  res.status(201).json({ workspace: mockWorkspace });
  } catch (error) {
    console.error('Demo create workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Demo workspace join without auth
router.post('/demo-join', (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Try to find a previously created demo workspace by invite code
    let found = null;
    for (const ws of demoWorkspaces.values()) {
      if (ws.inviteCode === inviteCode) { found = ws; break; }
    }

    const mockWorkspace = found || {
      id: `workspace_${Date.now()}`,
      name: 'TEST',
      slug: 'test',
      description: 'This is the TEST workspace',
      inviteCode: inviteCode,
      owner: {
        _id: 'demo_user_123',
        displayName: 'Demo User',
        email: 'demo@example.com',
        photoURL: null
      },
      members: [
        {
          user: {
            _id: 'demo_user_123',
            displayName: 'Demo User',
            email: 'demo@example.com',
            photoURL: null
          },
          role: 'admin'
        },
        {
          user: {
            _id: 'demo_user_123',
            displayName: 'Demo User',
            email: 'demo@example.com',
            photoURL: null
          },
          role: 'member'
        }
      ],
      settings: {
        isPublic: false,
        allowGuestAccess: false,
        requireInvite: true
      },
      analytics: {
        totalMessages: 0,
        totalTasks: 0,
        completedTasks: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      workspace: mockWorkspace,
      message: 'Successfully joined workspace!'
    });
  } catch (error) {
    console.error('Demo join workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Create workspace
router.post('/create', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Check database connection
    if (!checkConnection()) {
      // Return mock data for demo
    const mockWorkspace = {
      id: `workspace_${Date.now()}`,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: description?.trim() || '',
        inviteCode: 'ABC12345',
        owner: {
          _id: req.user._id || req.user.firebaseUid,
          displayName: req.user.displayName,
          email: req.user.email,
          photoURL: req.user.photoURL
        },
      members: [{
        user: {
            _id: req.user._id || req.user.firebaseUid,
          displayName: req.user.displayName,
          email: req.user.email,
          photoURL: req.user.photoURL
        },
        role: 'admin'
      }],
      settings: {
        isPublic: false,
          allowGuestAccess: false,
          requireInvite: true
      },
      analytics: {
        totalMessages: 0,
        totalTasks: 0,
        completedTasks: 0
      },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(201).json({ workspace: mockWorkspace });
    }

    // Create workspace in database
    const workspace = new Workspace({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id || req.user.firebaseUid,
      members: [{
        user: req.user._id || req.user.firebaseUid,
        role: 'admin'
      }]
    });

    await workspace.save();
    await workspace.populate('owner', 'displayName email photoURL');
    await workspace.populate('members.user', 'displayName email photoURL');

    res.status(201).json({
      workspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        inviteCode: workspace.inviteCode,
        owner: workspace.owner,
        members: workspace.members,
        settings: workspace.settings,
        analytics: workspace.analytics,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt
      }
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's workspaces
router.get('/my', verifyToken, async (req, res) => {
  try {
    // For demo - return empty array, workspaces will be shown after creation
    res.json({
      workspaces: []
    });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get workspace by slug
router.get('/:slug', verifyToken, async (req, res) => {
  try {
    console.log('Fetching workspace with slug:', req.params.slug);
    
    // Always return mock workspace for demo
    const workspaceName = req.params.slug.replace(/^workspace-/, '').replace(/-/g, ' ').toUpperCase();
    
    const mockWorkspace = {
      id: `workspace_${req.params.slug}`,
      name: `Workspace ${workspaceName}`,
      slug: req.params.slug,
      description: `This is the ${workspaceName} workspace`,
      inviteCode: workspaceName || 'ABC123',
      owner: {
        _id: req.user._id || req.user.firebaseUid,
        displayName: req.user.displayName,
        email: req.user.email,
        photoURL: req.user.photoURL
      },
      members: [{
        user: {
          _id: req.user._id || req.user.firebaseUid,
          displayName: req.user.displayName,
          email: req.user.email,
          photoURL: req.user.photoURL
        },
        role: 'admin'
      }],
      settings: {
        isPublic: false,
        allowGuestAccess: false,
        requireInvite: true
      },
      analytics: {
        totalMessages: 0,
        totalTasks: 0,
        completedTasks: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return res.json({ workspace: mockWorkspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update workspace
router.put('/:slug', verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const workspace = await Workspace.findOne({ slug: req.params.slug });

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is admin
    const member = workspace.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    workspace.name = name || workspace.name;
    workspace.description = description || workspace.description;
    await workspace.save();

    await workspace.populate('members.user', 'displayName email photoURL');
    await workspace.populate('owner', 'displayName email photoURL');

    res.json({
      workspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        owner: workspace.owner,
        members: workspace.members,
        settings: workspace.settings,
        analytics: workspace.analytics,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt
      }
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join workspace by code
router.post('/join', verifyToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || inviteCode.trim().length === 0) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    // Check database connection
    if (!checkConnection()) {
      // Return mock workspace for demo
      const mockWorkspace = {
        id: `workspace_${inviteCode}`,
        name: `Workspace ${inviteCode}`,
        slug: `workspace-${inviteCode.toLowerCase()}`,
        description: `Joined workspace with code ${inviteCode}`,
        inviteCode: inviteCode,
        owner: {
          _id: 'owner_id',
          displayName: 'Workspace Owner',
          email: 'owner@example.com',
          photoURL: null
        },
        members: [
          {
            user: {
              _id: 'owner_id',
              displayName: 'Workspace Owner',
              email: 'owner@example.com',
              photoURL: null
            },
            role: 'admin'
          },
          {
            user: {
              _id: req.user._id || req.user.firebaseUid,
              displayName: req.user.displayName,
              email: req.user.email,
              photoURL: req.user.photoURL
            },
            role: 'member'
          }
        ],
        settings: {
          isPublic: false,
          allowGuestAccess: false,
          requireInvite: true
        },
        analytics: {
          totalMessages: 0,
          totalTasks: 0,
          completedTasks: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`User ${req.user.displayName} joined workspace with code: ${inviteCode}`);

      return res.json({
        workspace: mockWorkspace,
        message: 'Successfully joined workspace!'
      });
    }

    // Find workspace by invite code
    const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() })
      .populate('owner', 'displayName email photoURL')
      .populate('members.user', 'displayName email photoURL');

    if (!workspace) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Check if user is already a member
    const isAlreadyMember = workspace.members.some(
      member => member.user._id.toString() === (req.user._id || req.user.firebaseUid).toString()
    );

    if (!isAlreadyMember) {
    // Add user as member
    workspace.members.push({
        user: req.user._id || req.user.firebaseUid,
      role: 'member'
    });
    await workspace.save();
    }

    console.log(`User ${req.user.displayName} joined workspace: ${workspace.name}`);

    res.json({
      workspace: {
        id: workspace._id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        inviteCode: workspace.inviteCode,
        owner: workspace.owner,
        members: workspace.members,
        settings: workspace.settings,
        analytics: workspace.analytics,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt
      },
      message: 'Successfully joined workspace!'
    });
  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get workspace invite info
router.get('/invite/:code', verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    
    // For demo - return mock workspace info
    const mockWorkspace = {
      name: `Workspace ${code}`,
      description: `Join this workspace using code ${code}`,
      memberCount: 1,
      owner: 'Workspace Owner'
    };

    res.json({
      workspace: mockWorkspace,
      inviteCode: code
    });
  } catch (error) {
    console.error('Get invite info error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Invite by email
router.post('/:slug/invite', verifyToken, async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;
    const { slug } = req.params;
    
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // For demo - simulate email invitation using stored or generated code
    const ws = demoWorkspaces.get(slug);
    const inviteCode = ws?.inviteCode || (function gen(){
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let res='';
      for(let i=0;i<8;i++) res+=chars.charAt(Math.floor(Math.random()*chars.length));
      return res;
    })();

    const inviteData = {
      workspaceSlug: slug,
      inviteCode: inviteCode,
      email: email.trim(),
      role: role,
      invitedBy: req.user.displayName,
      inviteLink: `http://localhost:5173/join/${slug}?code=${inviteCode}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    console.log('Demo Email Invitation SENT:', inviteData);

    res.json({
      message: 'Invitation sent successfully!',
      invite: inviteData
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

