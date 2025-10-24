const admin = require('firebase-admin');
const { auth } = require('../firebase');
const { signInWithEmailAndPassword } = require('firebase/auth');




class AuthModel {
  static async verifyToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return { success: true, decodedToken };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async isAdmin(uid) {
    try {
      const user = await admin.auth().getUser(uid);
      return user.customClaims && user.customClaims.admin === true;
    } catch (error) {
      return false;
    }
  }

 static async adminLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Firebase auth success!"); // Debug log
    
    const token = await userCredential.user.getIdToken();
    const isAdmin = await this.isAdmin(userCredential.user.uid);
    
    if (!isAdmin) {
      console.log("❌ User is not an admin"); // Debug log
      await auth.signOut();
      return { success: false, error: "Not an admin user" };
    }
    
    return { success: true, token };
  } catch (error) {
    console.error("🔥 Firebase Error:", error.message); // Debug log
    return { success: false, error: error.message };
  }
}
}

module.exports = AuthModel;