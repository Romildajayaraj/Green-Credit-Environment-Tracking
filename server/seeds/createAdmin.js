const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/green-credit-tracker');
    
    const existingAdmin = await User.findOne({ email: 'admin@greencredit.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = new User({
      name: 'Administrator',
      email: 'admin@greencredit.com',
      password: 'admin123',
      phone: '1234567890',
      address: 'Admin Office',
      isAdmin: true,
      creditScore: 0
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@greencredit.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();