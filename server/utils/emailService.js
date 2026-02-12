const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Creates and returns a nodemailer transporter
 */
function createTransporter() {
  // Check if email credentials are provided
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('Email credentials not configured. Email sending will be disabled.');
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  return transporter;
}

/**
 * Sends a registration confirmation email with user ID
 */
async function sendRegistrationEmail(userEmail, userName, userId, role) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    // Format role name for display
    const roleDisplayNames = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'marketing_team': 'Marketing Team',
      'customer_support': 'Customer Support',
      'individual': 'Individual',
      'delivery_partner': 'Delivery Partner',
      'acha_sisters_delivery_partner': 'Acha Sisters Delivery Partner',
      'movers_packers': 'Acha Movers & Packers',
      'gift_delivery_partner': 'Gift Delivery Partner'
    };

    const roleDisplayName = roleDisplayNames[role] || role;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to Acha Platform - Your Registration is Complete',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .user-id {
              background-color: #fff;
              border: 2px solid #4CAF50;
              padding: 15px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #4CAF50;
              margin: 20px 0;
              border-radius: 5px;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Welcome to Acha Platform!</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            
            <p>Thank you for registering with Acha Platform as a <strong>${roleDisplayName}</strong>!</p>
            
            <p>Your registration has been successfully completed. Please save your unique user ID for future reference:</p>
            
            <div class="user-id">${userId}</div>
            
            <p>You can use this ID to identify yourself when contacting support or accessing certain features on our platform.</p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Acha Platform!
        
        Dear ${userName},
        
        Thank you for registering with Acha Platform as a ${roleDisplayName}!
        
        Your registration has been successfully completed. Please save your unique user ID for future reference:
        
        ${userId}
        
        You can use this ID to identify yourself when contacting support or accessing certain features on our platform.
        
        If you have any questions or need assistance, please don't hesitate to contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending registration email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendRegistrationEmail,
  createTransporter
};
