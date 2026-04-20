const express = require('express');
const User = require('../models/User');
const Upload = require('../models/Upload');
const Complaint = require('../models/Complaint');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const totalUploads = await Upload.countDocuments();
    const pendingUploads = await Upload.countDocuments({ isApproved: false });
    const totalComplaints = await Complaint.countDocuments();
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });

    res.json({
      totalUsers,
      totalUploads,
      pendingUploads,
      totalComplaints,
      pendingComplaints
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search ? {
      isAdmin: false,
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : { isAdmin: false };

    const users = await User.find(query)
      .select('-password')
      .populate('uploads')
      .populate('complaints')
      .sort({ creditScore: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/uploads/pending', adminAuth, async (req, res) => {
  try {
    const uploads = await Upload.find({ isApproved: false })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(uploads);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/uploads/:id/approve', adminAuth, async (req, res) => {
  try {
    const { creditPoints } = req.body;
    
    const upload = await Upload.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: true,
        creditPoints: creditPoints || 10
      },
      { new: true }
    ).populate('user', 'name email');

    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    await User.findByIdAndUpdate(upload.user._id, {
      $inc: { creditScore: creditPoints || 10 }
    });

    res.json(upload);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/uploads/:id', adminAuth, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    await User.findByIdAndUpdate(upload.user, {
      $pull: { uploads: upload._id },
      $inc: { creditScore: -upload.creditPoints }
    });

    await Upload.findByIdAndDelete(req.params.id);

    res.json({ message: 'Upload deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/complaints', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    const query = status ? { status } : {};

    const complaints = await Complaint.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/complaints/:id/status', adminAuth, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status, adminResponse },
      { new: true }
    ).populate('user', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/leaderboard', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false })
      .select('name email creditScore profileImage createdAt')
      .sort({ creditScore: -1 })
      .limit(50);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/reports/monthly', adminAuth, async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const monthlyUploads = await Upload.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthlyComplaints = await Complaint.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthlyUsers = await User.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      isAdmin: false
    });

    res.json({
      monthlyUploads,
      monthlyComplaints,
      monthlyUsers,
      period: {
        start: startOfMonth,
        end: endOfMonth
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed user information for admin
router.get('/users/:id/details', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('uploads')
      .populate('complaints');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate user statistics
    const totalUploads = await Upload.countDocuments({ user: req.params.id });
    const approvedUploads = await Upload.countDocuments({ user: req.params.id, isApproved: true });
    const totalComplaints = await Complaint.countDocuments({ user: req.params.id });
    const totalUsers = await User.countDocuments({ isAdmin: false });
    
    // Calculate rank
    const rank = await User.countDocuments({ 
      creditScore: { $gt: user.creditScore },
      isAdmin: false 
    }) + 1;

    // Get all uploads and complaints
    const allUploads = await Upload.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .select('title description isApproved createdAt creditPoints location likes comments dislikes mediaUrl mediaType');

    const allComplaints = await Complaint.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .select('title description status createdAt location adminResponse images');

    res.json({
      ...user.toObject(),
      stats: {
        totalUploads,
        approvedUploads,
        totalComplaints,
        rank,
        totalUsers,
        approvalRate: totalUploads > 0 ? Math.round((approvedUploads / totalUploads) * 100) : 0
      },
      allUploads,
      allComplaints
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile by admin
router.put('/users/:id/update', adminAuth, async (req, res) => {
  try {
    const { name, email, phone, address, creditScore } = req.body;

    // Validation
    if (name && name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }
    if (email && !email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }
    if (phone && phone.trim().length < 10) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }
    if (address && address.trim().length < 5) {
      return res.status(400).json({ message: 'Address must be at least 5 characters' });
    }
    if (creditScore !== undefined && creditScore < 0) {
      return res.status(400).json({ message: 'Credit score cannot be negative' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();
    if (creditScore !== undefined) updateData.creditScore = creditScore;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;