const multer = require('multer');
const { storage } = require('../firebaseAdmin'); // Change 'bucket' to 'storage'
const path = require('path');

// Configure multer for memory storage
const storageMulter = multer.memoryStorage(); // Rename to avoid conflict with Firebase storage

const upload = multer({
  storage: storageMulter,
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Middleware to upload image to Firebase Storage
const uploadToFirebase = async (file, folder) => {
  // Enhanced check for file existence and validity
  if (!file || typeof file !== 'object' || !file.buffer || !file.originalname || !file.mimetype) {
    console.error('Invalid file object:', file);
    return null;
  }

 
  if (!storage) {
    console.error('Firebase Storage bucket is not initialized');
    throw new Error('Storage service not available');
  }

  return new Promise((resolve, reject) => {
    const filename = `${folder}/${Date.now()}_${path.basename(file.originalname)}`;
    const blob = storage.file(filename); 
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (error) => {
      console.error('Error uploading to Firebase:', error);
      reject(error);
    });

    blobStream.on('finish', async () => {
      try {
        // Make the file public
        await blob.makePublic();
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${storage.name}/${blob.name}`;
        console.log('File uploaded successfully:', publicUrl);
        resolve(publicUrl);
      } catch (error) {
        console.error('Error making file public:', error);
        reject(error);
      }
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { upload, uploadToFirebase };