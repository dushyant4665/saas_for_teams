const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text'
  },
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
