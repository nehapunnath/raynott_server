const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');
const College = require('../Models/CollegeModel');
const Review = require('../Models/CollegeReview')

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

// Add a new college
const addCollege = async (req, res) => {
  try {
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);
    
    // Handle placementStatistics - it's coming as an array but should be an object
    let placementStatistics = {};
    if (req.body.placementStatistics) {
      if (Array.isArray(req.body.placementStatistics)) {
        // Try to find the JSON string in the array
        const jsonString = req.body.placementStatistics.find(item => 
          typeof item === 'string' && item.startsWith('{')
        );
        if (jsonString) {
          placementStatistics = safeParse(jsonString, {});
        } else {
          // Fallback: create a simple object
          placementStatistics = { percentage: req.body.placementStatistics[0] || '0%' };
        }
      } else if (typeof req.body.placementStatistics === 'string') {
        placementStatistics = safeParse(req.body.placementStatistics, {});
      }
    }

    // Parse stringified fields safely
    const parsedData = {
      ...req.body,
      coursesOffered: safeParse(req.body.coursesOffered, []),
      entranceExams: safeParse(req.body.entranceExams, []),
      facilities: safeParse(req.body.facilities, []),
      socialMedia: safeParse(req.body.socialMedia, {}),
      placementStatistics: placementStatistics,
      topRecruiters: safeParse(req.body.topRecruiters, []),
      // Set default values for required fields that might be missing
      eligibilityCriteria: req.body.eligibilityCriteria || '',
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
    
    // Create college instance with parsed data
    const collegeData = new College(cleanedData);
    
    // Validate required fields
    const validationErrors = collegeData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Upload college image if provided
    if (req.files && req.files.collegeImage && Array.isArray(req.files.collegeImage) && req.files.collegeImage[0]) {
      console.log('Uploading college image:', req.files.collegeImage[0].originalname);
      try {
        collegeData.collegeImage = await uploadToFirebase(req.files.collegeImage[0], 'colleges/images');
        console.log('College image uploaded to:', collegeData.collegeImage);
      } catch (uploadError) {
        console.error('Failed to upload college image:', uploadError);
        collegeData.collegeImage = '';
      }
    } else {
      console.log('No college image found in request');
      collegeData.collegeImage = '';
    }
    
    // Upload gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      console.log('Uploading gallery photos:', req.files.photos.length);
      const photoUploads = req.files.photos.map(file => 
        uploadToFirebase(file, 'colleges/gallery').catch(error => {
          console.error('Failed to upload photo:', file.originalname, error);
          return null;
        })
      );
      
      const uploadedPhotos = await Promise.all(photoUploads);
      collegeData.photos = uploadedPhotos.filter(photo => photo !== null);
      console.log('Gallery photos uploaded:', collegeData.photos.length);
    } else {
      console.log('No gallery photos found in request');
      collegeData.photos = [];
    }
    
    // Generate a unique ID for the college
    const collegeRef = db.ref('colleges').push();
    const collegeId = collegeRef.key;
    
    // Add timestamps
    collegeData.createdAt = new Date().toISOString();
    collegeData.updatedAt = new Date().toISOString();
    
    // Clean the final data before saving to Firebase
    const finalData = cleanUndefinedValues({
      id: collegeId,
      ...collegeData
    });
    
    // Save to Firebase
    await collegeRef.set(finalData);
    
    res.status(201).json({
      success: true,
      message: 'College added successfully',
      data: finalData
    });
  } catch (error) {
    console.error('Error adding college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add college',
      error: error.message
    });
  }
};

// Get all colleges
const getColleges = async (req, res) => {
  try {
    const collegesRef = db.ref('colleges');
    const snapshot = await collegesRef.once('value');
    const colleges = snapshot.val();
    
    res.status(200).json({
      success: true,
      data: colleges
    });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch colleges',
      error: error.message
    });
  }
};

// Get a single college by ID
const getCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeRef = db.ref(`colleges/${id}`);
    const snapshot = await collegeRef.once('value');
    const college = snapshot.val();
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: college
    });
  } catch (error) {
    console.error('Error fetching college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch college',
      error: error.message
    });
  }
};

