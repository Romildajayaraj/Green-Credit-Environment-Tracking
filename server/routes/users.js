const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Upload = require('../models/Upload');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('name creditScore profileImage')
      .sort({ creditScore: -1 })
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('uploads')
      .populate('complaints');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my-uploads', auth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    let query = { user: req.user.id };
    if (status && status !== 'all') {
      if (status === 'approved') query.isApproved = true;
      if (status === 'pending') query.isApproved = false;
      if (status === 'rejected') query.isApproved = { $exists: true, $eq: false };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const uploads = await Upload.find(query)
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Upload.countDocuments(query);

    res.json({
      uploads,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    console.log('Fetching stats for user:', req.user.id);
    
    const totalUploads = await Upload.countDocuments({ user: req.user.id });
    const approvedUploads = await Upload.countDocuments({ user: req.user.id, isApproved: true });
    const pendingUploads = await Upload.countDocuments({ user: req.user.id, isApproved: false });
    
    const totalLikes = await Upload.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $project: { likesCount: { $size: '$likes' } } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } }
    ]);

    const totalDislikes = await Upload.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $project: { dislikesCount: { $size: '$dislikes' } } },
      { $group: { _id: null, total: { $sum: '$dislikesCount' } } }
    ]);

    const totalComments = await Upload.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
      { $project: { commentsCount: { $size: '$comments' } } },
      { $group: { _id: null, total: { $sum: '$commentsCount' } } }
    ]);

    // Calculate total credits earned from uploads
    const creditsFromUploads = await Upload.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user.id), isApproved: true } },
      { $group: { _id: null, total: { $sum: '$creditPoints' } } }
    ]);

    const user = await User.findById(req.user.id).select('creditScore');
    const totalUsers = await User.countDocuments({ isAdmin: false });
    
    // Calculate rank
    const rank = await User.countDocuments({ 
      creditScore: { $gt: user.creditScore },
      isAdmin: false 
    }) + 1;

    // Debug logging
    console.log('Stats calculation:', {
      totalUploads,
      approvedUploads,
      creditsFromUploads: creditsFromUploads[0]?.total || 0,
      userTotalCredits: user.creditScore,
      totalLikes: totalLikes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0,
      totalDislikes: totalDislikes[0]?.total || 0
    });


    res.json({
      totalUploads,
      approvedUploads,
      pendingUploads,
      totalLikes: totalLikes[0]?.total || 0,
      totalDislikes: totalDislikes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0,
      creditScore: user.creditScore,
      creditsFromUploads: creditsFromUploads[0]?.total || 0,
      bonusCredits: user.creditScore - (creditsFromUploads[0]?.total || 0),
      rank,
      totalUsers,
      averageCreditsPerUpload: approvedUploads > 0 ? Math.round((creditsFromUploads[0]?.total || 0) / approvedUploads) : 0,
      approvalRate: totalUploads > 0 ? Math.round((approvedUploads / totalUploads) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check user's uploads data
router.get('/debug-uploads', auth, async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user.id }).select('title isApproved creditPoints likes dislikes comments createdAt');
    const user = await User.findById(req.user.id).select('creditScore name');
    
    const uploadStats = uploads.map(upload => ({
      title: upload.title,
      isApproved: upload.isApproved,
      creditPoints: upload.creditPoints,
      likes: upload.likes.length,
      dislikes: upload.dislikes.length,
      comments: upload.comments.length,
      createdAt: upload.createdAt
    }));

    res.json({
      user: {
        name: user.name,
        totalCreditScore: user.creditScore
      },
      totalUploads: uploads.length,
      approvedUploads: uploads.filter(u => u.isApproved).length,
      uploads: uploadStats,
      totalCreditsFromApprovedUploads: uploads
        .filter(u => u.isApproved)
        .reduce((sum, u) => sum + (u.creditPoints || 0), 0),
      totalLikes: uploads.reduce((sum, u) => sum + u.likes.length, 0),
      totalDislikes: uploads.reduce((sum, u) => sum + u.dislikes.length, 0),
      totalComments: uploads.reduce((sum, u) => sum + u.comments.length, 0)
    });
  } catch (error) {
    console.error('Debug uploads error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;