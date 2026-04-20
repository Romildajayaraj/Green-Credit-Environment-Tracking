const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

const uploadDir = 'uploads/complaints';
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
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const { title, description, latitude, longitude, address } = req.body;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({ message: 'Title must be at least 5 characters' });
    }
    if (!description || description.trim().length < 20) {
      return res.status(400).json({ message: 'Description must be at least 20 characters' });
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

    const imageUrls = req.files.map(file => `/uploads/complaints/${file.filename}`);

    const complaint = new Complaint({
      user: req.user.id,
      title,
      description,
      imageUrls,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address
      }
    });

    await complaint.save();

    await User.findByIdAndUpdate(req.user.id, {
      $push: { complaints: complaint._id }
    });

    console.log('Complaint saved successfully, attempting to send email...');
    console.log('Files received:', req.files?.length || 0);
    console.log('Email config:', {
      user: process.env.EMAIL_USER,
      hasPass: !!process.env.EMAIL_PASS,
      to: process.env.POLLUTION_DEPT_EMAIL || 'fantasyphpproject@gmail.com'
    });

    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.POLLUTION_DEPT_EMAIL || 'fantasyphpproject@gmail.com',
        subject: `Pollution Complaint: ${title}`,
        html: `
          <h2>New Pollution Complaint</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Location:</strong> ${address}</p>
          <p><strong>Coordinates:</strong> ${latitude}, ${longitude}</p>
          <p><strong>Reported by:</strong> ${req.user.name} (${req.user.email})</p>
          <p><strong>Images:</strong></p>
          <ul>
            ${imageUrls.map((url, index) => `<li><a href="${process.env.BASE_URL || 'http://localhost:5000'}${url}">View Image ${index + 1}</a></li>`).join('')}
          </ul>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `,
        attachments: req.files.map((file, index) => {
          const filePath = path.resolve(process.cwd(), 'uploads', 'complaints', file.filename);
          console.log(`Attachment ${index + 1} path:`, filePath);
          console.log(`File exists:`, fs.existsSync(filePath));
          if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
          }
          return {
            filename: `complaint-image-${index + 1}${path.extname(file.filename)}`,
            path: filePath
          };
        }).filter((attachment, index) => {
          const exists = fs.existsSync(attachment.path);
          if (!exists) {
            console.error(`Skipping attachment ${index + 1} - file not found`);
          }
          return exists;
        })
      };

      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        attachmentCount: mailOptions.attachments.length
      });

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      
      await complaint.updateOne({ emailSent: true });
      console.log(`Email sent successfully with ${req.files.length} attachments`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      console.error('Full error:', emailError);
      
      await complaint.updateOne({ emailSent: false });
    }

    await complaint.populate('user', 'name email');
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/user', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('user', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;