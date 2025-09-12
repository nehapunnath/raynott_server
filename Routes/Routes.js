const express = require('express');
const router = express.Router();
const AuthController = require('../Controllers/AuthController');
const verifyAdmin = require('../Middleware/authMiddleware'); 
const schoolController = require('../Controllers/SchoolController');
const {upload }= require('../Middleware/uploadMiddleware');
const CollegeController=require('../Controllers/CollegeController')
const PUCollegeController = require('../Controllers/PuCollegeController')
const TuitionCoachingController=require('../Controllers/TuitionCoachingController')

router.post('/login', AuthController.loginAdmin);

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
router.get('/admin/getschools/:id', schoolController.getSchool);

router.put('/admin/updateschools/:id', 
upload.fields([
  { name: 'schoolImage', maxCount: 1 },
  { name: 'photos', maxCount: 6 }
]), schoolController.updateSchool);

router.delete('/admin/del-schools/:id', schoolController.deleteSchool);

router.get('/getschools/filtered', schoolController.getSchoolsWithFilters); 

router.post('/admin/addcolleges', 
  upload.fields([
    { name: 'collegeImage', maxCount: 1 },
    { name: 'photos', maxCount: 6 }
  ]), 
  CollegeController.addCollege
);

router.get('/admin/getcolleges', CollegeController.getColleges);
router.get('/admin/getcolleges/:id', CollegeController.getCollege);

router.put('/admin/updatecolleges/:id', 
  upload.fields([
    { name: 'collegeImage', maxCount: 1 },
    { name: 'photos', maxCount: 6 }
  ]), 
  CollegeController.updateCollege
);

router.delete('/admin/del-colleges/:id', CollegeController.deleteCollege);
router.get('/admin/college-types',CollegeController.getAllCollegeTypes);
router.post('/admin/college-types', CollegeController.createCollegeType);
router.delete('/admin/college-types/:id',CollegeController.deleteCollegeType);

router.get('/admin/search/colleges', CollegeController.searchColleges)

// PU College routes
router.post('/admin/addpucolleges', 
  
  upload.fields([
    { name: 'collegeImage', maxCount: 1 },
    { name: 'photos', maxCount: 6 }
  ]), 
  PUCollegeController.addPUCollege
);

router.get('/admin/getpucolleges', PUCollegeController.getPUColleges);
router.get('/admin/getpucolleges/:id', PUCollegeController.getPUCollege);

router.put('/admin/updatepucolleges/:id', 
  
  upload.fields([
    { name: 'collegeImage', maxCount: 1 },
    { name: 'photos', maxCount: 6 }
  ]), 
  PUCollegeController.updatePUCollege
);

router.delete('/admin/del-pucolleges/:id',  PUCollegeController.deletePUCollege);

router.get('/admin/pucollege-types', PUCollegeController.getAllPUCollegeTypes);
router.post('/admin/pucollege-types', PUCollegeController.createPUCollegeType);
router.delete('/admin/pucollege-types/:id',  PUCollegeController.deletePUCollegeType);

router.get('/admin/search/pucolleges', PUCollegeController.searchPUColleges);

// Tuition/Coaching Center routes
router.post('/admin/addtuitioncoaching', 
  upload.fields([
    { name: 'centerImage', maxCount: 1 },
    { name: 'photos', maxCount: 6 }
  ]), 
  TuitionCoachingController.addTuitionCoaching
);

router.get('/admin/gettuitioncoaching', TuitionCoachingController.getTuitionCoachings);
router.get('/admin/gettuitioncoaching/:id', TuitionCoachingController.getTuitionCoaching);

router.put('/admin/updatetuitioncoaching/:id', 
  upload.fields([
    { name: 'centerImage', maxCount: 1 },
    { name: 'photos', maxCount: 6 }
  ]), 
  TuitionCoachingController.updateTuitionCoaching
);

router.delete('/admin/del-tuitioncoaching/:id', TuitionCoachingController.deleteTuitionCoaching);
router.get('/admin/coaching-types', TuitionCoachingController.getAllCoachingTypes);
router.post('/admin/coaching-types', TuitionCoachingController.createCoachingType);
router.delete('/admin/coaching-types/:id', TuitionCoachingController.deleteCoachingType);
router.get('/admin/search/tuitioncoaching', TuitionCoachingController.searchTuitionCoachings);









module.exports = router;