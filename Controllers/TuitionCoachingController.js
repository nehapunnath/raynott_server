const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');
const TuitionCoaching = require('../Models/TuitionCoachingModel');

// Helper function for safe JSON parsing
// UPDATED: Better error logging; robust comma-split for arrays; filters empty items
const safeParse = (data, defaultValue = null, expectedType = 'any') => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error(`JSON parse error for value "${data}":`, error.message);
      // For expected arrays, try splitting comma-separated string as fallback
      if (expectedType === 'array' && data.trim() !== '') {
        const splitItems = data.split(',').map(item => item.trim()).filter(item => item !== '');
        return splitItems.length > 0 ? splitItems : defaultValue || [];
      }
      return defaultValue !== null ? defaultValue : data;
    }
  }
  return data;
};

// NEW: Helper to normalize class ranges (e.g., '8th-12th' -> ['8th', '9th', ..., '12th'])
const normalizeClasses = (classes) => {
  if (!Array.isArray(classes)) return classes;
  const normalized = [];
  classes.forEach(classStr => {
    if (classStr.includes('-')) {
      const [start, end] = classStr.split('-').map(s => s.trim());
      if (start && end) {
        // Simple assumption: numeric suffixes (e.g., 8th-12th)
        const startNum = parseInt(start.match(/\d+/)?.[0]) || 0;
        const endNum = parseInt(end.match(/\d+/)?.[0]) || 0;
        const suffix = start.replace(/\d+/, '').trim() || 'th';
        for (let i = startNum; i <= endNum; i++) {
          normalized.push(`${i}${suffix}`);
        }
      } else {
        normalized.push(classStr);
      }
    } else {
      normalized.push(classStr);
    }
  });
  return normalized;
};

