const express = require('express');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const { checkConnection } = require('../config/database');

const router = express.Router();

// Demo endpoint for testing without auth
router.get('/demo-user', (req, res) => {
  res.json({
    user: {
      id: 'demo_user_123',
      email: 'demo@example.com',
      displayName: 'Demo User',
      photoURL: null,
      subscription: { status: 'free' },
      workspaces: []
    }
  });
});

// Verify Firebase token endpoint
router.post('/verify-token', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    
    if (!checkConnection()) {
      // Return user data without database operations when DB is disconnected
      return res.json({
        user: {
          id: user._id || user.firebaseUid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          subscription: user.subscription || { status: 'free' },
          workspaces: []
        }
      });
    }
    
    // Populate workspaces
    await user.populate('workspaces');
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        subscription: user.subscription,
        workspaces: user.workspaces
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    if (!checkConnection()) {
      // Return user data without database operations when DB is disconnected
      return res.json({
        user: {
          id: req.user._id || req.user.firebaseUid,
          email: req.user.email,
          displayName: req.user.displayName,
          photoURL: req.user.photoURL,
          subscription: req.user.subscription || { status: 'free' },
          workspaces: [],
          lastActive: new Date().toISOString()
        }
      });
    }
    
    const user = await User.findById(req.user._id).populate('workspaces');
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        subscription: user.subscription,
        workspaces: user.workspaces,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        displayName: displayName || req.user.displayName,
        photoURL: photoURL || req.user.photoURL
      },
      { new: true }
    );
    
    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

