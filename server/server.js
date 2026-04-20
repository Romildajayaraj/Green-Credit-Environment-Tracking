const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green-credit-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Socket.IO authentication middleware
const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Online users tracking
const onlineUsers = new Map();

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} connected`);
  
  // Add user to online users
  onlineUsers.set(socket.userId, {
    id: socket.userId,
    name: socket.user.name,
    email: socket.user.email,
    profileImage: socket.user.profileImage,
    socketId: socket.id,
    lastSeen: new Date()
  });

  // Join general chat room
  socket.join('general');
  
  // Broadcast updated online users list
  io.to('general').emit('onlineUsers', Array.from(onlineUsers.values()));

  // Handle typing events
  socket.on('typing', (data) => {
    socket.to('general').emit('userTyping', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: data.isTyping
    });
  });

  // Handle new message
  socket.on('newMessage', (messageData) => {
    // Broadcast to all users in the room except sender
    socket.to('general').emit('messageReceived', {
      ...messageData,
      sender: {
        _id: socket.userId,
        name: socket.user.name,
        profileImage: socket.user.profileImage
      }
    });
  });

  // Handle message reactions
  socket.on('messageReaction', (data) => {
    socket.to('general').emit('reactionUpdate', data);
  });

  // Handle message deletion
  socket.on('messageDeleted', (data) => {
    socket.to('general').emit('messageDeleted', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
    onlineUsers.delete(socket.userId);
    
    // Broadcast updated online users list
    io.to('general').emit('onlineUsers', Array.from(onlineUsers.values()));
    
    // Notify that user stopped typing
    socket.to('general').emit('userTyping', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping: false
    });
  });
});

// Make io available to routes
app.set('io', io);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin', require('./routes/admin-credits'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/profile', require('./routes/profile'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});