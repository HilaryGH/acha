const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * Generates a downloadable gift card PDF for gift delivery orders
 * @param {Object} order - Order object with gift details
 * @param {Object} buyer - Buyer object
 * @returns {Promise<string>} - Path to the generated gift card PDF
 */
async function generateGiftCard(order, buyer) {
  try {
    // Create uploads/gift-cards directory if it doesn't exist
    const giftCardsDir = path.join(__dirname, '../uploads/gift-cards');
    if (!fs.existsSync(giftCardsDir)) {
      fs.mkdirSync(giftCardsDir, { recursive: true });
    }

    // Generate unique filename
    const filename = `gift-card-${order.uniqueId || order._id}-${Date.now()}.pdf`;
    const filepath = path.join(giftCardsDir, filename);

    // Create PDF document
    const doc = new PDFDocument({
      size: [600, 400],
      margin: 30
    });

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filepath));

    // Background gradient effect (simulated with rectangles)
    doc.rect(0, 0, 600, 400)
      .linearGradient(0, 0, 600, 400, '0%', '#f093fb', '100%', '#f5576c')
      .fill();

    // White content area
    doc.rect(20, 20, 560, 360)
      .fillColor('#ffffff')
      .fill();

    // Gift icon/emoji area
    doc.fontSize(60)
      .fillColor('#f5576c')
      .text('🎁', 250, 50, { align: 'center' });

    // Title
    doc.fontSize(32)
      .fillColor('#f5576c')
      .font('Helvetica-Bold')
      .text('Gift Card', 0, 120, { align: 'center' });

    // Gift details
    doc.fontSize(14)
      .fillColor('#333333')
      .font('Helvetica')
      .text('This gift card is presented to:', 50, 180, { align: 'left' });

    doc.fontSize(18)
      .fillColor('#f5576c')
      .font('Helvetica-Bold')
      .text(order.orderInfo?.recipientName || 'Recipient', 50, 205, { align: 'left' });

    // Gift occasion
    let currentY = 240;
    if (order.orderInfo?.giftOccasion) {
      doc.fontSize(14)
        .fillColor('#f5576c')
        .font('Helvetica-Bold')
        .text(`Occasion: ${order.orderInfo.giftOccasion}`, 50, currentY, { align: 'left' });
      currentY += 20;
    }

    // Gift type
    if (order.orderInfo?.giftType) {
      doc.fontSize(12)
        .fillColor('#666666')
        .font('Helvetica')
        .text(`Gift Type: ${order.orderInfo.giftType}`, 50, currentY, { align: 'left' });
      currentY += 20;
    }

    // Gift message
    if (order.orderInfo?.giftMessage) {
      doc.fontSize(12)
        .fillColor('#333333')
        .font('Helvetica-Oblique')
        .text(`"${order.orderInfo.giftMessage}"`, 50, currentY, {
          align: 'left',
          width: 500
        });
      currentY += 30;
    }

    // From section
    doc.fontSize(12)
      .fillColor('#666666')
      .font('Helvetica')
      .text('From:', 50, 310, { align: 'left' });

    doc.fontSize(14)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text(buyer.name || 'Acha Delivery', 50, 330, { align: 'left' });

    // Order ID
    doc.fontSize(10)
      .fillColor('#999999')
      .font('Helvetica')
      .text(`Order ID: ${order.uniqueId || order._id}`, 0, 360, { align: 'center' });

    // Date
    doc.fontSize(10)
      .fillColor('#999999')
      .font('Helvetica')
      .text(`Date: ${new Date().toLocaleDateString()}`, 0, 375, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);
    });

    // Return relative path for URL
    return `/uploads/gift-cards/${filename}`;
  } catch (error) {
    console.error('Error generating gift card:', error);
    throw new Error(`Failed to generate gift card: ${error.message}`);
  }
}

module.exports = { generateGiftCard };
