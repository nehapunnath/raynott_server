const admin = require("firebase-admin");
const serviceAccount = require("./service-account-key.json"); // Path to your key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function checkClaims(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log("🔍 User Claims:", user.customClaims || "No custom claims set");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Replace with the email you want to check
checkClaims("raynottadmin@gmail.com");