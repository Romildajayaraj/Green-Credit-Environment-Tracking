const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {

    const { name, email, password, phone, address } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    if (!address || address.trim().length < 5) {
      return res.status(400).json({ message: 'Address must be at least 5 characters' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      phone,
      address
    });

    await user.save();

    const payload = {
      id: user.id,
      isAdmin: user.isAdmin
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        creditScore: user.creditScore,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      isAdmin: user.isAdmin
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        creditScore: user.creditScore,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        creditScore: req.user.creditScore,
        isAdmin: req.user.isAdmin,
        profileImage: req.user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password, phone, address, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    if (!address || address.trim().length < 5) {
      return res.status(400).json({ message: 'Address must be at least 5 characters' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      phone,
      address,
      isAdmin: true
    });

    await user.save();

    const payload = {
      id: user.id,
      isAdmin: user.isAdmin
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        creditScore: user.creditScore,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;