// Helper function to clean undefined values from object
const cleanUndefinedValues = (obj) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined || cleaned[key] === null) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// Add a new tuition/coaching center
const addTuitionCoaching = async (req, res) => {
  try {
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    // Parse stringified fields safely
    // UPDATED: Use [] default for arrays; log parsed values for debug
    let parsedData = {
      ...req.body,
      classes: safeParse(req.body.classes, [], 'array'),
      subjects: safeParse(req.body.subjects, [], 'array'),
      facilities: safeParse(req.body.facilities, [], 'array'),
      socialMedia: safeParse(req.body.socialMedia, {}),
      // Convert string numbers to actual numbers
      totalAnnualFee: parseInt(req.body.totalAnnualFee) || 0,
      admissionFee: parseInt(req.body.admissionFee) || 0,
      tuitionFee: parseInt(req.body.tuitionFee) || 0,
      transportFee: parseInt(req.body.transportFee) || 0,
      booksUniformsFee: parseInt(req.body.booksUniformsFee) || 0,
      establishmentYear: parseInt(req.body.establishmentYear) || 0,
      batchSize: req.body.batchSize || '',
      classDuration: req.body.classDuration || '',
      language: req.body.language || '',
      faculty: req.body.faculty || '',
      studyMaterial: req.body.studyMaterial || '',
      tests: req.body.tests || '',
      doubtSessions: req.body.doubtSessions || '',
      infrastructure: req.body.infrastructure || '',
      demoClass: req.body.demoClass || '',
      flexibleTimings: req.body.flexibleTimings || '',
      classrooms: req.body.classrooms || '',
      laboratories: req.body.laboratories || '',
      library: req.body.library || '',
      smartBoards: req.body.smartBoards || '',
      cctv: req.body.cctv || '',
      medicalRoom: req.body.medicalRoom || '',
      wifi: req.body.wifi || '',
      admissionProcess: req.body.admissionProcess || '',
      // Remove the preview field as it's not needed in database
      centerImagePreview: undefined
    };

    // NEW: Normalize classes after parsing
    parsedData.classes = normalizeClasses(parsedData.classes);
    console.log('Parsed classes:', parsedData.classes);  // Debug log
    console.log('Parsed subjects:', parsedData.subjects);  // Debug log
    console.log('Parsed facilities:', parsedData.facilities);  // Debug log

    // Clean undefined values
    const cleanedData = cleanUndefinedValues(parsedData);
    
    // Create tuition/coaching instance with parsed data
    const tuitionCoachingData = new TuitionCoaching(cleanedData);
    
    // Validate required fields
    const validationErrors = tuitionCoachingData.validate();
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);  // NEW: Log errors for debug
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Upload center image if provided
    if (req.files && req.files.centerImage && Array.isArray(req.files.centerImage) && req.files.centerImage[0]) {
      console.log('Uploading center image:', req.files.centerImage[0].originalname);
      try {
        tuitionCoachingData.centerImage = await uploadToFirebase(req.files.centerImage[0], 'tuitionCoaching/images');
        console.log('Center image uploaded to:', tuitionCoachingData.centerImage);
      } catch (uploadError) {
        console.error('Failed to upload center image:', uploadError);
        tuitionCoachingData.centerImage = '';
      }
    } else {
      console.log('No center image found in request');
      tuitionCoachingData.centerImage = '';
    }
    
    // Upload gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      console.log('Uploading gallery photos:', req.files.photos.length);
      const photoUploads = req.files.photos.map(file => 
        uploadToFirebase(file, 'tuitionCoaching/gallery').catch(error => {
          console.error('Failed to upload photo:', file.originalname, error);
          return null;
        })
      );
      
      const uploadedPhotos = await Promise.all(photoUploads);
      tuitionCoachingData.photos = uploadedPhotos.filter(photo => photo !== null);
      console.log('Gallery photos uploaded:', tuitionCoachingData.photos.length);
    } else {
      console.log('No gallery photos found in request');
      tuitionCoachingData.photos = [];
    }
    
    // Generate a unique ID for the tuition/coaching center
    const tuitionCoachingRef = db.ref('tuitionCoaching').push();
    const tuitionCoachingId = tuitionCoachingRef.key;
    
    // Add timestamps
    tuitionCoachingData.createdAt = new Date().toISOString();
    tuitionCoachingData.updatedAt = new Date().toISOString();
    
    // Clean the final data before saving to Firebase
    const finalData = cleanUndefinedValues({
      id: tuitionCoachingId,
      ...tuitionCoachingData
    });
    
    // Save to Firebase
    await tuitionCoachingRef.set(finalData);
    
    res.status(201).json({
      success: true,
      message: 'Tuition/Coaching Center added successfully',
      data: finalData
    });
  } catch (error) {
    console.error('Error adding tuition/coaching center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add tuition/coaching center',
      error: error.message
    });
  }
};

// Get all tuition/coaching centers
const getTuitionCoachings = async (req, res) => {
  try {
    const tuitionCoachingRef = db.ref('tuitionCoaching');
    const snapshot = await tuitionCoachingRef.once('value');
    const tuitionCoachings = snapshot.val();
    
    res.status(200).json({
      success: true,
      data: tuitionCoachings || {}
    });
  } catch (error) {
    console.error('Error fetching tuition/coaching centers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tuition/coaching centers',
      error: error.message
    });
  }
};

// Get a single tuition/coaching center by ID
const getTuitionCoaching = async (req, res) => {
  try {
    const { id } = req.params;
    const tuitionCoachingRef = db.ref(`tuitionCoaching/${id}`);
    const snapshot = await tuitionCoachingRef.once('value');
    const tuitionCoaching = snapshot.val();
    
    if (!tuitionCoaching) {
      return res.status(404).json({
        success: false,
        message: 'Tuition/Coaching Center not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: tuitionCoaching
    });
  } catch (error) {
    console.error('Error fetching tuition/coaching center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tuition/coaching center',
      error: error.message
    });
  }
};

