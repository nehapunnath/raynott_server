const express = require('express');
const router = express.Router();
const AuthController = require('../Controllers/AuthController');
const verifyAdmin = require('../Middleware/authMiddleware'); // Import the middleware

// Admin login route
router.post('/login', AuthController.loginAdmin);

// Protected admin route
router.get('/admin/dashboard', verifyAdmin, (req, res) => {
  res.json({ 
    success: true, 
    message: "Welcome to Admin Dashboard",
    user: req.user 
  });
});

// Add more protected routes as needed
module.exports = router;