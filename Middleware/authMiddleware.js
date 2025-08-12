const admin = require('firebase-admin');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = require('../../service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://raynott-98db5.firebaseio.com"
  });
}

const verifyAdmin = async (req, res, next) => {
  try {
    // 1. Check if header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("❌ No authorization header");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];
    console.log("🔑 Token:", token);

    // 3. Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("📋 Decoded Token:", decodedToken);

    // 4. Check admin claim
    if (!decodedToken.admin) {
      console.log("❌ User is not an admin");
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // 5. Attach user data to request
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("⚠️ Auth Middleware Error:", error.message);
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

module.exports = verifyAdmin;