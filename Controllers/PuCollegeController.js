const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');
const PUCollege = require('../Models/PuCollegeModel');

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

// Helper function for safe JSON parsing
const safeParse = (data, defaultValue = null) => {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('JSON parse error:', error);
      return defaultValue !== null ? defaultValue : data;
    }
  }
  return data;
};

// Add a new PU College
const addPUCollege = async (req, res) => {
  try {
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    // Parse stringified fields safely
    const parsedData = {
      ...req.body,
      streams: safeParse(req.body.streams, []),
      subjects: safeParse(req.body.subjects, []),
      facilities: safeParse(req.body.facilities, []),
      socialMedia: safeParse(req.body.socialMedia, {}),
      // Set default values for required fields that might be missing
      competitiveExamPrep: req.body.competitiveExamPrep || '',
      transportation: req.body.transportation || '',
      // Convert string numbers to actual numbers
      totalAnnualFee: parseInt(req.body.totalAnnualFee) || 0,
      admissionFee: parseInt(req.body.admissionFee) || 0,
      tuitionFee: parseInt(req.body.tuitionFee) || 0,
      transportFee: parseInt(req.body.transportFee) || 0,
      booksUniformsFee: parseInt(req.body.booksUniformsFee) || 0,
      establishmentYear: parseInt(req.body.establishmentYear) || 0,
      campusSize: req.body.campusSize || '',
      classrooms: req.body.classrooms || '',
      // Remove the preview field as it's not needed in database
      collegeImagePreview: undefined
    };

    // Clean undefined values
    const cleanedData = cleanUndefinedValues(parsedData);

    // Create PU college instance with parsed data
    const puCollegeData = new PUCollege(cleanedData);

    // Validate required fields
    const validationErrors = puCollegeData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Upload PU college image if provided
    if (req.files && req.files.collegeImage && Array.isArray(req.files.collegeImage) && req.files.collegeImage[0]) {
      console.log('Uploading PU college image:', req.files.collegeImage[0].originalname);
      try {
        puCollegeData.collegeImage = await uploadToFirebase(req.files.collegeImage[0], 'pucolleges/images');
        console.log('PU college image uploaded to:', puCollegeData.collegeImage);
      } catch (uploadError) {
        console.error('Failed to upload PU college image:', uploadError);
        puCollegeData.collegeImage = '';
      }
    } else {
      console.log('No PU college image found in request');
      puCollegeData.collegeImage = '';
    }

    // Upload gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      console.log('Uploading gallery photos:', req.files.photos.length);
      const photoUploads = req.files.photos.map(file =>
        uploadToFirebase(file, 'pucolleges/gallery').catch(error => {
          console.error('Failed to upload photo:', file.originalname, error);
          return null;
        })
      );

      const uploadedPhotos = await Promise.all(photoUploads);
      puCollegeData.photos = uploadedPhotos.filter(photo => photo !== null);
      console.log('Gallery photos uploaded:', puCollegeData.photos.length);
    } else {
      console.log('No gallery photos found in request');
      puCollegeData.photos = [];
    }

    // Generate a unique ID for the PU college
    const puCollegeRef = db.ref('pucolleges').push();
    const puCollegeId = puCollegeRef.key;

    // Add timestamps
    puCollegeData.createdAt = new Date().toISOString();
    puCollegeData.updatedAt = new Date().toISOString();

    // Clean the final data before saving to Firebase
    const finalData = cleanUndefinedValues({
      id: puCollegeId,
      ...puCollegeData
    });

    // Save to Firebase
    await puCollegeRef.set(finalData);

    res.status(201).json({
      success: true,
      message: 'PU College added successfully',
      data: finalData
    });
  } catch (error) {
    console.error('Error adding PU college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add PU college',
      error: error.message
    });
  }
};