// Update a tuition/coaching center
const updateTuitionCoaching = async (req, res) => {
  try {
    const { id } = req.params;
    const tuitionCoachingRef = db.ref(`tuitionCoaching/${id}`);
    const snapshot = await tuitionCoachingRef.once('value');
    const existingTuitionCoaching = snapshot.val();
    
    if (!existingTuitionCoaching) {
      return res.status(404).json({
        success: false,
        message: 'Tuition/Coaching Center not found'
      });
    }
    
    // Parse stringified fields safely
    // UPDATED: Use same parsing logic as add, with existing values as fallback; normalize classes
    const updatedData = {
      ...existingTuitionCoaching,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Handle parsed fields safely
    if (req.body.classes !== undefined) {
      updatedData.classes = normalizeClasses(safeParse(req.body.classes, existingTuitionCoaching.classes || [], 'array'));
    }
    if (req.body.subjects !== undefined) {
      updatedData.subjects = safeParse(req.body.subjects, existingTuitionCoaching.subjects || [], 'array');
    }
    if (req.body.facilities !== undefined) {
      updatedData.facilities = safeParse(req.body.facilities, existingTuitionCoaching.facilities || [], 'array');
    }
    if (req.body.socialMedia !== undefined) {
      updatedData.socialMedia = safeParse(req.body.socialMedia, existingTuitionCoaching.socialMedia || {});
    }
    
    // Convert numeric fields
    if (req.body.totalAnnualFee !== undefined) updatedData.totalAnnualFee = parseInt(req.body.totalAnnualFee) || 0;
    if (req.body.admissionFee !== undefined) updatedData.admissionFee = parseInt(req.body.admissionFee) || 0;
    if (req.body.tuitionFee !== undefined) updatedData.tuitionFee = parseInt(req.body.tuitionFee) || 0;
    if (req.body.transportFee !== undefined) updatedData.transportFee = parseInt(req.body.transportFee) || 0;
    if (req.body.booksUniformsFee !== undefined) updatedData.booksUniformsFee = parseInt(req.body.booksUniformsFee) || 0;
    if (req.body.establishmentYear !== undefined) updatedData.establishmentYear = parseInt(req.body.establishmentYear) || 0;
    
    // Upload new center image if provided
    if (req.files && req.files.centerImage && Array.isArray(req.files.centerImage) && req.files.centerImage[0]) {
      try {
        updatedData.centerImage = await uploadToFirebase(req.files.centerImage[0], 'tuitionCoaching/images');
      } catch (uploadError) {
        console.error('Failed to upload center image:', uploadError);
        updatedData.centerImage = existingTuitionCoaching.centerImage || '';
      }
    }
    
    // Upload new gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      const photoUploads = req.files.photos.map(file => 
        uploadToFirebase(file, 'tuitionCoaching/gallery').catch(error => {
          console.error('Failed to upload photo:', error);
          return null;
        })
      );
      const newPhotos = await Promise.all(photoUploads);
      const validNewPhotos = newPhotos.filter(photo => photo !== null);
      updatedData.photos = [...(existingTuitionCoaching.photos || []), ...validNewPhotos];
    }
    
    // Clean undefined values before saving
    const cleanedData = cleanUndefinedValues(updatedData);
    
    // Save to Firebase
    await tuitionCoachingRef.set(cleanedData);
    
    res.status(200).json({
      success: true,
      message: 'Tuition/Coaching Center updated successfully',
      data: cleanedData
    });
  } catch (error) {
    console.error('Error updating tuition/coaching center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tuition/coaching center',
      error: error.message
    });
  }
};

// Delete a tuition/coaching center
const deleteTuitionCoaching = async (req, res) => {
  try {
    const { id } = req.params;
    const tuitionCoachingRef = db.ref(`tuitionCoaching/${id}`);
    const snapshot = await tuitionCoachingRef.once('value');
    const tuitionCoaching = snapshot.val();
    
    if (!tuitionCoaching) {
      return res.status(404).json({
        success: false,
        message: 'Tuition/Coaching Center not found'
      });
    }
    
    // Delete from Firebase
    await tuitionCoachingRef.remove();
    
    res.status(200).json({
      success: true,
      message: 'Tuition/Coaching Center deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tuition/coaching center:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tuition/coaching center',
      error: error.message
    });
  }
};

