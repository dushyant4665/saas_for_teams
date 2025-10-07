const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
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

// Update the updatedAt field before saving
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set completedAt when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // Clear completedAt when status changes away from completed
  if (this.isModified('status') && this.status !== 'completed' && this.completedAt) {
    this.completedAt = null;
  }
  
  next();
});

// Index for efficient querying
taskSchema.index({ workspace: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
