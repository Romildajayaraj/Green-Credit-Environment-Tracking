const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Upload = require('../models/Upload');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Profile image upload setup
const profileUploadDir = 'uploads/profiles';
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('uploads')
      .populate('complaints');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get additional stats
    const totalUploads = await Upload.countDocuments({ user: req.user.id });
    const approvedUploads = await Upload.countDocuments({ user: req.user.id, isApproved: true });
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const rank = await User.countDocuments({ 
      creditScore: { $gt: user.creditScore },
      isAdmin: false 
    }) + 1;

    res.json({
      ...user.toObject(),
      stats: {
        totalUploads,
        approvedUploads,
        rank,
        totalUsers,
        joinDate: user.createdAt,
        approvalRate: totalUploads > 0 ? Math.round((approvedUploads / totalUploads) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile information
router.put('/update', auth, async (req, res) => {
  try {
    const { name, email, phone, address, bio } = req.body;

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

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.id } 
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
    if (bio !== undefined) updateData.bio = bio.trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile image
router.post('/upload-image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Delete old profile image if exists
    const user = await User.findById(req.user.id);
    if (user.profileImage && user.profileImage !== '') {
      const oldImagePath = path.join(process.cwd(), user.profileImage.replace('/', ''));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user with new image
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile image updated successfully',
      profileImage: imageUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const { password, confirmDelete } = req.body;

    if (!password || confirmDelete !== 'DELETE') {
      return res.status(400).json({ message: 'Password and confirmation required' });
    }

    const user = await User.findById(req.user.id);
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    // Delete user's uploads and associated files
    const uploads = await Upload.find({ user: req.user.id });
    for (const upload of uploads) {
      const filePath = path.join(process.cwd(), upload.mediaUrl.replace('/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await Upload.deleteMany({ user: req.user.id });

    // Delete profile image
    if (user.profileImage) {
      const imagePath = path.join(process.cwd(), user.profileImage.replace('/', ''));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download account data
router.get('/download-data', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('uploads')
      .populate('complaints');

    const accountData = {
      personalInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        creditScore: user.creditScore,
        joinDate: user.createdAt
      },
      uploads: user.uploads.map(upload => ({
        title: upload.title,
        description: upload.description,
        isApproved: upload.isApproved,
        creditPoints: upload.creditPoints,
        createdAt: upload.createdAt,
        location: upload.location
      })),
      complaints: user.complaints.map(complaint => ({
        title: complaint.title,
        description: complaint.description,
        status: complaint.status,
        createdAt: complaint.createdAt,
        location: complaint.location
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="account-data-${user.name}-${Date.now()}.json"`);
    res.json(accountData);
  } catch (error) {
    console.error('Download data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;