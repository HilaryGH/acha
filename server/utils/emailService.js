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

    // Generate reference number (same as userId for consistency)
    const referenceNumber = userId;

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
            .reference-number {
              background-color: #fff;
              border: 2px solid #1E88E5;
              padding: 15px;
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              color: #1E88E5;
              margin: 20px 0;
              border-radius: 5px;
            }
            .info-section {
              background-color: #E3F2FD;
              border-left: 4px solid #1E88E5;
              padding: 15px;
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
            
            <p>Your registration has been successfully completed. Please save the following information for future reference:</p>
            
            <div style="margin: 20px 0;">
              <p style="margin-bottom: 10px; font-weight: bold; color: #333;">Your Unique ID:</p>
              <div class="user-id">${userId}</div>
            </div>
            
            <div style="margin: 20px 0;">
              <p style="margin-bottom: 10px; font-weight: bold; color: #333;">Your Reference Number:</p>
              <div class="reference-number">${referenceNumber}</div>
            </div>
            
            <div class="info-section">
              <p style="margin: 0;"><strong>Important:</strong> Please keep this information safe. You can use your Unique ID and Reference Number to identify yourself when contacting support or accessing certain features on our platform.</p>
            </div>
            
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
        
        Your registration has been successfully completed. Please save the following information for future reference:
        
        Your Unique ID: ${userId}
        Your Reference Number: ${referenceNumber}
        
        Important: Please keep this information safe. You can use your Unique ID and Reference Number to identify yourself when contacting support or accessing certain features on our platform.
        
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
 * Sends an email to buyer when partner accepts order with final price
 */
async function sendOrderPriceConfirmationEmail(buyerEmail, buyerName, partnerName, orderDetails, pricingDetails) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: `💰 Final Price Confirmed - Order #${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}`,
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
            .price-box {
              background-color: #fff;
              border: 3px solid #1E88E5;
              padding: 25px;
              margin: 20px 0;
              border-radius: 5px;
              text-align: center;
            }
            .total-amount {
              font-size: 32px;
              font-weight: bold;
              color: #1E88E5;
              margin: 15px 0;
            }
            .price-breakdown {
              background-color: #f5f5f5;
              padding: 15px;
              margin: 15px 0;
              border-radius: 5px;
              text-align: left;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #ddd;
            }
            .price-row:last-child {
              border-bottom: none;
              font-weight: bold;
              font-size: 18px;
              margin-top: 10px;
              padding-top: 15px;
              border-top: 2px solid #1E88E5;
            }
            .order-details {
              background-color: #fff;
              border: 2px solid #1E88E5;
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
            .cta-button {
              display: inline-block;
              background-color: #1E88E5;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
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
            <h1>💰 Final Price Confirmed</h1>
          </div>
          <div class="content">
            <p>Dear ${buyerName},</p>
            
            <p>Great news! <strong>${partnerName}</strong> has accepted your delivery order and confirmed the final price.</p>
            
            <div class="order-details">
              <div style="font-size: 18px; font-weight: bold; color: #1E88E5; margin-bottom: 15px;">
                Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
              </div>
              
              ${orderDetails.productName ? `
              <div class="detail-row">
                <span class="detail-label">Product:</span> ${orderDetails.productName}
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
            
            <div class="price-box">
              <div style="font-size: 18px; color: #666; margin-bottom: 10px;">Total Amount</div>
              <div class="total-amount">${pricingDetails.totalAmount?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}</div>
              
              <div class="price-breakdown">
                ${pricingDetails.itemValue > 0 ? `
                <div class="price-row">
                  <span>Item Value:</span>
                  <span>${pricingDetails.itemValue?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}</span>
                </div>
                ` : ''}
                <div class="price-row">
                  <span>Delivery Fee:</span>
                  <span>${pricingDetails.deliveryFee?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}</span>
                </div>
                <div class="price-row">
                  <span>Service Fee:</span>
                  <span>${pricingDetails.serviceFee?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}</span>
                </div>
                <div class="price-row">
                  <span>Platform Fee:</span>
                  <span>${pricingDetails.platformFee?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}</span>
                </div>
                <div class="price-row">
                  <span>Total:</span>
                  <span>${pricingDetails.totalAmount?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}</span>
                </div>
              </div>
            </div>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://acha.com'}/orders/${orderDetails.orderId || orderDetails.uniqueId}" class="cta-button">
                Complete Payment Now
              </a>
            </p>
            
            <p>Please proceed with payment to confirm your order. Your delivery partner is ready to process your order once payment is completed.</p>
            
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
        Final Price Confirmed
        
        Dear ${buyerName},
        
        Great news! ${partnerName} has accepted your delivery order and confirmed the final price.
        
        Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
        Product: ${orderDetails.productName || 'N/A'}
        Delivery Partner: ${partnerName}
        
        Price Breakdown:
        ${pricingDetails.itemValue > 0 ? `Item Value: ${pricingDetails.itemValue?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}\n` : ''}
        Delivery Fee: ${pricingDetails.deliveryFee?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}
        Service Fee: ${pricingDetails.serviceFee?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}
        Platform Fee: ${pricingDetails.platformFee?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}
        Total: ${pricingDetails.totalAmount?.toFixed(2) || '0.00'} ${pricingDetails.currency || 'ETB'}
        
        Please proceed with payment to confirm your order.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order price confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending order price confirmation email:', error);
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
            
            ${orderDetails.pricing && orderDetails.pricing.totalAmount > 0 ? `
            <div class="order-details" style="background-color: #e8f5e9; border-color: #43A047;">
              <h3 style="color: #43A047; margin-top: 0; margin-bottom: 15px;">💰 Confirmed Price</h3>
              ${orderDetails.pricing.itemValue > 0 ? `
              <div class="detail-row">
                <span class="detail-label">Item Value:</span> ${orderDetails.pricing.itemValue.toFixed(2)} ${orderDetails.pricing.currency}
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="detail-label">Delivery Fee:</span> ${orderDetails.pricing.deliveryFee.toFixed(2)} ${orderDetails.pricing.currency}
              </div>
              <div class="detail-row">
                <span class="detail-label">Service Fee:</span> ${orderDetails.pricing.serviceFee.toFixed(2)} ${orderDetails.pricing.currency}
              </div>
              <div class="detail-row">
                <span class="detail-label">Platform Fee:</span> ${orderDetails.pricing.platformFee.toFixed(2)} ${orderDetails.pricing.currency}
              </div>
              <div class="detail-row" style="border-top: 2px solid #43A047; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 16px;">
                <span class="detail-label">Total Amount:</span> <span style="color: #43A047; font-size: 18px;">${orderDetails.pricing.totalAmount.toFixed(2)} ${orderDetails.pricing.currency}</span>
              </div>
            </div>
            ` : ''}
            
            <p>Your order is now being processed. ${orderDetails.pricing && orderDetails.pricing.totalAmount > 0 ? 'Please proceed with payment to complete your order.' : 'You will receive updates as the delivery progresses.'}</p>
            
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
        
        ${orderDetails.pricing && orderDetails.pricing.totalAmount > 0 ? `
        CONFIRMED PRICE:
        ${orderDetails.pricing.itemValue > 0 ? `Item Value: ${orderDetails.pricing.itemValue.toFixed(2)} ${orderDetails.pricing.currency}\n` : ''}Delivery Fee: ${orderDetails.pricing.deliveryFee.toFixed(2)} ${orderDetails.pricing.currency}
        Service Fee: ${orderDetails.pricing.serviceFee.toFixed(2)} ${orderDetails.pricing.currency}
        Platform Fee: ${orderDetails.pricing.platformFee.toFixed(2)} ${orderDetails.pricing.currency}
        TOTAL AMOUNT: ${orderDetails.pricing.totalAmount.toFixed(2)} ${orderDetails.pricing.currency}
        
        ` : ''}
        Your order is now being processed. ${orderDetails.pricing && orderDetails.pricing.totalAmount > 0 ? 'Please proceed with payment to complete your order.' : 'You will receive updates as the delivery progresses.'}
        
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

/**
 * Sends an email to gift recipient notifying them about an incoming gift
 */
async function sendGiftRecipientEmail(recipientEmail, recipientName, buyerName, giftDetails) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: '🎁 You Have a Gift Coming Your Way!',
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
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .gift-box {
              background-color: #fff;
              border: 3px solid #f5576c;
              padding: 25px;
              text-align: center;
              margin: 20px 0;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .gift-icon {
              font-size: 48px;
              margin-bottom: 15px;
            }
            .gift-details {
              background-color: #fff;
              border-left: 4px solid #f5576c;
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
            .message-box {
              background-color: #FFF9E6;
              border-left: 4px solid #FFD700;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
              font-style: italic;
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
            <h1>🎁 You Have a Gift!</h1>
          </div>
          <div class="content">
            <p>Dear ${recipientName},</p>
            
            <p>Great news! <strong>${buyerName}</strong> has sent you a special gift through Acha Delivery!</p>
            
            <div style="background-color: #E3F2FD; border-left: 4px solid #1E88E5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 16px;"><strong>🎁 Gift From:</strong> <span style="color: #1E88E5; font-size: 18px;">${buyerName}</span></p>
            </div>
            
            <div class="gift-box">
              <div class="gift-icon">🎁</div>
              <h2 style="color: #f5576c; margin: 10px 0;">A Gift is Coming Your Way!</h2>
            </div>
            
            <div class="gift-details">
              <h3 style="color: #f5576c; margin-top: 0;">Gift Details</h3>
              <div class="detail-row">
                <span class="detail-label">Gift Type:</span> ${giftDetails.giftType || 'Special Gift'}
              </div>
              ${giftDetails.giftMessage ? `
              <div class="message-box">
                <strong>Personal Message:</strong><br>
                "${giftDetails.giftMessage}"
              </div>
              ` : ''}
              ${giftDetails.deliveryAddress ? `
              <div class="detail-row">
                <span class="detail-label">Delivery Address:</span> ${giftDetails.deliveryAddress}
              </div>
              ` : ''}
              ${giftDetails.preferredDeliveryDate ? `
              <div class="detail-row">
                <span class="detail-label">Expected Delivery Date:</span> ${new Date(giftDetails.preferredDeliveryDate).toLocaleDateString()}
              </div>
              ` : ''}
            </div>
            
            <p>Your gift will be delivered to you soon. You'll receive another notification once it's on its way!</p>
            
            <p>Thank you for being part of the Acha Delivery community!</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        You Have a Gift!
        
        Dear ${recipientName},
        
        Great news! ${buyerName} has sent you a special gift through Acha Delivery!
        
        Gift Details:
        Gift Type: ${giftDetails.giftType || 'Special Gift'}
        ${giftDetails.giftMessage ? `Personal Message: "${giftDetails.giftMessage}"\n` : ''}
        ${giftDetails.deliveryAddress ? `Delivery Address: ${giftDetails.deliveryAddress}\n` : ''}
        ${giftDetails.preferredDeliveryDate ? `Expected Delivery Date: ${new Date(giftDetails.preferredDeliveryDate).toLocaleDateString()}\n` : ''}
        
        Your gift will be delivered to you soon. You'll receive another notification once it's on its way!
        
        Thank you for being part of the Acha Delivery community!
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Gift recipient email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending gift recipient email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an email to buyer when a delivery partner submits an offer
 */
async function sendPartnerOfferNotificationEmail(buyerEmail, buyerName, orderDetails, partnerDetails, offerDetails) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: '🎉 New Delivery Partner Offer Received!',
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
            .offer-details {
              background-color: #E8F5E9;
              border: 2px solid #4CAF50;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .partner-details {
              background-color: #FFF3E0;
              border: 2px solid #FF9800;
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
              background-color: #1E88E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .info-box {
              background-color: #E3F2FD;
              border-left: 4px solid #1E88E5;
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
            <h1>🎉 New Offer Received!</h1>
          </div>
          <div class="content">
            <p>Dear ${buyerName},</p>
            
            <p>Great news! A delivery partner has submitted an offer for your order.</p>
            
            <div class="order-details">
              <h3 style="color: #1E88E5; margin-top: 0;">Your Order Details</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span> ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
              </div>
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
            
            <div class="partner-details">
              <h3 style="color: #FF9800; margin-top: 0;">Delivery Partner Information</h3>
              <div class="detail-row">
                <span class="detail-label">Partner Name:</span> ${partnerDetails.name || partnerDetails.companyName || 'N/A'}
              </div>
              ${partnerDetails.companyName && partnerDetails.name !== partnerDetails.companyName ? `
              <div class="detail-row">
                <span class="detail-label">Company:</span> ${partnerDetails.companyName}
              </div>
              ` : ''}
              ${partnerDetails.city ? `
              <div class="detail-row">
                <span class="detail-label">Location:</span> ${partnerDetails.city}
              </div>
              ` : ''}
            </div>
            
            <div class="offer-details">
              <h3 style="color: #4CAF50; margin-top: 0;">Offer Details</h3>
              ${offerDetails.offerPrice ? `
              <div class="detail-row">
                <span class="detail-label">Offer Price:</span> ETB ${offerDetails.offerPrice.toLocaleString()}
              </div>
              ` : ''}
              ${offerDetails.estimatedDeliveryTime ? `
              <div class="detail-row">
                <span class="detail-label">Estimated Delivery Time:</span> ${offerDetails.estimatedDeliveryTime}
              </div>
              ` : ''}
              ${offerDetails.message ? `
              <div class="detail-row">
                <span class="detail-label">Message:</span> ${offerDetails.message}
              </div>
              ` : ''}
            </div>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>Next Steps:</strong> Please log in to your dashboard to review this offer and other offers you may have received. You can select the best offer that suits your needs.</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/track/${orderDetails.orderId || orderDetails._id || ''}" class="button">View Order & Offers</a>
            
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
        New Offer Received!
        
        Dear ${buyerName},
        
        Great news! A delivery partner has submitted an offer for your order.
        
        Your Order Details:
        Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
        Product: ${orderDetails.productName || 'N/A'}
        ${orderDetails.productDescription ? `Description: ${orderDetails.productDescription}\n` : ''}
        ${orderDetails.deliveryDestination ? `Delivery Destination: ${orderDetails.deliveryDestination}\n` : ''}
        
        Delivery Partner Information:
        Partner Name: ${partnerDetails.name || partnerDetails.companyName || 'N/A'}
        ${partnerDetails.companyName && partnerDetails.name !== partnerDetails.companyName ? `Company: ${partnerDetails.companyName}\n` : ''}
        ${partnerDetails.city ? `Location: ${partnerDetails.city}\n` : ''}
        
        Offer Details:
        ${offerDetails.offerPrice ? `Offer Price: ETB ${offerDetails.offerPrice.toLocaleString()}\n` : ''}
        ${offerDetails.estimatedDeliveryTime ? `Estimated Delivery Time: ${offerDetails.estimatedDeliveryTime}\n` : ''}
        ${offerDetails.message ? `Message: ${offerDetails.message}\n` : ''}
        
        Next Steps: Please log in to your dashboard to review this offer and other offers you may have received. You can select the best offer that suits your needs.
        
        View Order: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/track/${orderDetails.orderId || orderDetails._id || ''}
        
        If you have any questions, please contact our support team.
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Partner offer notification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending partner offer notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a confirmation email to gift sender when their gift order is successful
 */
async function sendGiftSenderConfirmationEmail(senderEmail, senderName, orderDetails, giftDetails) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('Email not sent - email service not configured');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Acha Platform'}" <${process.env.EMAIL_USER}>`,
      to: senderEmail,
      subject: '✅ Your Gift Order Has Been Confirmed!',
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
              background: linear-gradient(135deg, #43A047 0%, #1E88E5 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-box {
              background-color: #E8F5E9;
              border: 3px solid #43A047;
              padding: 25px;
              text-align: center;
              margin: 20px 0;
              border-radius: 10px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .order-details {
              background-color: #fff;
              border-left: 4px solid #1E88E5;
              padding: 20px;
              margin: 20px 0;
              border-radius: 5px;
            }
            .gift-details {
              background-color: #FFF9E6;
              border-left: 4px solid #FFD700;
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
            .recipient-info {
              background-color: #E3F2FD;
              border-left: 4px solid #1E88E5;
              padding: 20px;
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
            <h1>✅ Gift Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Dear ${senderName},</p>
            
            <div class="success-box">
              <h2 style="color: #43A047; margin: 10px 0;">🎁 Your Gift Order Has Been Successfully Processed!</h2>
              <p style="margin: 0;">Thank you for choosing Acha Delivery to send your gift.</p>
            </div>
            
            <div class="order-details">
              <h3 style="color: #1E88E5; margin-top: 0;">Order Details</h3>
              <div class="detail-row">
                <span class="detail-label">Order ID:</span> ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Order Status:</span> <strong style="color: #43A047;">Confirmed & Paid</strong>
              </div>
              ${orderDetails.preferredDeliveryDate ? `
              <div class="detail-row">
                <span class="detail-label">Expected Delivery Date:</span> ${new Date(orderDetails.preferredDeliveryDate).toLocaleDateString()}
              </div>
              ` : ''}
            </div>
            
            <div class="gift-details">
              <h3 style="color: #FFD700; margin-top: 0;">Gift Information</h3>
              <div class="detail-row">
                <span class="detail-label">Gift Type:</span> ${giftDetails.giftType || 'Special Gift'}
              </div>
              ${giftDetails.giftDescription ? `
              <div class="detail-row">
                <span class="detail-label">Description:</span> ${giftDetails.giftDescription}
              </div>
              ` : ''}
              ${giftDetails.giftPrice ? `
              <div class="detail-row">
                <span class="detail-label">Price:</span> ETB ${giftDetails.giftPrice.toLocaleString()}
              </div>
              ` : ''}
              ${giftDetails.partnerName ? `
              <div class="detail-row">
                <span class="detail-label">Gift Provider:</span> ${giftDetails.partnerName}
              </div>
              ` : ''}
            </div>
            
            <div class="recipient-info">
              <h3 style="color: #1E88E5; margin-top: 0;">Recipient Information</h3>
              <div class="detail-row">
                <span class="detail-label">Recipient Name:</span> ${giftDetails.recipientName || 'N/A'}
              </div>
              ${giftDetails.recipientEmail ? `
              <div class="detail-row">
                <span class="detail-label">Recipient Email:</span> ${giftDetails.recipientEmail}
              </div>
              ` : ''}
              ${giftDetails.recipientPhone ? `
              <div class="detail-row">
                <span class="detail-label">Recipient Phone:</span> ${giftDetails.recipientPhone}
              </div>
              ` : ''}
              ${giftDetails.recipientAddress ? `
              <div class="detail-row">
                <span class="detail-label">Delivery Address:</span> ${giftDetails.recipientAddress}
              </div>
              ` : ''}
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul style="line-height: 1.8;">
              <li>Your gift has been assigned to a delivery partner</li>
              <li>The recipient has been notified about the incoming gift</li>
              <li>You'll receive updates as the delivery progresses</li>
              <li>The recipient will receive the gift on the expected delivery date</li>
            </ul>
            
            <p>You can track your order status at any time through your dashboard.</p>
            
            <p>Thank you for using Acha Delivery!</p>
            
            <p>Best regards,<br>The Acha Platform Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Gift Order Confirmed!
        
        Dear ${senderName},
        
        Your Gift Order Has Been Successfully Processed!
        Thank you for choosing Acha Delivery to send your gift.
        
        Order Details:
        Order ID: ${orderDetails.orderId || orderDetails.uniqueId || 'N/A'}
        Order Status: Confirmed & Paid
        ${orderDetails.preferredDeliveryDate ? `Expected Delivery Date: ${new Date(orderDetails.preferredDeliveryDate).toLocaleDateString()}\n` : ''}
        
        Gift Information:
        Gift Type: ${giftDetails.giftType || 'Special Gift'}
        ${giftDetails.giftDescription ? `Description: ${giftDetails.giftDescription}\n` : ''}
        ${giftDetails.giftPrice ? `Price: ETB ${giftDetails.giftPrice.toLocaleString()}\n` : ''}
        ${giftDetails.partnerName ? `Gift Provider: ${giftDetails.partnerName}\n` : ''}
        
        Recipient Information:
        Recipient Name: ${giftDetails.recipientName || 'N/A'}
        ${giftDetails.recipientEmail ? `Recipient Email: ${giftDetails.recipientEmail}\n` : ''}
        ${giftDetails.recipientPhone ? `Recipient Phone: ${giftDetails.recipientPhone}\n` : ''}
        ${giftDetails.recipientAddress ? `Delivery Address: ${giftDetails.recipientAddress}\n` : ''}
        
        What happens next?
        - Your gift has been assigned to a delivery partner
        - The recipient has been notified about the incoming gift
        - You'll receive updates as the delivery progresses
        - The recipient will receive the gift on the expected delivery date
        
        You can track your order status at any time through your dashboard.
        
        Thank you for using Acha Delivery!
        
        Best regards,
        The Acha Platform Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Gift sender confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending gift sender confirmation email:', error);
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
  sendGiftRecipientEmail,
  sendGiftSenderConfirmationEmail,
  sendPartnerOfferNotificationEmail,
  sendOrderPriceConfirmationEmail,
  createTransporter
};
