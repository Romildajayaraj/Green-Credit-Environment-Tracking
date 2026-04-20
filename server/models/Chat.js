const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: {
      type: String,
      default: ''
    },
    files: [{
      filename: String,
      originalName: String,
      fileType: String,
      fileUrl: String,
      fileSize: Number
    }]
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'video', 'audio', 'emoji'],
    default: 'text'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Green Community Chat'
  },
  description: {
    type: String,
    default: 'General discussion about environmental topics'
  },
  type: {
    type: String,
    enum: ['public', 'private', 'group'],
    default: 'public'
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [messageSchema],
  settings: {
    allowFiles: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 100 * 1024 * 1024
    },
    allowedFileTypes: [{
      type: String,
      default: ['image', 'video', 'audio', 'document']
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);