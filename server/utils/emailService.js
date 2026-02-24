const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Creates and returns a nodemailer transporter
 */
function createTransporter() {
  // Check if email credentials are provided
  const hasEmailService = process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
  const hasEmailHost = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
  
  if (!hasEmailService && !hasEmailHost) {
    console.warn('Email credentials not configured. Email sending will be disabled.');
    console.warn('Please set either EMAIL_SERVICE (for Gmail) or EMAIL_HOST (for other SMTP) in your .env file.');
    return null;
  }

  // If EMAIL_SERVICE is set (e.g., 'gmail'), use service-based config
  if (process.env.EMAIL_SERVICE) {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    return transporter;
  }

  // Otherwise, use host-based config
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

/**
 * Sends an order assignment notification email to delivery partner
 */
async function sendOrderAssignmentEmail(partnerEmail, partnerName, orderDetails) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: partnerEmail,
      subject: 'New Delivery Assignment - Order Assigned to You',
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
              background-color: #1E88E5;
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
            .order-details {
              background-color: #fff;
              border: 2px solid #1E88E5;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .order-id {
              font-size: 20px;
              font-weight: bold;
              color: #1E88E5;
              margin-bottom: 15px;
            }
            .detail-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #1E88E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
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
            <h1>New Delivery Assignment</h1>
          </div>
          <div class="content">
            <p>Dear ${partnerName},</p>
            
            <p>You have been assigned a new delivery order. Please review the details below:</p>
            
            <div class="order-details">
              <div class="order-id">Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}</div>
              
              <div class="detail-row">
                <span class="detail-label">Product:</span> ${orderDetails.productName || 'N/A'}
              </div>
              
              ${orderDetails.productDescription ? `
              <div class="detail-row">
                <span class="detail-label">Description:</span> ${orderDetails.productDescription}
              </div>
              ` : ''}
              
              ${orderDetails.deliveryDestination ? `
              <div class="detail-row">
                <span class="detail-label">Delivery Destination:</span> ${orderDetails.deliveryDestination}
              </div>
              ` : ''}
              
              ${orderDetails.preferredDeliveryDate ? `
              <div class="detail-row">
                <span class="detail-label">Preferred Delivery Date:</span> ${new Date(orderDetails.preferredDeliveryDate).toLocaleDateString()}
              </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="detail-label">Status:</span> ${orderDetails.status || 'Assigned'}
              </div>
            </div>
            
            <p>Please log in to your dashboard to view full order details and update the delivery status.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Order in Dashboard</a>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        New Delivery Assignment
        
        Dear ${partnerName},
        
        You have been assigned a new delivery order. Please review the details below:
        
        Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
        Product: ${orderDetails.productName || 'N/A'}
        ${orderDetails.productDescription ? `Description: ${orderDetails.productDescription}\n` : ''}
        ${orderDetails.deliveryDestination ? `Delivery Destination: ${orderDetails.deliveryDestination}\n` : ''}
        ${orderDetails.preferredDeliveryDate ? `Preferred Delivery Date: ${new Date(orderDetails.preferredDeliveryDate).toLocaleDateString()}\n` : ''}
        Status: ${orderDetails.status || 'Assigned'}
        
        Please log in to your dashboard to view full order details and update the delivery status.
        
        Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order assignment email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order assignment email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email to client when delivery partner accepts an order
 */
async function sendOrderAcceptedEmail(clientEmail, clientName, orderDetails, partnerName) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: 'Great News! Your Delivery Order Has Been Accepted',
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
              background-color: #43A047;
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
            .order-details {
              background-color: #fff;
              border: 2px solid #43A047;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .order-id {
              font-size: 20px;
              font-weight: bold;
              color: #43A047;
              margin-bottom: 15px;
            }
            .detail-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
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
            <h1>✅ Order Accepted!</h1>
          </div>
          <div class="content">
            <p>Dear ${clientName},</p>
            
            <p>Great news! Your delivery order has been accepted by <strong>${partnerName}</strong>.</p>
            
            <div class="order-details">
              <div class="order-id">Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}</div>
              
              <div class="detail-row">
                <span class="detail-label">Product:</span> ${orderDetails.productName || 'N/A'}
              </div>
              
              ${orderDetails.productDescription ? `
              <div class="detail-row">
                <span class="detail-label">Description:</span> ${orderDetails.productDescription}
              </div>
              ` : ''}
              
              ${orderDetails.deliveryDestination ? `
              <div class="detail-row">
                <span class="detail-label">Delivery Destination:</span> ${orderDetails.deliveryDestination}
              </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="detail-label">Delivery Partner:</span> ${partnerName}
              </div>
            </div>
            
            <p>Your order is now being processed. You will receive updates as the delivery progresses.</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Order Accepted!
        
        Dear ${clientName},
        
        Great news! Your delivery order has been accepted by ${partnerName}.
        
        Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
        Product: ${orderDetails.productName || 'N/A'}
        ${orderDetails.productDescription ? `Description: ${orderDetails.productDescription}\n` : ''}
        ${orderDetails.deliveryDestination ? `Delivery Destination: ${orderDetails.deliveryDestination}\n` : ''}
        Delivery Partner: ${partnerName}
        
        Your order is now being processed. You will receive updates as the delivery progresses.
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order accepted email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order accepted email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email to client when delivery partner rejects an order
 */
async function sendOrderRejectedEmail(clientEmail, clientName, orderDetails, partnerName) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: clientEmail,
      subject: 'Delivery Partner Declined - Your Order Will Be Reassigned',
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
              background-color: #E53935;
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
            .order-details {
              background-color: #fff;
              border: 2px solid #E53935;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .order-id {
              font-size: 20px;
              font-weight: bold;
              color: #E53935;
              margin-bottom: 15px;
            }
            .detail-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .info-box {
              background-color: #FFF3CD;
              border-left: 4px solid #FFC107;
              padding: 15px;
              margin: 20px 0;
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
            <h1>⚠️ Order Declined</h1>
          </div>
          <div class="content">
            <p>Dear ${clientName},</p>
            
            <p>We regret to inform you that the delivery partner <strong>${partnerName}</strong> has declined your delivery order.</p>
            
            <div class="order-details">
              <div class="order-id">Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}</div>
              
              <div class="detail-row">
                <span class="detail-label">Product:</span> ${orderDetails.productName || 'N/A'}
              </div>
              
              ${orderDetails.productDescription ? `
              <div class="detail-row">
                <span class="detail-label">Description:</span> ${orderDetails.productDescription}
              </div>
              ` : ''}
              
              ${orderDetails.deliveryDestination ? `
              <div class="detail-row">
                <span class="detail-label">Delivery Destination:</span> ${orderDetails.deliveryDestination}
              </div>
              ` : ''}
            </div>
            
            <div class="info-box">
              <p><strong>Don't worry!</strong> Your order will be automatically reassigned to another available delivery partner. We'll notify you once a new partner accepts your order.</p>
            </div>
            
            <p>If you have any questions or concerns, please contact our support team.</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Order Declined
        
        Dear ${clientName},
        
        We regret to inform you that the delivery partner ${partnerName} has declined your delivery order.
        
        Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
        Product: ${orderDetails.productName || 'N/A'}
        ${orderDetails.productDescription ? `Description: ${orderDetails.productDescription}\n` : ''}
        ${orderDetails.deliveryDestination ? `Delivery Destination: ${orderDetails.deliveryDestination}\n` : ''}
        
        Don't worry! Your order will be automatically reassigned to another available delivery partner. We'll notify you once a new partner accepts your order.
        
        If you have any questions or concerns, please contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order rejected email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order rejected email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email to traveler confirming their trip has been posted
 */
async function sendTripPostedEmail(travelerEmail, travelerName, tripDetails) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: travelerEmail,
      subject: 'Your Trip Has Been Posted Successfully!',
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
            .trip-details {
              background-color: #fff;
              border: 2px solid #4CAF50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .detail-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
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
            <h1>✅ Your Trip Has Been Posted!</h1>
          </div>
          <div class="content">
            <p>Dear ${travelerName},</p>
            
            <p>Great news! Your trip has been successfully posted on the Acha Platform.</p>
            
            <div class="trip-details">
              <div class="detail-row">
                <span class="detail-label">From:</span> ${tripDetails.currentLocation || 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">To:</span> ${tripDetails.destinationCity || 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Departure Date:</span> ${tripDetails.departureDate ? new Date(tripDetails.departureDate).toLocaleDateString() : 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Departure Time:</span> ${tripDetails.departureTime || 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Arrival Date:</span> ${tripDetails.arrivalDate ? new Date(tripDetails.arrivalDate).toLocaleDateString() : 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Arrival Time:</span> ${tripDetails.arrivalTime || 'N/A'}
              </div>
            </div>
            
            <p>Your trip is now visible to buyers looking for delivery services. If there are any matching orders, we'll notify you immediately!</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Your Trip Has Been Posted!
        
        Dear ${travelerName},
        
        Great news! Your trip has been successfully posted on the Acha Platform.
        
        From: ${tripDetails.currentLocation || 'N/A'}
        To: ${tripDetails.destinationCity || 'N/A'}
        Departure Date: ${tripDetails.departureDate ? new Date(tripDetails.departureDate).toLocaleDateString() : 'N/A'}
        Departure Time: ${tripDetails.departureTime || 'N/A'}
        Arrival Date: ${tripDetails.arrivalDate ? new Date(tripDetails.arrivalDate).toLocaleDateString() : 'N/A'}
        Arrival Time: ${tripDetails.arrivalTime || 'N/A'}
        
        Your trip is now visible to buyers looking for delivery services. If there are any matching orders, we'll notify you immediately!
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Trip posted email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending trip posted email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email to traveler when a match is found with buyer details
 */
async function sendMatchFoundEmail(travelerEmail, travelerName, matches) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    // Build matches HTML
    let matchesHtml = '';
    matches.forEach((match, index) => {
      const buyer = match.buyer;
      const order = match.order;
      matchesHtml += `
        <div style="background-color: #fff; border: 2px solid #1E88E5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #1E88E5; margin-top: 0;">Match #${index + 1}</h3>
          
          <div style="margin: 15px 0;">
            <h4 style="color: #333; margin-bottom: 10px;">Buyer Details:</h4>
            <div style="margin: 8px 0;">
              <strong>Name:</strong> ${buyer.name || 'N/A'}<br>
              <strong>Email:</strong> <a href="mailto:${buyer.email}">${buyer.email}</a><br>
              <strong>Phone:</strong> <a href="tel:${buyer.phone}">${buyer.phone}</a><br>
              ${buyer.whatsapp ? `<strong>WhatsApp:</strong> <a href="https://wa.me/${buyer.whatsapp.replace(/[^0-9]/g, '')}">${buyer.whatsapp}</a><br>` : ''}
              ${buyer.telegram ? `<strong>Telegram:</strong> ${buyer.telegram}<br>` : ''}
              <strong>Location:</strong> ${buyer.currentCity || 'N/A'}
            </div>
          </div>
          
          <div style="margin: 15px 0;">
            <h4 style="color: #333; margin-bottom: 10px;">Order Details:</h4>
            <div style="margin: 8px 0;">
              <strong>Order ID:</strong> ${order.uniqueId || order._id || 'N/A'}<br>
              <strong>Product:</strong> ${order.orderInfo?.productName || 'N/A'}<br>
              ${order.orderInfo?.productDescription ? `<strong>Description:</strong> ${order.orderInfo.productDescription}<br>` : ''}
              ${order.orderInfo?.deliveryDestination ? `<strong>Delivery Destination:</strong> ${order.orderInfo.deliveryDestination}<br>` : ''}
              ${order.orderInfo?.preferredDeliveryDate ? `<strong>Preferred Delivery Date:</strong> ${new Date(order.orderInfo.preferredDeliveryDate).toLocaleDateString()}<br>` : ''}
            </div>
          </div>
          
          <div style="background-color: #E3F2FD; padding: 15px; border-radius: 5px; margin-top: 15px;">
            <p style="margin: 0;"><strong>Next Steps:</strong> Please contact the buyer using the contact information above to discuss the order details and arrange pickup and delivery.</p>
          </div>
        </div>
      `;
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: travelerEmail,
      subject: `🎉 Great News! ${matches.length} Match${matches.length > 1 ? 'es' : ''} Found for Your Trip`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1E88E5;
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
            .info-box {
              background-color: #E8F5E9;
              border-left: 4px solid #4CAF50;
              padding: 15px;
              margin: 20px 0;
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
            <h1>🎉 Match Found!</h1>
          </div>
          <div class="content">
            <p>Dear ${travelerName},</p>
            
            <p>Excellent news! We found <strong>${matches.length} matching order${matches.length > 1 ? 's' : ''}</strong> for your trip!</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>What to do next:</strong> Review the buyer details below and contact them to discuss the order, arrange pickup, and confirm delivery details.</p>
            </div>
            
            ${matchesHtml}
            
            <p style="margin-top: 30px;"><strong>Important:</strong> Please contact the buyer(s) as soon as possible to secure the order. Orders are assigned on a first-come, first-served basis.</p>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Match Found!
        
        Dear ${travelerName},
        
        Excellent news! We found ${matches.length} matching order${matches.length > 1 ? 's' : ''} for your trip!
        
        What to do next: Review the buyer details below and contact them to discuss the order, arrange pickup, and confirm delivery details.
        
        ${matches.map((match, index) => `
        Match #${index + 1}:
        
        Buyer Details:
        Name: ${match.buyer.name || 'N/A'}
        Email: ${match.buyer.email}
        Phone: ${match.buyer.phone}
        ${match.buyer.whatsapp ? `WhatsApp: ${match.buyer.whatsapp}\n` : ''}
        ${match.buyer.telegram ? `Telegram: ${match.buyer.telegram}\n` : ''}
        Location: ${match.buyer.currentCity || 'N/A'}
        
        Order Details:
        Order ID: ${match.order.uniqueId || match.order._id || 'N/A'}
        Product: ${match.order.orderInfo?.productName || 'N/A'}
        ${match.order.orderInfo?.productDescription ? `Description: ${match.order.orderInfo.productDescription}\n` : ''}
        ${match.order.orderInfo?.deliveryDestination ? `Delivery Destination: ${match.order.orderInfo.deliveryDestination}\n` : ''}
        ${match.order.orderInfo?.preferredDeliveryDate ? `Preferred Delivery Date: ${new Date(match.order.orderInfo.preferredDeliveryDate).toLocaleDateString()}\n` : ''}
        
        Next Steps: Please contact the buyer using the contact information above to discuss the order details and arrange pickup and delivery.
        `).join('\n---\n')}
        
        Important: Please contact the buyer(s) as soon as possible to secure the order. Orders are assigned on a first-come, first-served basis.
        
        If you have any questions or need assistance, please contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Match found email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending match found email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email to buyer when a match is found (traveler or partner)
 */
async function sendMatchFoundEmailToBuyer(buyerEmail, buyerName, orderDetails, matchDetails) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const matchType = matchDetails.departureDate ? 'traveler' : 'partner';
    const matchTypeLabel = matchType === 'traveler' ? 'Traveler' : 'Delivery Partner';

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: `🎉 Great News! Match Found for Your Order`,
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
            .order-details {
              background-color: #fff;
              border: 2px solid #4CAF50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .match-details {
              background-color: #E8F5E9;
              border: 2px solid #4CAF50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .detail-row {
              margin: 10px 0;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
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
            <h1>🎉 Match Found!</h1>
          </div>
          <div class="content">
            <p>Dear ${buyerName},</p>
            
            <p>Great news! We found a matching ${matchTypeLabel.toLowerCase()} for your order!</p>
            
            <div class="order-details">
              <h3 style="color: #4CAF50; margin-top: 0;">Your Order Details</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span> ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Product:</span> ${orderDetails.productName || 'N/A'}
              </div>
              ${orderDetails.deliveryDestination ? `
              <div class="detail-row">
                <span class="detail-label">Delivery Destination:</span> ${orderDetails.deliveryDestination}
              </div>
              ` : ''}
              ${orderDetails.preferredDeliveryDate ? `
              <div class="detail-row">
                <span class="detail-label">Preferred Delivery Date:</span> ${new Date(orderDetails.preferredDeliveryDate).toLocaleDateString()}
              </div>
              ` : ''}
            </div>
            
            <div class="match-details">
              <h3 style="color: #4CAF50; margin-top: 0;">${matchTypeLabel} Details</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span> ${matchDetails.name || 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span> <a href="mailto:${matchDetails.email}">${matchDetails.email}</a>
              </div>
              <div class="detail-row">
                <span class="detail-label">Phone:</span> <a href="tel:${matchDetails.phone}">${matchDetails.phone}</a>
              </div>
              ${matchType === 'traveler' ? `
              ${matchDetails.currentLocation ? `
              <div class="detail-row">
                <span class="detail-label">From:</span> ${matchDetails.currentLocation}
              </div>
              ` : ''}
              ${matchDetails.destinationCity ? `
              <div class="detail-row">
                <span class="detail-label">To:</span> ${matchDetails.destinationCity}
              </div>
              ` : ''}
              ${matchDetails.departureDate ? `
              <div class="detail-row">
                <span class="detail-label">Departure Date:</span> ${new Date(matchDetails.departureDate).toLocaleDateString()}
              </div>
              ` : ''}
              ` : `
              ${matchDetails.city ? `
              <div class="detail-row">
                <span class="detail-label">Location:</span> ${matchDetails.city}
              </div>
              ` : ''}
              `}
            </div>
            
            <p><strong>Next Steps:</strong> Please proceed to payment to confirm your order. Your ${matchTypeLabel.toLowerCase()} has been automatically assigned and will be notified.</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Match Found!
        
        Dear ${buyerName},
        
        Great news! We found a matching ${matchTypeLabel.toLowerCase()} for your order!
        
        Your Order Details:
        Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
        Product: ${orderDetails.productName || 'N/A'}
        ${orderDetails.deliveryDestination ? `Delivery Destination: ${orderDetails.deliveryDestination}\n` : ''}
        ${orderDetails.preferredDeliveryDate ? `Preferred Delivery Date: ${new Date(orderDetails.preferredDeliveryDate).toLocaleDateString()}\n` : ''}
        
        ${matchTypeLabel} Details:
        Name: ${matchDetails.name || 'N/A'}
        Email: ${matchDetails.email}
        Phone: ${matchDetails.phone}
        ${matchType === 'traveler' ? `
        ${matchDetails.currentLocation ? `From: ${matchDetails.currentLocation}\n` : ''}
        ${matchDetails.destinationCity ? `To: ${matchDetails.destinationCity}\n` : ''}
        ${matchDetails.departureDate ? `Departure Date: ${new Date(matchDetails.departureDate).toLocaleDateString()}\n` : ''}
        ` : `
        ${matchDetails.city ? `Location: ${matchDetails.city}\n` : ''}
        `}
        
        Next Steps: Please proceed to payment to confirm your order. Your ${matchTypeLabel.toLowerCase()} has been automatically assigned and will be notified.
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Match found email sent to buyer:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending match found email to buyer:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendRegistrationEmail,
  sendOrderAssignmentEmail,
  sendOrderAcceptedEmail,
  sendOrderRejectedEmail,
  sendTripPostedEmail,
  sendMatchFoundEmail,
  sendMatchFoundEmailToBuyer,
  createTransporter
};
