const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ChatRoom = require('../models/Chat');
const { auth } = require('../middleware/auth');

const router = express.Router();

const chatUploadDir = 'uploads/chat';
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mp3|wav|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ isActive: true })
      .populate('participants.user', 'name profileImage')
      .select('name description type participants createdAt')
      .sort({ createdAt: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/rooms/:roomId', auth, async (req, res) => {
  try {
    let room;
    
    if (req.params.roomId === 'general') {
      room = await ChatRoom.findOne({ name: 'Green Community Chat' })
        .populate('messages.sender', 'name profileImage')
        .populate('participants.user', 'name profileImage');
      
      if (!room) {
        room = new ChatRoom({
          name: 'Green Community Chat',
          description: 'General discussion about environmental topics',
          type: 'public',
          participants: [{
            user: req.user.id,
            role: 'member'
          }]
        });
        await room.save();
        await room.populate('messages.sender', 'name profileImage');
        await room.populate('participants.user', 'name profileImage');
      }
    } else {
      room = await ChatRoom.findById(req.params.roomId)
        .populate('messages.sender', 'name profileImage')
        .populate('participants.user', 'name profileImage');
    }

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const isParticipant = room.participants.some(p => p.user._id.toString() === req.user.id);
    if (!isParticipant && room.type === 'public') {
      room.participants.push({
        user: req.user.id,
        role: 'member'
      });
      await room.save();
    } else if (!isParticipant && room.type !== 'public') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(room);
  } catch (error) {
    console.error('Chat room error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rooms/:roomId/messages', auth, upload.array('files', 10), async (req, res) => {
  try {
    const { text, messageType, replyTo } = req.body;
    
    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    let room;
    if (req.params.roomId === 'general') {
      room = await ChatRoom.findOne({ name: 'Green Community Chat' });
      if (!room) {
        room = new ChatRoom({
          name: 'Green Community Chat',
          description: 'General discussion about environmental topics',
          type: 'public'
        });
        await room.save();
      }
    } else {
      room = await ChatRoom.findById(req.params.roomId);
    }

    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const files = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      fileType: file.mimetype.split('/')[0],
      fileUrl: `/uploads/chat/${file.filename}`,
      fileSize: file.size
    })) : [];

    const newMessage = {
      sender: req.user.id,
      content: {
        text: text || '',
        files
      },
      messageType: messageType || (files.length > 0 ? 'file' : 'text'),
      replyTo: replyTo || null
    };

    room.messages.push(newMessage);
    await room.save();

    await room.populate('messages.sender', 'name profileImage');
    const savedMessage = room.messages[room.messages.length - 1];

    // Emit real-time message to all connected clients
    const io = req.app.get('io');
    io.to('general').emit('messageReceived', savedMessage);

    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/rooms/:roomId/join', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const isAlreadyParticipant = room.participants.some(p => p.user.toString() === req.user.id);
    if (isAlreadyParticipant) {
      return res.status(400).json({ message: 'Already a participant' });
    }

    room.participants.push({
      user: req.user.id,
      role: 'member'
    });

    await room.save();
    res.json({ message: 'Joined chat room successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/rooms/:roomId/messages/:messageId/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    let room;
    
    if (req.params.roomId === 'general') {
      room = await ChatRoom.findOne({ name: 'Green Community Chat' });
    } else {
      room = await ChatRoom.findById(req.params.roomId);
    }
    
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const message = room.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const existingReaction = message.reactions.find(r => r.user.toString() === req.user.id);
    
    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        message.reactions = message.reactions.filter(r => r.user.toString() !== req.user.id);
      } else {
        existingReaction.emoji = emoji;
      }
    } else {
      message.reactions.push({
        user: req.user.id,
        emoji
      });
    }

    await room.save();
    
    // Emit real-time reaction update
    const io = req.app.get('io');
    io.to('general').emit('reactionUpdate', {
      messageId: req.params.messageId,
      reactions: message.reactions
    });
    
    res.json(message);
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/rooms/:roomId/messages/:messageId', auth, async (req, res) => {
  try {
    let room;
    
    if (req.params.roomId === 'general') {
      room = await ChatRoom.findOne({ name: 'Green Community Chat' });
    } else {
      room = await ChatRoom.findById(req.params.roomId);
    }
    
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }

    const message = room.messages.id(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.content.text = 'This message was deleted';
    message.content.files = [];

    await room.save();
    
    // Emit real-time message deletion
    const io = req.app.get('io');
    io.to('general').emit('messageDeleted', {
      messageId: req.params.messageId
    });
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;