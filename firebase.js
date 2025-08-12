const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEgfdqNdNJwY15a54JdABOUFY3qmF6kkc",
  authDomain: "raynott-98db5.firebaseapp.com",
  projectId: "raynott-98db5",
  storageBucket: "raynott-98db5.firebasestorage.app",
  messagingSenderId: "34805454717",
  appId: "1:34805454717:web:545267e51d8884e3af5e14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

module.exports = { app, auth };