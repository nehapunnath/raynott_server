const admin = require('firebase-admin');

// Only initialize if it hasn't been done already
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // storageBucket: ''
  });
}

// These can be used anywhere in your app
const db = admin.firestore();
// const bucket = admin.storage().bucket();

module.exports = { admin, db };