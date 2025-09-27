const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');
const School = require('../Models/SchoolModel');

const addSchool = async (req, res) => {
  try {
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);
    
    const parsedData = {
      ...req.body,
      facilities: req.body.facilities ? JSON.parse(req.body.facilities) : [],
      socialMedia: req.body.socialMedia ? JSON.parse(req.body.socialMedia) : {}
    };
    
    const schoolData = new School(parsedData);
    
    const validationErrors = schoolData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
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
    
    const schoolRef = db.ref('schools').push();
    const schoolId = schoolRef.key;
    
    schoolData.createdAt = new Date().toISOString();
    schoolData.updatedAt = new Date().toISOString();
    
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
    
    const updatedData = {
      ...existingSchool,
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    if (req.files && req.files.schoolImage && Array.isArray(req.files.schoolImage) && req.files.schoolImage[0]) {
      try {
        updatedData.schoolImage = await uploadToFirebase(req.files.schoolImage[0], 'schools/images');
      } catch (uploadError) {
        console.error('Failed to upload school image:', uploadError);
        updatedData.schoolImage = existingSchool.schoolImage || '';
      }
    }
    
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
    
    const filteredSchools = Object.keys(schools).reduce((result, key) => {
      const school = schools[key];
      let include = true;
      
      if (city && school.city && school.city.toLowerCase() !== city.toLowerCase()) {
        include = false;
      }
      
      if (board && school.board && school.board.toLowerCase() !== board.toLowerCase()) {
        include = false;
      }
      
      if (schoolType && school.schoolType && school.schoolType.toLowerCase() !== schoolType.toLowerCase()) {
        include = false;
      }
      
      if (gender && school.gender && school.gender.toLowerCase() !== gender.toLowerCase()) {
        include = false;
      }
      
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
const getReviews = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const reviewsRef = db.ref(`reviews/${schoolId}`);
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
const addReview = async (req, res) => {
  try {
    const { text, rating, schoolId, author } = req.body;

    // Create review instance
    const reviewData = new School({
      text,
      rating: parseInt(rating),
      schoolId,
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

    // Check if school exists
    const schoolRef = db.ref(`schools/${schoolId}`);
    const schoolSnapshot = await schoolRef.once('value');
    if (!schoolSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Generate a unique ID for the review
    const reviewRef = db.ref(`reviews/${schoolId}`).push();
    const reviewId = reviewRef.key;

    // Save review to Firebase
    await reviewRef.set({
      id: reviewId,
      ...reviewData
    });

    // Update school's average rating and review count
    const reviewsSnapshot = await db.ref(`reviews/${schoolId}`).once('value');
    const reviews = reviewsSnapshot.val() || {};
    const reviewList = Object.values(reviews);
    const avgRating = reviewList.length
      ? reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length
      : 0;

    await schoolRef.update({
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


const likeReview = async (req, res) => {
  try {
    const { schoolId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/${schoolId}/${reviewId}`);
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

const dislikeReview = async (req, res) => {
  try {
    const { schoolId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/${schoolId}/${reviewId}`);
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
  addSchool,
  getSchools,
  getSchool,
  updateSchool,
  deleteSchool,
  getSchoolsWithFilters,
  addReview,
  getReviews,
  likeReview,
  dislikeReview

};