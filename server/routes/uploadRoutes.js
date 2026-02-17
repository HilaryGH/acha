const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middleware/upload');

// Single file upload route with error handling
router.post('/single', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File too large. Maximum size is 100MB'
          });
        }
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }
      // Handle other errors (like fileFilter errors)
      return res.status(400).json({
        status: 'error',
        message: err.message || 'File upload error'
      });
    }

    // If no error, proceed with handling the uploaded file
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    // Cloudinary returns file info in req.file
    // req.file.path contains the Cloudinary URL
    res.json({
      status: 'success',
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename || req.file.originalname,
        originalname: req.file.originalname,
        path: req.file.path, // Cloudinary URL
        secure_url: req.file.secure_url || req.file.path, // Secure HTTPS URL
        public_id: req.file.public_id,
        resource_type: req.file.resource_type,
        format: req.file.format,
        bytes: req.file.bytes || req.file.size,
        width: req.file.width,
        height: req.file.height
      }
    });
  });
});

// Multiple files upload route with error handling
router.post('/multiple', (req, res, next) => {
  upload.array('files', 10)(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: 'File too large. Maximum size is 100MB'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: 'Too many files. Maximum is 10 files'
          });
        }
        return res.status(400).json({
          status: 'error',
          message: err.message
        });
      }
      // Handle other errors (like fileFilter errors)
      return res.status(400).json({
        status: 'error',
        message: err.message || 'File upload error'
      });
    }

    // If no error, proceed with handling the uploaded files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded'
      });
    }

    // Map Cloudinary file info
    const files = req.files.map(file => ({
      filename: file.filename || file.originalname,
      originalname: file.originalname,
      path: file.path, // Cloudinary URL
      secure_url: file.secure_url || file.path, // Secure HTTPS URL
      public_id: file.public_id,
      resource_type: file.resource_type,
      format: file.format,
      bytes: file.bytes || file.size,
      width: file.width,
      height: file.height
    }));

    res.json({
      status: 'success',
      message: 'Files uploaded successfully',
      files: files
    });
  });
});

module.exports = router;