// Update a college
const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeRef = db.ref(`colleges/${id}`);
    const snapshot = await collegeRef.once('value');
    const existingCollege = snapshot.val();
    
    if (!existingCollege) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }
    
    // Handle placementStatistics
    let placementStatistics = existingCollege.placementStatistics || {};
    if (req.body.placementStatistics) {
      if (Array.isArray(req.body.placementStatistics)) {
        const jsonString = req.body.placementStatistics.find(item => 
          typeof item === 'string' && item.startsWith('{')
        );
        if (jsonString) {
          placementStatistics = safeParse(jsonString, placementStatistics);
        }
      } else if (typeof req.body.placementStatistics === 'string') {
        placementStatistics = safeParse(req.body.placementStatistics, placementStatistics);
      }
    }

    // Parse stringified fields safely
    const updatedData = {
      ...existingCollege,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    // Handle parsed fields safely
    if (req.body.coursesOffered) {
      updatedData.coursesOffered = safeParse(req.body.coursesOffered, existingCollege.coursesOffered || []);
    }
    if (req.body.entranceExams) {
      updatedData.entranceExams = safeParse(req.body.entranceExams, existingCollege.entranceExams || []);
    }
    if (req.body.facilities) {
      updatedData.facilities = safeParse(req.body.facilities, existingCollege.facilities || []);
    }
    if (req.body.socialMedia) {
      updatedData.socialMedia = safeParse(req.body.socialMedia, existingCollege.socialMedia || {});
    }
    if (req.body.placementStatistics) {
      updatedData.placementStatistics = placementStatistics;
    }
    if (req.body.topRecruiters) {
      updatedData.topRecruiters = safeParse(req.body.topRecruiters, existingCollege.topRecruiters || []);
    }
    
    // Convert numeric fields
    if (req.body.totalAnnualFee) updatedData.totalAnnualFee = parseInt(req.body.totalAnnualFee);
    if (req.body.admissionFee) updatedData.admissionFee = parseInt(req.body.admissionFee);
    if (req.body.tuitionFee) updatedData.tuitionFee = parseInt(req.body.tuitionFee);
    if (req.body.transportFee) updatedData.transportFee = parseInt(req.body.transportFee);
    if (req.body.booksUniformsFee) updatedData.booksUniformsFee = parseInt(req.body.booksUniformsFee);
    if (req.body.establishmentYear) updatedData.establishmentYear = parseInt(req.body.establishmentYear);
    
    // Upload new college image if provided
    if (req.files && req.files.collegeImage && Array.isArray(req.files.collegeImage) && req.files.collegeImage[0]) {
      try {
        updatedData.collegeImage = await uploadToFirebase(req.files.collegeImage[0], 'colleges/images');
      } catch (uploadError) {
        console.error('Failed to upload college image:', uploadError);
        updatedData.collegeImage = existingCollege.collegeImage || '';
      }
    }
    
    // Upload new gallery photos if provided
    if (req.files && req.files.photos && Array.isArray(req.files.photos) && req.files.photos.length > 0) {
      const photoUploads = req.files.photos.map(file => 
        uploadToFirebase(file, 'colleges/gallery').catch(error => {
          console.error('Failed to upload photo:', error);
          return null;
        })
      );
      const newPhotos = await Promise.all(photoUploads);
      const validNewPhotos = newPhotos.filter(photo => photo !== null);
      updatedData.photos = [...(existingCollege.photos || []), ...validNewPhotos];
    }
    
    // Clean undefined values before saving
    const cleanedData = cleanUndefinedValues(updatedData);
    
    // Save to Firebase
    await collegeRef.set(cleanedData);
    
    res.status(200).json({
      success: true,
      message: 'College updated successfully',
      data: cleanedData
    });
  } catch (error) {
    console.error('Error updating college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update college',
      error: error.message
    });
  }
};

// Delete a college
const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeRef = db.ref(`colleges/${id}`);
    const snapshot = await collegeRef.once('value');
    const college = snapshot.val();
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }
    
    // Delete from Firebase
    await collegeRef.remove();
    
    res.status(200).json({
      success: true,
      message: 'College deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting college:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete college',
      error: error.message
    });
  }
};

// Search colleges by filters (including city)
const searchColleges = async (req, res) => {
  try {
    const { 
      city, 
      state, 
      typeOfCollege, 
      courses, 
      maxFee 
    } = req.query;
    
    const collegesRef = db.ref('colleges');
    const snapshot = await collegesRef.once('value');
    const colleges = snapshot.val();
    
    if (!colleges) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }
    
    // Filter colleges based on query parameters (including city)
    const filteredColleges = Object.keys(colleges).reduce((result, key) => {
      const college = colleges[key];
      let include = true;
      
      if (city && college.city && college.city.toLowerCase() !== city.toLowerCase()) {
        include = false;
      }
      
      if (state && college.state && college.state.toLowerCase() !== state.toLowerCase()) {
        include = false;
      }
      
      if (typeOfCollege && college.typeOfCollege !== typeOfCollege) {
        include = false;
      }
      
      if (courses) {
        const courseList = courses.split(',');
        const hasCourse = courseList.some(course => 
          college.coursesOffered && college.coursesOffered.includes(course)
        );
        if (!hasCourse) include = false;
      }
      
      if (maxFee && college.totalAnnualFee > parseInt(maxFee)) {
        include = false;
      }
      
      if (include) {
        result[key] = college;
      }
      
      return result;
    }, {});
    
    res.status(200).json({
      success: true,
      data: filteredColleges
    });
  } catch (error) {
    console.error('Error searching colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search colleges',
      error: error.message
    });
  }
};

