const nodemailer = require('nodemailer');
require('dotenv').config();

const testEmail = async () => {
  console.log('Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
  console.log('POLLUTION_DEPT_EMAIL:', process.env.POLLUTION_DEPT_EMAIL);

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

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');

    // Send test email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.POLLUTION_DEPT_EMAIL || 'fantasyphpproject@gmail.com',
      subject: 'Test Email from Green Credit Tracker',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify the email configuration.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Please check:');
      console.log('1. Enable 2-factor authentication on Gmail');
      console.log('2. Generate an app password (not your regular password)');
      console.log('3. Use the 16-character app password in EMAIL_PASS');
    }
  }
};

testEmail();