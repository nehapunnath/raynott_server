// Middleware/uploadMiddleware.js
const multer = require('multer');
const { storage } = require('../firebaseAdmin');
const path = require('path');

const storageMulter = multer.memoryStorage();

const upload = multer({
  storage: storageMulter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed!'), false);
    }
  },
});

const uploadToFirebase = async (file, folder) => {
  if (!file || !file.buffer || !file.originalname || !file.mimetype) return null;

  return new Promise((resolve, reject) => {
    const filename = `${folder}/${Date.now()}_${path.basename(file.originalname)}`;
    const blob = storage.file(filename);
    const blobStream = blob.createWriteStream({
      metadata: { contentType: file.mimetype },
    });

    blobStream.on('error', reject);
    blobStream.on('finish', async () => {
      await blob.makePublic();
      resolve(`https://storage.googleapis.com/${storage.name}/${blob.name}`);
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { upload, uploadToFirebase };