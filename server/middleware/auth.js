const { auth } = require('../config/firebase');
const User = require('../models/User');
const { checkConnection } = require('../config/database');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    
    const token = authHeader?.split(' ')[1];
    console.log('Extracted token:', token ? 'Token present' : 'No token');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Check database connection before querying
    if (!checkConnection()) {
      console.log('Database not connected, using Firebase user only');
      req.user = {
        _id: decodedToken.uid,
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null,
        subscription: { status: 'free' }
      };
      req.firebaseUser = decodedToken;
      return next();
    }

    // Find or create user in database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      user = new User({
        _id: decodedToken.uid,
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null
      });
      await user.save();
    } else {
      // Update last active
      user.lastActive = new Date();
      await user.save();
    }

    req.user = user;
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requirePro = async (req, res, next) => {
  try {
    if (req.user.subscription.status !== 'pro') {
      return res.status(403).json({ 
        error: 'Pro subscription required',
        message: 'This feature requires a Pro subscription'
      });
    }
    next();
  } catch (error) {
    console.error('Pro subscription check error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { verifyToken, requirePro };
