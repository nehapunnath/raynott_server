const admin = require("firebase-admin");
const serviceAccount = require("./service-account-key.json"); // Path to your key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function makeAdmin(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ ${email} is now an admin. Claims updated.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Replace with the admin user's email
makeAdmin("raynottadmin@gmail.com");