// Get all college types
const getAllCollegeTypes = async (req, res) => {
  try {
    const collegeTypesRef = db.ref('collegeTypes');
    const snapshot = await collegeTypesRef.once('value');
    const collegeTypes = snapshot.val();
    
    res.status(200).json({
      success: true,
      data: collegeTypes || {}
    });
  } catch (error) {
    console.error('Error fetching college types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch college types',
      error: error.message
    });
  }
};

// Create new college type
const createCollegeType = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'College type name is required'
      });
    }
    
    // Check if college type already exists
    const collegeTypesRef = db.ref('collegeTypes');
    const snapshot = await collegeTypesRef.once('value');
    const collegeTypes = snapshot.val();
    
    const existingType = Object.values(collegeTypes || {}).find(
      type => type.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingType) {
      return res.status(400).json({
        success: false,
        message: 'College type already exists'
      });
    }
    
    // Add new college type
    const newTypeRef = collegeTypesRef.push();
    const newType = {
      id: newTypeRef.key,
      name: name.trim(),
      createdAt: new Date().toISOString()
    };
    
    await newTypeRef.set(newType);
    
    res.status(201).json({
      success: true,
      message: 'College type added successfully',
      data: newType
    });
  } catch (error) {
    console.error('Error adding college type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add college type',
      error: error.message
    });
  }
};

// Delete college type
const deleteCollegeType = async (req, res) => {
  try {
    const { id } = req.params;
    const collegeTypeRef = db.ref(`collegeTypes/${id}`);
    const snapshot = await collegeTypeRef.once('value');
    const collegeType = snapshot.val();
    
    if (!collegeType) {
      return res.status(404).json({
        success: false,
        message: 'College type not found'
      });
    }
    
    await collegeTypeRef.remove();
    
    res.status(200).json({
      success: true,
      message: 'College type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting college type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete college type',
      error: error.message
    });
  }
}
const addReview = async (req, res) => {
  try {
    const { text, rating, collegeId, author } = req.body;

    // Create review instance
    const reviewData = new Review({
      text,
      rating: parseInt(rating),
      collegeId,
      author
    });

    // Validate review data
    const validationErrors = reviewData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Check if college exists
    const collegeRef = db.ref(`colleges/${collegeId}`);
    const collegeSnapshot = await collegeRef.once('value');
    if (!collegeSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    // Generate a unique ID for the review
    const reviewRef = db.ref(`reviews/${collegeId}`).push();
    const reviewId = reviewRef.key;

    // Save review to Firebase
    await reviewRef.set({
      id: reviewId,
      ...reviewData
    });

    // Update college's average rating and review count
    const reviewsSnapshot = await db.ref(`reviews/${collegeId}`).once('value');
    const reviews = reviewsSnapshot.val() || {};
    const reviewList = Object.values(reviews);
    const avgRating = reviewList.length
      ? reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length
      : 0;

    await collegeRef.update({
      rating: avgRating.toFixed(1),
      reviewCount: reviewList.length,
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: {
        id: reviewId,
        ...reviewData
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review',
      error: error.message
    });
  }
};

// Get reviews for a college
const getReviews = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const reviewsRef = db.ref(`reviews/${collegeId}`);
    const snapshot = await reviewsRef.once('value');
    const reviews = snapshot.val() || {};

    res.status(200).json({
      success: true,
      data: Object.values(reviews),
      count: Object.keys(reviews).length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Like a review
const likeReview = async (req, res) => {
  try {
    const { collegeId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/${collegeId}/${reviewId}`);
    const snapshot = await reviewRef.once('value');
    const review = snapshot.val();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await reviewRef.update({
      likes: (review.likes || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Review liked successfully'
    });
  } catch (error) {
    console.error('Error liking review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like review',
      error: error.message
    });
  }
};

// Dislike a review
const dislikeReview = async (req, res) => {
  try {
    const { collegeId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/${collegeId}/${reviewId}`);
    const snapshot = await reviewRef.once('value');
    const review = snapshot.val();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await reviewRef.update({
      dislikes: (review.dislikes || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Review disliked successfully'
    });
  } catch (error) {
    console.error('Error disliking review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dislike review',
      error: error.message
    });
  }
};

module.exports = {
  addCollege,
  getColleges,
  getCollege,
  updateCollege,
  deleteCollege,
  getAllCollegeTypes,
  createCollegeType,
  deleteCollegeType,
  searchColleges,
  addReview,
  getReviews,
  likeReview,
  dislikeReview
};