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

    // Create PDF document - smaller size
    const doc = new PDFDocument({
      size: [400, 250],
      margin: 20
    });

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filepath));

    // Background gradient effect (simulated with rectangles)
    doc.rect(0, 0, 400, 250)
      .linearGradient(0, 0, 400, 250, '0%', '#f093fb', '100%', '#f5576c')
      .fill();

    // White content area
    doc.rect(15, 15, 370, 220)
      .fillColor('#ffffff')
      .fill();

    // Gift icon/emoji area
    doc.fontSize(40)
      .fillColor('#f5576c')
      .text('🎁', 180, 25, { align: 'center' });

    // Title
    doc.fontSize(22)
      .fillColor('#f5576c')
      .font('Helvetica-Bold')
      .text('Gift Card', 0, 70, { align: 'center' });

    // Gift details
    doc.fontSize(10)
      .fillColor('#333333')
      .font('Helvetica')
      .text('This gift card is presented to:', 30, 105, { align: 'left' });

    doc.fontSize(14)
      .fillColor('#f5576c')
      .font('Helvetica-Bold')
      .text(order.orderInfo?.recipientName || 'Recipient', 30, 120, { align: 'left' });

    // Gift occasion
    let currentY = 140;
    if (order.orderInfo?.giftOccasion) {
      doc.fontSize(10)
        .fillColor('#f5576c')
        .font('Helvetica-Bold')
        .text(`Occasion: ${order.orderInfo.giftOccasion}`, 30, currentY, { align: 'left' });
      currentY += 15;
    }

    // Gift type
    if (order.orderInfo?.giftType) {
      doc.fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text(`Gift Type: ${order.orderInfo.giftType}`, 30, currentY, { align: 'left' });
      currentY += 15;
    }

    // Gift message
    if (order.orderInfo?.giftMessage) {
      doc.fontSize(9)
        .fillColor('#333333')
        .font('Helvetica-Oblique')
        .text(`"${order.orderInfo.giftMessage}"`, 30, currentY, {
          align: 'left',
          width: 340
        });
      currentY += 20;
    }

    // From section
    doc.fontSize(9)
      .fillColor('#666666')
      .font('Helvetica')
      .text('From:', 30, 195, { align: 'left' });

    doc.fontSize(11)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text(buyer.name || 'Acha Delivery', 30, 210, { align: 'left' });

    // Order ID
    doc.fontSize(8)
      .fillColor('#999999')
      .font('Helvetica')
      .text(`Order ID: ${order.uniqueId || order._id}`, 0, 225, { align: 'center' });

    // Date
    doc.fontSize(8)
      .fillColor('#999999')
      .font('Helvetica')
      .text(`Date: ${new Date().toLocaleDateString()}`, 0, 238, { align: 'center' });

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
