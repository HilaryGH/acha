const Partner = require('../models/Partner');
const Traveller = require('../models/Traveller');
const WomenInitiative = require('../models/WomenInitiative');
const Buyer = require('../models/Buyer');
const Sender = require('../models/Sender');
const Receiver = require('../models/Receiver');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Get all documents that need verification
 * Aggregates documents from Partners, Travellers, WomenInitiatives, etc.
 */
const getAllDocuments = async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const documents = [];
    
    // Get Partners with documents
    const partnerQuery = {};
    if (status) partnerQuery.status = status;
    
    const partners = await Partner.find(partnerQuery);
    partners.forEach(partner => {
      const docs = [];
      if (partner.idDocument) docs.push({ type: 'idDocument', path: partner.idDocument, name: 'ID Document' });
      if (partner.license) docs.push({ type: 'license', path: partner.license, name: 'License' });
      if (partner.tradeRegistration) docs.push({ type: 'tradeRegistration', path: partner.tradeRegistration, name: 'Trade Registration' });
      if (partner.tin) docs.push({ type: 'tin', path: partner.tin, name: 'TIN' });
      if (partner.businessLicense) docs.push({ type: 'businessLicense', path: partner.businessLicense, name: 'Business License' });
      if (partner.photo) docs.push({ type: 'photo', path: partner.photo, name: 'Photo' });
      
      if (docs.length > 0) {
        documents.push({
          id: partner._id,
          uniqueId: partner.uniqueId,
          entityType: 'partner',
          entityName: partner.name,
          email: partner.email,
          phone: partner.phone,
          status: partner.status,
          documents: docs,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt
        });
      }
    });
    
    // Get Travellers with documents
    const travellerQuery = {};
    if (status) travellerQuery.status = status;
    
    const travellers = await Traveller.find(travellerQuery);
    travellers.forEach(traveller => {
      const docs = [];
      
      if (traveller.travellerType === 'international') {
        if (traveller.internationalDocuments?.flightTicket) {
          docs.push({ type: 'flightTicket', path: traveller.internationalDocuments.flightTicket, name: 'Flight Ticket' });
        }
        if (traveller.internationalDocuments?.visa) {
          docs.push({ type: 'visa', path: traveller.internationalDocuments.visa, name: 'Visa' });
        }
        if (traveller.internationalDocuments?.passport) {
          docs.push({ type: 'passport', path: traveller.internationalDocuments.passport, name: 'Passport' });
        }
        if (traveller.internationalDocuments?.yellowCard) {
          docs.push({ type: 'yellowCard', path: traveller.internationalDocuments.yellowCard, name: 'Yellow Card' });
        }
      } else {
        if (traveller.domesticDocuments?.governmentID) {
          docs.push({ type: 'governmentID', path: traveller.domesticDocuments.governmentID, name: 'Government ID' });
        }
        if (traveller.domesticDocuments?.flightTicket) {
          docs.push({ type: 'flightTicket', path: traveller.domesticDocuments.flightTicket, name: 'Flight Ticket' });
        }
        if (traveller.domesticDocuments?.photo) {
          docs.push({ type: 'photo', path: traveller.domesticDocuments.photo, name: 'Photo' });
        }
      }
      
      if (docs.length > 0) {
        documents.push({
          id: traveller._id,
          uniqueId: traveller.uniqueId,
          entityType: 'traveller',
          entityName: traveller.name,
          email: traveller.email,
          phone: traveller.phone,
          whatsapp: traveller.whatsapp,
          telegram: traveller.telegram,
          travellerType: traveller.travellerType,
          status: traveller.status,
          // Trip details
          currentLocation: traveller.currentLocation,
          destinationCity: traveller.destinationCity,
          departureDate: traveller.departureDate,
          departureTime: traveller.departureTime,
          arrivalDate: traveller.arrivalDate,
          arrivalTime: traveller.arrivalTime,
          bankAccount: traveller.bankAccount,
          documents: docs,
          createdAt: traveller.createdAt,
          updatedAt: traveller.updatedAt
        });
      }
    });
    
    // Get WomenInitiatives with documents
    const womenQuery = {};
    if (status) womenQuery.status = status;
    
    const womenInitiatives = await WomenInitiative.find(womenQuery);
    womenInitiatives.forEach(women => {
      const docs = [];
      if (women.idDocument) docs.push({ type: 'idDocument', path: women.idDocument, name: 'ID Document' });
      if (women.profilePhoto) docs.push({ type: 'profilePhoto', path: women.profilePhoto, name: 'Profile Photo' });
      if (women.certificates) docs.push({ type: 'certificates', path: women.certificates, name: 'Certificates' });
      
      if (docs.length > 0) {
        documents.push({
          id: women._id,
          uniqueId: women.uniqueId,
          entityType: 'womenInitiative',
          entityName: women.fullName,
          email: women.email,
          phone: women.phone,
          status: women.status,
          documents: docs,
          createdAt: women.createdAt,
          updatedAt: women.updatedAt
        });
      }
    });
    
    // Get Buyers with documents
    const buyers = await Buyer.find({ idDocument: { $exists: true, $ne: null } });
    buyers.forEach(buyer => {
      if (buyer.idDocument) {
        documents.push({
          id: buyer._id,
          uniqueId: buyer.uniqueId,
          entityType: 'buyer',
          entityName: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
          status: buyer.status,
          documents: [{ type: 'idDocument', path: buyer.idDocument, name: 'ID Document' }],
          createdAt: buyer.createdAt,
          updatedAt: buyer.updatedAt
        });
      }
    });
    
    // Get Senders with documents
    const senders = await Sender.find({ idDocument: { $exists: true, $ne: null } });
    senders.forEach(sender => {
      if (sender.idDocument) {
        documents.push({
          id: sender._id,
          uniqueId: sender.uniqueId,
          entityType: 'sender',
          entityName: sender.name,
          email: sender.email,
          phone: sender.phone,
          status: sender.status,
          documents: [{ type: 'idDocument', path: sender.idDocument, name: 'ID Document' }],
          createdAt: sender.createdAt,
          updatedAt: sender.updatedAt
        });
      }
    });
    
    // Get Receivers with documents
    const receivers = await Receiver.find({ idDocument: { $exists: true, $ne: null } });
    receivers.forEach(receiver => {
      if (receiver.idDocument) {
        documents.push({
          id: receiver._id,
          uniqueId: receiver.uniqueId,
          entityType: 'receiver',
          entityName: receiver.name,
          email: receiver.email,
          phone: receiver.phone,
          status: receiver.status,
          documents: [{ type: 'idDocument', path: receiver.idDocument, name: 'ID Document' }],
          createdAt: receiver.createdAt,
          updatedAt: receiver.updatedAt
        });
      }
    });
    
    // Filter by type if provided
    let filteredDocuments = documents;
    if (type) {
      filteredDocuments = documents.filter(doc => doc.entityType === type);
    }
    
    // Sort by createdAt descending
    filteredDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      status: 'success',
      count: filteredDocuments.length,
      data: {
        documents: filteredDocuments
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get documents'
    });
  }
};

