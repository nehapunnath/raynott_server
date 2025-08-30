const express = require('express');
const router = express.Router();
const AuthController = require('../Controllers/AuthController');
const verifyAdmin = require('../Middleware/authMiddleware'); 
const schoolController = require('../Controllers/SchoolController');
const {upload }= require('../Middleware/uploadMiddleware');

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

router.post('/admin/addschools', 
upload.fields([
  { name: 'schoolImage', maxCount: 1 },
  { name: 'photos', maxCount: 6 }
]), schoolController.addSchool);

router.get('/admin/getschools' ,schoolController.getSchools);
router.get('/admin/getschools/:id', schoolController.getSchools);


router.put('/admin/updateschools/:id', 
upload.fields([
  { name: 'schoolImage', maxCount: 1 },
  { name: 'photos', maxCount: 6 }
]), schoolController.updateSchool);

router.delete('/admin/del-schools/:id', schoolController.deleteSchool);





// Add more protected routes as needed
module.exports = router;