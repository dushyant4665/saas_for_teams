const mongoose = require('mongoose');

const editorContentSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    unique: true
  },
  content: {
    type: String,
    default: ''
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  lastEditedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
editorContentSchema.index({ workspace: 1 });

module.exports = mongoose.model('EditorContent', editorContentSchema);