/**
 * Verify/Approve/Reject documents for an entity
 */
const verifyDocuments = async (req, res) => {
  try {
    const { entityType, entityId, action, documentType, reason } = req.body;
    const adminId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    
    if (!entityType || !entityId || !action) {
      return res.status(400).json({
        status: 'error',
        message: 'Entity type, entity ID, and action are required'
      });
    }
    
    if (!['approve', 'reject', 'verify'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Action must be approve, reject, or verify'
      });
    }
    
    let entity;
    let entityModel;
    
    // Determine which model to use
    switch (entityType) {
      case 'partner':
        entityModel = Partner;
        break;
      case 'traveller':
        entityModel = Traveller;
        break;
      case 'womenInitiative':
        entityModel = WomenInitiative;
        break;
      case 'buyer':
        entityModel = Buyer;
        break;
      case 'sender':
        entityModel = Sender;
        break;
      case 'receiver':
        entityModel = Receiver;
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid entity type'
        });
    }
    
    entity = await entityModel.findById(entityId);
    if (!entity) {
      return res.status(404).json({
        status: 'error',
        message: 'Entity not found'
      });
    }
    
    // Update status based on action
    if (action === 'approve') {
      if (entityModel === Partner || entityModel === WomenInitiative) {
        entity.status = 'approved';
      } else {
        entity.status = 'verified';
      }
    } else if (action === 'reject') {
      entity.status = 'rejected';
    } else if (action === 'verify') {
      if (entityModel === Partner || entityModel === WomenInitiative) {
        entity.status = 'reviewed';
      } else {
        entity.status = 'verified';
      }
    }
    
    await entity.save();
    
    // Log the action
    try {
      await AuditLog.create({
        action: `document_${action}`,
        performedBy: adminId,
        targetEntity: entityId,
        details: {
          entityType,
          documentType,
          reason,
          status: entity.status
        },
        ipAddress,
        userAgent,
        status: 'success'
      });
    } catch (auditError) {
      console.error('Audit log error:', auditError);
    }
    
    res.json({
      status: 'success',
      message: `Document ${action}d successfully`,
      data: {
        entity: {
          id: entity._id,
          status: entity.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to verify documents'
    });
  }
};

