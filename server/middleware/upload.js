const multer = require('multer');
const path = require('path');
const { storage } = require('../utils/cloudinary');

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and videos
  const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|mov|avi|webm|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isImage = /^image\//.test(file.mimetype);
  const isPDF = file.mimetype === 'application/pdf';
  const isVideo = /^video\//.test(file.mimetype);

  if ((isImage || isPDF || isVideo) && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif), PDF files, and video files (mp4, mov, avi, webm, mkv) are allowed!'));
  }
};

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (Cloudinary supports larger files)
  },
  fileFilter: fileFilter
});

module.exports = upload;





