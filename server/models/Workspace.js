const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 8
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowGuestAccess: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    completedTasks: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate slug from name and invite code
workspaceSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Generate invite code if not present
  if (!this.inviteCode) {
    this.inviteCode = this.generateInviteCode();
  }
  
  this.updatedAt = new Date();
  next();
});

// Generate unique invite code
workspaceSchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Ensure unique slug and invite code
workspaceSchema.pre('save', async function(next) {
  if (this.isModified('slug')) {
    const count = await mongoose.model('Workspace').countDocuments({ 
      slug: this.slug,
      _id: { $ne: this._id }
    });
    if (count > 0) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }
  
  if (this.isModified('inviteCode')) {
    const count = await mongoose.model('Workspace').countDocuments({ 
      inviteCode: this.inviteCode,
      _id: { $ne: this._id }
    });
    if (count > 0) {
      this.inviteCode = this.generateInviteCode();
    }
  }
  
  next();
});

module.exports = mongoose.model('Workspace', workspaceSchema);
