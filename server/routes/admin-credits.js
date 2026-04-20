const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Award bonus credits to a user
router.post('/award-credits', adminAuth, async (req, res) => {
  try {
    const { userId, credits, reason } = req.body;

    if (!userId || !credits || credits <= 0) {
      return res.status(400).json({ message: 'Valid user ID and positive credits required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's credit score
    await User.findByIdAndUpdate(userId, {
      $inc: { creditScore: credits }
    });

    // You could also create a separate collection to track admin credit awards
    // For now, we'll calculate it as difference between total credits and upload credits

    res.json({ 
      message: 'Credits awarded successfully',
      user: user.name,
      creditsAwarded: credits,
      reason: reason || 'Admin bonus'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;