/**
 * Get documents for a specific user by email
 */
const getUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    const documents = [];
    const userEmail = user.email.toLowerCase().trim();
    
    // Calculate registration time window (7 days after user registration)
    // Only show documents from entities created during registration
    const userRegistrationDate = user.createdAt || new Date();
    const registrationWindowEnd = new Date(userRegistrationDate);
    registrationWindowEnd.setDate(registrationWindowEnd.getDate() + 7); // 7 days window
    
    console.log(`[getUserDocuments] Looking for documents for user: ${user.name} (${userEmail})`);
    console.log(`[getUserDocuments] Registration date: ${userRegistrationDate}, Window end: ${registrationWindowEnd}`);
    
    // Use case-insensitive regex for email matching to handle any edge cases
    const emailRegex = new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    
    // Get Buyers with documents matching user email (case-insensitive)
    // Only include buyers created during registration window
    const buyers = await Buyer.find({ 
      email: emailRegex,
      idDocument: { $exists: true, $ne: null, $ne: '' },
      createdAt: { $gte: userRegistrationDate, $lte: registrationWindowEnd }
    });
    console.log(`[getUserDocuments] Found ${buyers.length} buyers with email matching ${userEmail} (within registration window)`);
    buyers.forEach(buyer => {
      if (buyer.idDocument && buyer.idDocument.trim() !== '') {
        documents.push({
          id: buyer._id,
          uniqueId: buyer.uniqueId,
          entityType: 'buyer',
          entityName: buyer.name,
          email: buyer.email,
          phone: buyer.phone,
          status: buyer.status,
          documents: [{ type: 'idDocument', path: buyer.idDocument, name: 'ID Document' }],
          createdAt: buyer.createdAt,
          updatedAt: buyer.updatedAt
        });
      }
    });
    
    // Get Partners with documents matching user email (case-insensitive)
    // Only include partners created during registration window
    const partners = await Partner.find({ 
      email: emailRegex,
      createdAt: { $gte: userRegistrationDate, $lte: registrationWindowEnd }
    });
    console.log(`[getUserDocuments] Found ${partners.length} partners with email matching ${userEmail} (within registration window)`);
    partners.forEach(partner => {
      const docs = [];
      if (partner.idDocument && partner.idDocument.trim() !== '') docs.push({ type: 'idDocument', path: partner.idDocument, name: 'ID Document' });
      if (partner.license && partner.license.trim() !== '') docs.push({ type: 'license', path: partner.license, name: 'License' });
      if (partner.tradeRegistration && partner.tradeRegistration.trim() !== '') docs.push({ type: 'tradeRegistration', path: partner.tradeRegistration, name: 'Trade Registration' });
      if (partner.tin && partner.tin.trim() !== '') docs.push({ type: 'tin', path: partner.tin, name: 'TIN' });
      if (partner.businessLicense && partner.businessLicense.trim() !== '') docs.push({ type: 'businessLicense', path: partner.businessLicense, name: 'Business License' });
      if (partner.photo && partner.photo.trim() !== '') docs.push({ type: 'photo', path: partner.photo, name: 'Photo' });
      
      if (docs.length > 0) {
        documents.push({
          id: partner._id,
          uniqueId: partner.uniqueId,
          entityType: 'partner',
          entityName: partner.name,
          email: partner.email,
          phone: partner.phone,
          status: partner.status,
          documents: docs,
          createdAt: partner.createdAt,
          updatedAt: partner.updatedAt
        });
      }
    });
    
    // Get Travellers with documents matching user email (case-insensitive)
    // Only include travellers created during registration window
    const travellers = await Traveller.find({ 
      email: emailRegex,
      createdAt: { $gte: userRegistrationDate, $lte: registrationWindowEnd }
    });
    console.log(`[getUserDocuments] Found ${travellers.length} travellers with email matching ${userEmail} (within registration window)`);
    travellers.forEach(traveller => {
      const docs = [];
      
      if (traveller.travellerType === 'international') {
        if (traveller.internationalDocuments?.flightTicket && traveller.internationalDocuments.flightTicket.trim() !== '') {
          docs.push({ type: 'flightTicket', path: traveller.internationalDocuments.flightTicket, name: 'Flight Ticket' });
        }
        if (traveller.internationalDocuments?.visa && traveller.internationalDocuments.visa.trim() !== '') {
          docs.push({ type: 'visa', path: traveller.internationalDocuments.visa, name: 'Visa' });
        }
        if (traveller.internationalDocuments?.passport && traveller.internationalDocuments.passport.trim() !== '') {
          docs.push({ type: 'passport', path: traveller.internationalDocuments.passport, name: 'Passport' });
        }
        if (traveller.internationalDocuments?.yellowCard && traveller.internationalDocuments.yellowCard.trim() !== '') {
          docs.push({ type: 'yellowCard', path: traveller.internationalDocuments.yellowCard, name: 'Yellow Card' });
        }
      } else {
        if (traveller.domesticDocuments?.governmentID && traveller.domesticDocuments.governmentID.trim() !== '') {
          docs.push({ type: 'governmentID', path: traveller.domesticDocuments.governmentID, name: 'Government ID' });
        }
        if (traveller.domesticDocuments?.flightTicket && traveller.domesticDocuments.flightTicket.trim() !== '') {
          docs.push({ type: 'flightTicket', path: traveller.domesticDocuments.flightTicket, name: 'Flight Ticket' });
        }
        if (traveller.domesticDocuments?.photo && traveller.domesticDocuments.photo.trim() !== '') {
          docs.push({ type: 'photo', path: traveller.domesticDocuments.photo, name: 'Photo' });
        }
      }
      
      if (docs.length > 0) {
        documents.push({
          id: traveller._id,
          uniqueId: traveller.uniqueId,
          entityType: 'traveller',
          entityName: traveller.name,
          email: traveller.email,
          phone: traveller.phone,
          whatsapp: traveller.whatsapp,
          telegram: traveller.telegram,
          travellerType: traveller.travellerType,
          status: traveller.status,
          // Trip details
          currentLocation: traveller.currentLocation,
          destinationCity: traveller.destinationCity,
          departureDate: traveller.departureDate,
          departureTime: traveller.departureTime,
          arrivalDate: traveller.arrivalDate,
          arrivalTime: traveller.arrivalTime,
          bankAccount: traveller.bankAccount,
          documents: docs,
          createdAt: traveller.createdAt,
          updatedAt: traveller.updatedAt
        });
      }
    });
    
    // Get WomenInitiatives with documents matching user email (case-insensitive)
    // Only include women initiatives created during registration window
    const womenInitiatives = await WomenInitiative.find({ 
      email: emailRegex,
      createdAt: { $gte: userRegistrationDate, $lte: registrationWindowEnd }
    });
    console.log(`[getUserDocuments] Found ${womenInitiatives.length} women initiatives with email matching ${userEmail} (within registration window)`);
    womenInitiatives.forEach(women => {
      const docs = [];
      if (women.idDocument && women.idDocument.trim() !== '') docs.push({ type: 'idDocument', path: women.idDocument, name: 'ID Document' });
      if (women.profilePhoto && women.profilePhoto.trim() !== '') docs.push({ type: 'profilePhoto', path: women.profilePhoto, name: 'Profile Photo' });
      if (women.certificates && women.certificates.trim() !== '') docs.push({ type: 'certificates', path: women.certificates, name: 'Certificates' });
      
      if (docs.length > 0) {
        documents.push({
          id: women._id,
          uniqueId: women.uniqueId,
          entityType: 'womenInitiative',
          entityName: women.fullName,
          email: women.email,
          phone: women.phone,
          status: women.status,
          documents: docs,
          createdAt: women.createdAt,
          updatedAt: women.updatedAt
        });
      }
    });
    
    // Get Senders with documents matching user email (case-insensitive)
    // Only include senders created during registration window
    const senders = await Sender.find({ 
      email: emailRegex,
      idDocument: { $exists: true, $ne: null, $ne: '' },
      createdAt: { $gte: userRegistrationDate, $lte: registrationWindowEnd }
    });
    console.log(`[getUserDocuments] Found ${senders.length} senders with email matching ${userEmail} (within registration window)`);
    senders.forEach(sender => {
      if (sender.idDocument && sender.idDocument.trim() !== '') {
        documents.push({
          id: sender._id,
          uniqueId: sender.uniqueId,
          entityType: 'sender',
          entityName: sender.name,
          email: sender.email,
          phone: sender.phone,
          status: sender.status,
          documents: [{ type: 'idDocument', path: sender.idDocument, name: 'ID Document' }],
          createdAt: sender.createdAt,
          updatedAt: sender.updatedAt
        });
      }
    });
    
    // Get Receivers with documents matching user email (case-insensitive)
    // Only include receivers created during registration window
    const receivers = await Receiver.find({ 
      email: emailRegex,
      idDocument: { $exists: true, $ne: null, $ne: '' },
      createdAt: { $gte: userRegistrationDate, $lte: registrationWindowEnd }
    });
    console.log(`[getUserDocuments] Found ${receivers.length} receivers with email matching ${userEmail} (within registration window)`);
    receivers.forEach(receiver => {
      if (receiver.idDocument && receiver.idDocument.trim() !== '') {
        documents.push({
          id: receiver._id,
          uniqueId: receiver.uniqueId,
          entityType: 'receiver',
          entityName: receiver.name,
          email: receiver.email,
          phone: receiver.phone,
          status: receiver.status,
          documents: [{ type: 'idDocument', path: receiver.idDocument, name: 'ID Document' }],
          createdAt: receiver.createdAt,
          updatedAt: receiver.updatedAt
        });
      }
    });
    
    // Sort by createdAt descending
    documents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`[getUserDocuments] Returning ${documents.length} documents for user ${userEmail} (only registration-time documents)`);
    
    res.json({
      status: 'success',
      count: documents.length,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        documents: documents
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get user documents'
    });
  }
};

module.exports = {
  getAllDocuments,
  verifyDocuments,
  getUserDocuments
};