// Get all PU Colleges
const getPUColleges = async (req, res) => {
  try {
    const puCollegesRef = db.ref('pucolleges');
    const snapshot = await puCollegesRef.once('value');
    const puColleges = snapshot.val();

    res.status(200).json({
      success: true,
      data: puColleges
    });
  } catch (error) {
    console.error('Error fetching PU colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PU colleges',
      error: error.message
    });
  }
};

// Get a single PU College by ID
const getPUCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const puCollegeRef = db.ref(`pucolleges/${id}`);
    const snapshot = await puCollegeRef.once('value');
    const puCollege = snapshot.val();

    if (!puCollege) {
      return res.status(404).json({
        success: false,
        message: 'PU College not found'
      });
    }

    res.status(200).json({
      success: true,
      data: puCollege
    });
  } catch (error) {
    console.error('Error fetching PU college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PU college',
      error: error.message
    });
  }
};

// Update a PU College
const updatePUCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const puCollegeRef = db.ref(`pucolleges/${id}`);
    const snapshot = await puCollegeRef.once('value');
    const existingPUCollege = snapshot.val();

    if (!existingPUCollege) {
      return res.status(404).json({
        success: false,
        message: 'PU College not found'
      });
    }

    // Parse stringified fields safely
    const updatedData = {
      ...existingPUCollege,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Handle parsed fields safely
    if (req.body.streams) {
      updatedData.streams = safeParse(req.body.streams, existingPUCollege.streams || []);
    }
    if (req.body.subjects) {
      updatedData.subjects = safeParse(req.body.subjects, existingPUCollege.subjects || []);
    }
    if (req.body.facilities) {
      updatedData.facilities = safeParse(req.body.facilities, existingPUCollege.facilities || []);
    }
    if (req.body.socialMedia) {
      updatedData.socialMedia = safeParse(req.body.socialMedia, existingPUCollege.socialMedia || {});
    }

    // Convert numeric fields
    if (req.body.totalAnnualFee) updatedData.totalAnnualFee = parseInt(req.body.totalAnnualFee);
    if (req.body.admissionFee) updatedData.admissionFee = parseInt(req.body.admissionFee);
    if (req.body.tuitionFee) updatedData.tuitionFee = parseInt(req.body.tuitionFee);
    if (req.body.transportFee) updatedData.transportFee = parseInt(req.body.transportFee);
    if (req.body.booksUniformsFee) updatedData.booksUniformsFee = parseInt(req.body.booksUniformsFee);
    if (req.body.establishmentYear) updatedData.establishmentYear = parseInt(req.body.establishmentYear);

    // Upload new PU college image if provided
    if (req.files && req.files.collegeImage && Array.isArray(req.files.collegeImage) && req.files.collegeImage[0]) {
      try {
        updatedData.collegeImage = await uploadToFirebase(req.files.collegeImage[0], 'pucolleges/images');
      } catch (uploadError) {
        console.error('Failed to upload PU college image:', uploadError);
        updatedData.collegeImage = existingPUCollege.collegeImage || '';
      }
    }

    // Upload new gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      const photoUploads = req.files.photos.map(file =>
        uploadToFirebase(file, 'pucolleges/gallery').catch(error => {
          console.error('Failed to upload photo:', error);
          return null;
        })
      );
      const newPhotos = await Promise.all(photoUploads);
      const validNewPhotos = newPhotos.filter(photo => photo !== null);
      updatedData.photos = [...(existingPUCollege.photos || []), ...validNewPhotos];
    }

    // Clean undefined values before saving
    const cleanedData = cleanUndefinedValues(updatedData);

    // Save to Firebase
    await puCollegeRef.set(cleanedData);

    res.status(200).json({
      success: true,
      message: 'PU College updated successfully',
      data: cleanedData
    });
  } catch (error) {
    console.error('Error updating PU college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update PU college',
      error: error.message
    });
  }
};

