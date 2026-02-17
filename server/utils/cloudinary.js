const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Validate Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️  Cloudinary credentials not found in environment variables.');
  console.warn('   Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.');
  console.warn('   File uploads will fail until Cloudinary is configured.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// Create Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file type
    let folder = 'acha/documents';
    
    // Determine resource type
    let resourceType = 'auto'; // auto-detect (image, video, raw)
    
    if (file.mimetype.startsWith('image/')) {
      resourceType = 'image';
      folder = 'acha/documents/images';
    } else if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
      folder = 'acha/documents/videos';
    } else if (file.mimetype === 'application/pdf') {
      resourceType = 'raw';
      folder = 'acha/documents/pdfs';
    }
    
    return {
      folder: folder,
      resource_type: resourceType,
      public_id: `${Date.now()}-${Math.round(Math.random() * 1E9)}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'mp4', 'mov', 'avi', 'webm', 'mkv'],
      // For videos, set quality and format
      ...(resourceType === 'video' && {
        quality: 'auto',
        format: 'mp4'
      }),
      // For images, optimize
      ...(resourceType === 'image' && {
        quality: 'auto',
        fetch_format: 'auto'
      })
    };
  }
});

module.exports = {
  cloudinary,
  storage
};
