const admin = require("../firebaseAdmin");

const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("❌ No authorization header");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 Token:", token);

    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log("📋 Decoded Token:", decodedToken);

    if (!decodedToken.admin) {
      console.log("❌ User is not an admin");
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("⚠️ Auth Middleware Error:", error.message);
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
};

module.exports = verifyAdmin;
