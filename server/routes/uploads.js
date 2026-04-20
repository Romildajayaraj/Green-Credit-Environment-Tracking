const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Upload = require('../models/Upload');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const uploadDir = 'uploads/media';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'), false);
    }
  }
});

router.post('/', auth, upload.single('media'), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: 'Media file is required' });
    }

    const { title, description, latitude, longitude, address } = req.body;

    if (!title || title.trim().length < 3) {
      return res.status(400).json({ message: 'Title must be at least 3 characters' });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters' });
    }
    if (!latitude || isNaN(parseFloat(latitude))) {
      return res.status(400).json({ message: 'Valid latitude required' });
    }
    if (!longitude || isNaN(parseFloat(longitude))) {
      return res.status(400).json({ message: 'Valid longitude required' });
    }
    if (!address || address.trim().length < 5) {
      return res.status(400).json({ message: 'Address must be at least 5 characters' });
    }

    const mediaUrl = `/uploads/media/${req.file.filename}`;

    const newUpload = new Upload({
      user: req.user.id,
      title,
      description,
      mediaUrl,
      mediaType: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address
      }
    });

    await newUpload.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { uploads: newUpload._id }
    });

    await newUpload.populate('user', 'name profileImage');

    res.status(201).json(newUpload);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const uploads = await Upload.find({ isApproved: true })
      .populate('user', 'name profileImage')
      .populate('comments.user', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Upload.countDocuments({ isApproved: true });

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

router.post('/:id/like', auth, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    const alreadyLiked = upload.likes.some(like => like.user.toString() === req.user.id);
    const alreadyDisliked = upload.dislikes.some(dislike => dislike.user.toString() === req.user.id);

    if (alreadyLiked) {
      upload.likes = upload.likes.filter(like => like.user.toString() !== req.user.id);
    } else {
      if (alreadyDisliked) {
        upload.dislikes = upload.dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
      }
      upload.likes.push({ user: req.user.id });
    }

    await upload.save();
    res.json(upload);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/dislike', auth, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    const alreadyDisliked = upload.dislikes.some(dislike => dislike.user.toString() === req.user.id);
    const alreadyLiked = upload.likes.some(like => like.user.toString() === req.user.id);

    if (alreadyDisliked) {
      upload.dislikes = upload.dislikes.filter(dislike => dislike.user.toString() !== req.user.id);
    } else {
      if (alreadyLiked) {
        upload.likes = upload.likes.filter(like => like.user.toString() !== req.user.id);
      }
      upload.dislikes.push({ user: req.user.id });
    }

    await upload.save();
    res.json(upload);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    if (!req.body.text || req.body.text.trim().length < 1) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const upload = await Upload.findById(req.params.id);
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' });
    }

    upload.comments.push({
      user: req.user.id,
      text: req.body.text
    });

    await upload.save();
    await upload.populate('comments.user', 'name profileImage');

    res.json(upload);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.params.userId, isApproved: true })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });

    res.json(uploads);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;