// Delete a PU College
const deletePUCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const puCollegeRef = db.ref(`pucolleges/${id}`);
    const snapshot = await puCollegeRef.once('value');
    const puCollege = snapshot.val();

    if (!puCollege) {
      return res.status(404).json({
        success: false,
        message: 'PU College not found'
      });
    }

    // Delete from Firebase
    await puCollegeRef.remove();

    res.status(200).json({
      success: true,
      message: 'PU College deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting PU college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete PU college',
      error: error.message
    });
  }
};

// Search PU Colleges by filters
const searchPUColleges = async (req, res) => {
  try {
    const { city, state, typeOfCollege, streams, maxFee } = req.query;

    const puCollegesRef = db.ref('pucolleges');
    const snapshot = await puCollegesRef.once('value');
    const puColleges = snapshot.val();

    if (!puColleges) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }

    // Filter PU colleges based on query parameters
    const filteredPUColleges = Object.keys(puColleges).reduce((result, key) => {
      const puCollege = puColleges[key];
      let include = true;

      if (city && puCollege.city && puCollege.city.toLowerCase() !== city.toLowerCase()) {
        include = false;
      }

      if (state && puCollege.state && puCollege.state.toLowerCase() !== state.toLowerCase()) {
        include = false;
      }

      if (typeOfCollege && puCollege.typeOfCollege !== typeOfCollege) {
        include = false;
      }

      if (streams) {
        const streamList = streams.split(',');
        const hasStream = streamList.some(stream =>
          puCollege.streams && puCollege.streams.includes(stream)
        );
        if (!hasStream) include = false;
      }

      if (maxFee && puCollege.totalAnnualFee > parseInt(maxFee)) {
        include = false;
      }

      if (include) {
        result[key] = puCollege;
      }

      return result;
    }, {});

    res.status(200).json({
      success: true,
      data: filteredPUColleges
    });
  } catch (error) {
    console.error('Error searching PU colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search PU colleges',
      error: error.message
    });
  }
};

// Get all PU College types
const getAllPUCollegeTypes = async (req, res) => {
  try {
    const puCollegeTypesRef = db.ref('puCollegeTypes');
    const snapshot = await puCollegeTypesRef.once('value');
    const puCollegeTypes = snapshot.val();

    res.status(200).json({
      success: true,
      data: puCollegeTypes || {}
    });
  } catch (error) {
    console.error('Error fetching PU college types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch PU college types',
      error: error.message
    });
  }
};

// Create new PU College type
const createPUCollegeType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'PU College type name is required'
      });
    }

    // Check if PU college type already exists
    const puCollegeTypesRef = db.ref('puCollegeTypes');
    const snapshot = await puCollegeTypesRef.once('value');
    const puCollegeTypes = snapshot.val();

    const existingType = Object.values(puCollegeTypes || {}).find(
      type => type.name.toLowerCase() === name.toLowerCase()
    );

    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'PU College type already exists'
      });
    }

    // Add new PU college type
    const newTypeRef = puCollegeTypesRef.push();
    const newType = {
      id: newTypeRef.key,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };

    await newTypeRef.set(newType);

    res.status(201).json({
      success: true,
      message: 'PU College type added successfully',
      data: newType
    });
  } catch (error) {
    console.error('Error adding PU college type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add PU college type',
      error: error.message
    });
  }
};

// Delete PU College type
const deletePUCollegeType = async (req, res) => {
  try {
    const { id } = req.params;
    const puCollegeTypeRef = db.ref(`puCollegeTypes/${id}`);
    const snapshot = await puCollegeTypeRef.once('value');
    const puCollegeType = snapshot.val();

    if (!puCollegeType) {
      return res.status(404).json({
        success: false,
        message: 'PU College type not found'
      });
    }

    await puCollegeTypeRef.remove();

    res.status(200).json({
      success: true,
      message: 'PU College type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting PU college type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete PU college type',
      error: error.message
    });
  }
};

module.exports = {
  addPUCollege,
  getPUColleges,
  getPUCollege,
  updatePUCollege,
  deletePUCollege,
  getAllPUCollegeTypes,
  createPUCollegeType,
  deletePUCollegeType,
  searchPUColleges
};