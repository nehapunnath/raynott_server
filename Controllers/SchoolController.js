const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');
const School = require('../Models/SchoolModel');

// Add a new school
const addSchool = async (req, res) => {
  try {
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);
    
    // Parse stringified fields
    const parsedData = {
      ...req.body,
      facilities: req.body.facilities ? JSON.parse(req.body.facilities) : [],
      socialMedia: req.body.socialMedia ? JSON.parse(req.body.socialMedia) : {}
    };
    
    // Create school instance with parsed data
    const schoolData = new School(parsedData);
    
    // Validate required fields
    const validationErrors = schoolData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Upload school image if provided
    if (req.files && req.files.schoolImage && Array.isArray(req.files.schoolImage) && req.files.schoolImage[0]) {
      console.log('Uploading school image:', req.files.schoolImage[0].originalname);
      try {
        schoolData.schoolImage = await uploadToFirebase(req.files.schoolImage[0], 'schools/images');
        console.log('School image uploaded to:', schoolData.schoolImage);
      } catch (uploadError) {
        console.error('Failed to upload school image:', uploadError);
        schoolData.schoolImage = '';
      }
    } else {
      console.log('No school image found in request');
      schoolData.schoolImage = '';
    }
    
    // Upload gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      console.log('Uploading gallery photos:', req.files.photos.length);
      const photoUploads = req.files.photos.map(file => 
        uploadToFirebase(file, 'schools/gallery').catch(error => {
          console.error('Failed to upload photo:', file.originalname, error);
          return null;
        })
      );
      
      const uploadedPhotos = await Promise.all(photoUploads);
      schoolData.photos = uploadedPhotos.filter(photo => photo !== null);
      console.log('Gallery photos uploaded:', schoolData.photos.length);
    } else {
      console.log('No gallery photos found in request');
      schoolData.photos = [];
    }
    
    // Generate a unique ID for the school
    const schoolRef = db.ref('schools').push();
    const schoolId = schoolRef.key;
    
    // Add timestamps
    schoolData.createdAt = new Date().toISOString();
    schoolData.updatedAt = new Date().toISOString();
    
    // Save to Firebase
    await schoolRef.set({
      id: schoolId,
      ...schoolData
    });
    
    res.status(201).json({
      success: true,
      message: 'School added successfully',
      data: {
        id: schoolId,
        ...schoolData
      }
    });
  } catch (error) {
    console.error('Error adding school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add school',
      error: error.message
    });
  }
};
// Get all schools
const getSchools = async (req, res) => {
  try {
    const schoolsRef = db.ref('schools');
    const snapshot = await schoolsRef.once('value');
    const schools = snapshot.val();
    
    res.status(200).json({
      success: true,
      data: schools
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools',
      error: error.message
    });
  }
};

// Get a single school by ID
const getSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolRef = db.ref(`schools/${id}`);
    const snapshot = await schoolRef.once('value');
    const school = snapshot.val();
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch school',
      error: error.message
    });
  }
};

// Update a school
const updateSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolRef = db.ref(`schools/${id}`);
    const snapshot = await schoolRef.once('value');
    const existingSchool = snapshot.val();
    
    if (!existingSchool) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    // Update school data
    const updatedData = {
      ...existingSchool,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Upload new school image if provided
    if (req.files && req.files.schoolImage && Array.isArray(req.files.schoolImage) && req.files.schoolImage[0]) {
      try {
        updatedData.schoolImage = await uploadToFirebase(req.files.schoolImage[0], 'schools/images');
      } catch (uploadError) {
        console.error('Failed to upload school image:', uploadError);
        // Keep existing image if upload fails
        updatedData.schoolImage = existingSchool.schoolImage || '';
      }
    }
    
    // Upload new gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      const photoUploads = req.files.photos.map(file => 
        uploadToFirebase(file, 'schools/gallery').catch(error => {
          console.error('Failed to upload photo:', error);
          return null;
        })
      );
      const newPhotos = await Promise.all(photoUploads);
      const validNewPhotos = newPhotos.filter(photo => photo !== null);
      updatedData.photos = [...(existingSchool.photos || []), ...validNewPhotos];
    }
    
    // Save to Firebase
    await schoolRef.set(updatedData);
    
    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update school',
      error: error.message
    });
  }
};

// Delete a school
const deleteSchool = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolRef = db.ref(`schools/${id}`);
    const snapshot = await schoolRef.once('value');
    const school = snapshot.val();
    
    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }
    
    // Delete from Firebase
    await schoolRef.remove();
    
    res.status(200).json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete school',
      error: error.message
    });
  }
};
// Get all schools with optional filtering
const getSchoolsWithFilters = async (req, res) => {
  try {
    const { 
      city, 
      board, 
      schoolType, 
      maxFee, 
      minFee,
      gender 
    } = req.query;
    
    const schoolsRef = db.ref('schools');
    const snapshot = await schoolsRef.once('value');
    const schools = snapshot.val();
    
    if (!schools) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }
    
    // Filter schools based on query parameters
    const filteredSchools = Object.keys(schools).reduce((result, key) => {
      const school = schools[key];
      let include = true;
      
      // City filter
      if (city && school.city && school.city.toLowerCase() !== city.toLowerCase()) {
        include = false;
      }
      
      // Board filter
      if (board && school.board && school.board.toLowerCase() !== board.toLowerCase()) {
        include = false;
      }
      
      // School type filter
      if (schoolType && school.schoolType && school.schoolType.toLowerCase() !== schoolType.toLowerCase()) {
        include = false;
      }
      
      // Gender filter
      if (gender && school.gender && school.gender.toLowerCase() !== gender.toLowerCase()) {
        include = false;
      }
      
      // Fee range filter
      if (minFee && school.totalAnnualFee < parseInt(minFee)) {
        include = false;
      }
      
      if (maxFee && school.totalAnnualFee > parseInt(maxFee)) {
        include = false;
      }
      
      if (include) {
        result[key] = school;
      }
      
      return result;
    }, {});
    
    res.status(200).json({
      success: true,
      data: filteredSchools,
      count: Object.keys(filteredSchools).length
    });
  } catch (error) {
    console.error('Error fetching filtered schools:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schools',
      error: error.message
    });
  }
};

module.exports = {
  addSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolsWithFilters
};