// Search tuition/coaching centers by filters
// UPDATED: Added Array.isArray check for robustness
const searchTuitionCoachings = async (req, res) => {
  try {
    const { 
      city, 
      typeOfCoaching, 
      subjects, 
      maxFee 
    } = req.query;
    
    const tuitionCoachingRef = db.ref('tuitionCoaching');
    const snapshot = await tuitionCoachingRef.once('value');
    const tuitionCoachings = snapshot.val();
    
    if (!tuitionCoachings) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }
    
    // Filter tuition/coaching centers based on query parameters
    const filteredTuitionCoachings = Object.keys(tuitionCoachings).reduce((result, key) => {
      const tuitionCoaching = tuitionCoachings[key];
      let include = true;
      
      if (city && tuitionCoaching.city && tuitionCoaching.city.toLowerCase() !== city.toLowerCase()) {
        include = false;
      }
      
      if (typeOfCoaching && tuitionCoaching.typeOfCoaching !== typeOfCoaching) {
        include = false;
      }
      
      if (subjects) {
        // Split query subjects by comma if not already an array
        const subjectList = Array.isArray(subjects) ? subjects : (subjects || '').split(',').map(s => s.trim()).filter(s => s !== '');
        const hasSubject = subjectList.some(subject => 
          tuitionCoaching.subjects && Array.isArray(tuitionCoaching.subjects) && tuitionCoaching.subjects.some(stored => stored.toLowerCase() === subject.toLowerCase())
        );
        if (!hasSubject) include = false;
      }
      
      if (maxFee && tuitionCoaching.totalAnnualFee > parseInt(maxFee)) {
        include = false;
      }
      
      if (include) {
        result[key] = tuitionCoaching;
      }
      
      return result;
    }, {});
    
    res.status(200).json({
      success: true,
      data: filteredTuitionCoachings
    });
  } catch (error) {
    console.error('Error searching tuition/coaching centers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search tuition/coaching centers',
      error: error.message
    });
  }
};

// Get all coaching types
const getAllCoachingTypes = async (req, res) => {
  try {
    const coachingTypesRef = db.ref('coachingTypes');
    const snapshot = await coachingTypesRef.once('value');
    const coachingTypes = snapshot.val();
    
    res.status(200).json({
      success: true,
      data: coachingTypes || {}
    });
  } catch (error) {
    console.error('Error fetching coaching types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching types',
      error: error.message
    });
  }
};

// Create new coaching type
const createCoachingType = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Coaching type name is required'
      });
    }
    
    // Check if coaching type already exists
    const coachingTypesRef = db.ref('coachingTypes');
    const snapshot = await coachingTypesRef.once('value');
    const coachingTypes = snapshot.val();
    
    const existingType = Object.values(coachingTypes || {}).find(
      type => type.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'Coaching type already exists'
      });
    }
    
    // Add new coaching type
    const newTypeRef = coachingTypesRef.push();
    const newType = {
      id: newTypeRef.key,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    
    await newTypeRef.set(newType);
    
    res.status(201).json({
      success: true,
      message: 'Coaching type added successfully',
      data: newType
    });
  } catch (error) {
    console.error('Error adding coaching type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add coaching type',
      error: error.message
    });
  }
};

// Delete coaching type
const deleteCoachingType = async (req, res) => {
  try {
    const { id } = req.params;
    const coachingTypeRef = db.ref(`coachingTypes/${id}`);
    const snapshot = await coachingTypeRef.once('value');
    const coachingType = snapshot.val();
    
    if (!coachingType) {
      return res.status(404).json({
        success: false,
        message: 'Coaching type not found'
      });
    }
    
    await coachingTypeRef.remove();
    
    res.status(200).json({
      success: true,
      message: 'Coaching type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coaching type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete coaching type',
      error: error.message
    });
  }
};

module.exports = {
  addTuitionCoaching,
  getTuitionCoachings,
  getTuitionCoaching,
  updateTuitionCoaching,
  deleteTuitionCoaching,
  getAllCoachingTypes,
  createCoachingType,
  deleteCoachingType,
  searchTuitionCoachings
};