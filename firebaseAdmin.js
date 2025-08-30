// firebaseAdmin.js
const admin = require('firebase-admin');

let db, storage;

if (!admin.apps.length) {
  try {
    // Validate environment variables
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
    }
    if (!process.env.FIREBASE_DATABASE_URL) {
      throw new Error('FIREBASE_DATABASE_URL environment variable is missing');
    }
    if (!process.env.FIREBASE_STORAGE_BUCKET) {
      throw new Error('FIREBASE_STORAGE_BUCKET environment variable is missing');
    }

    // Parse service account and fix private key
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      // databaseURL: 'https://raynott-98db5-default-rtdb.firebaseio.com/',
      // storageBucket: 'raynott-98db5.firebasestorage.app',
    });

    // Initialize database and storage
    db = admin.database();
    storage = admin.storage().bucket();
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
    throw error; // Let the application decide how to handle the error
  }
} else {
  // If already initialized, reuse existing instances
  db = admin.database();
  storage = admin.storage().bucket();
}

module.exports = { admin, db, storage };