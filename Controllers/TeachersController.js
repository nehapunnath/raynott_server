const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');
const Teacher = require('../Models/TeachersModel');
const ReviewModel = require('../Models/TeacherReview');

// Add a new teacher
const addTeacher = async (req, res) => {
  try {
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);

    // Parse stringified fields
    const parsedData = {
      ...req.body,
      facilities: req.body.facilities ? JSON.parse(req.body.facilities) : [],
      socialMedia: req.body.socialMedia ? JSON.parse(req.body.socialMedia) : {}
    };

    // Create teacher instance with parsed data
    const teacherData = new Teacher(parsedData);

    // Validate required fields
    const validationErrors = teacherData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Upload profile image if provided
    if (req.files && req.files.profileImage && Array.isArray(req.files.profileImage) && req.files.profileImage[0]) {
      console.log('Uploading profile image:', req.files.profileImage[0].originalname);
      try {
        teacherData.profileImage = await uploadToFirebase(req.files.profileImage[0], 'teachers/images');
        console.log('Profile image uploaded to:', teacherData.profileImage);
      } catch (uploadError) {
        console.error('Failed to upload profile image:', uploadError);
        teacherData.profileImage = '';
      }
    } else {
      console.log('No profile image found in request');
      teacherData.profileImage = '';
    }

    // Generate a unique ID for the teacher
    const teacherRef = db.ref('teachers').push();
    const teacherId = teacherRef.key;

    // Add timestamps
    teacherData.createdAt = new Date().toISOString();
    teacherData.updatedAt = new Date().toISOString();

    // Save to Firebase
    await teacherRef.set({
      id: teacherId,
      ...teacherData
    });

    res.status(201).json({
      success: true,
      message: 'Teacher added successfully',
      data: {
        id: teacherId,
        ...teacherData
      }
    });
  } catch (error) {
    console.error('Error adding teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add teacher',
      error: error.message
    });
  }
};

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    const teachersRef = db.ref('teachers');
    const snapshot = await teachersRef.once('value');
    const teachers = snapshot.val();

    res.status(200).json({
      success: true,
      data: teachers || {}
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

// Get professional teachers (School, College, PU College, Coaching Institute)
const getProfessionalTeachers = async (req, res) => {
  try {
    const { city, subjects, maxHourlyRate, minHourlyRate, teachingMode } = req.query;
    
    const professionalTypes = ['School', 'College', 'PU College', 'Coaching Institute'];
    const institutionTypes = professionalTypes.join(',');

    // Call the existing filter function with professional institution types
    const filteredData = await getFilteredTeachers({ 
      city, 
      subjects, 
      institutionType: institutionTypes,
      maxHourlyRate, 
      minHourlyRate, 
      teachingMode 
    });

    res.status(200).json({
      success: true,
      data: filteredData,
      count: Object.keys(filteredData).length
    });
  } catch (error) {
    console.error('Error fetching professional teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professional teachers',
      error: error.message
    });
  }
};

// Get personal mentors (Personal Mentor)
const getPersonalMentors = async (req, res) => {
  try {
    const { city, subjects, maxHourlyRate, minHourlyRate, teachingMode } = req.query;
    
    const personalType = 'Personal Mentor';
    const institutionType = personalType;

    // Call the existing filter function with personal institution type
    const filteredData = await getFilteredTeachers({ 
      city, 
      subjects, 
      institutionType,
      maxHourlyRate, 
      minHourlyRate, 
      teachingMode 
    });

    res.status(200).json({
      success: true,
      data: filteredData,
      count: Object.keys(filteredData).length
    });
  } catch (error) {
    console.error('Error fetching personal mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personal mentors',
      error: error.message
    });
  }
};

const getFilteredTeachers = async (queryParams) => {
  const { city, subjects, institutionType, maxHourlyRate, minHourlyRate, teachingMode } = queryParams;

  console.log('Query Parameters:', queryParams);

  const teachersRef = db.ref('teachers');
  const snapshot = await teachersRef.once('value');
  const teachers = snapshot.val();

  console.log('Raw teachers data from Firebase:', teachers);

  if (!teachers) {
    console.log('No teachers found in database');
    return {};
  }

  const institutionTypes = institutionType ? institutionType.toLowerCase().split(',').map(type => type.trim()) : [];
  const subjectList = subjects ? subjects.toLowerCase().split(',').map(sub => sub.trim()) : [];
  const teachingModes = teachingMode ? teachingMode.toLowerCase().split(',').map(mode => mode.trim()) : [];

  console.log('Parsed filters:', { institutionTypes, subjectList, teachingModes });

  const filteredTeachers = Object.keys(teachers).reduce((result, key) => {
    const teacher = teachers[key];
    let include = true;

    // City filter (case-insensitive or map Bengaluru to Bangalore)
    if (city && teacher.city) {
      const normalizedCity = city.toLowerCase() === 'bengaluru' ? 'bangalore' : city.toLowerCase();
      if (teacher.city.toLowerCase() !== normalizedCity) {
        console.log(`Teacher ${key} excluded: city mismatch (${teacher.city} != ${city})`);
        include = false;
      }
    }

    // Subjects filter
    if (subjectList.length > 0 && teacher.subjects) {
      const teacherSubjects = teacher.subjects.toLowerCase().split(',').map(s => s.trim());
      if (!subjectList.some(qSub => teacherSubjects.some(tSub => tSub.includes(qSub)))) {
        console.log(`Teacher ${key} excluded: subjects mismatch (${teacher.subjects} not in ${subjects})`);
        include = false;
      }
    }

    // Institution type filter
    if (institutionTypes.length > 0 && teacher.institutionType) {
      if (!institutionTypes.includes(teacher.institutionType.toLowerCase().trim())) {
        console.log(`Teacher ${key} excluded: institutionType mismatch (${teacher.institutionType} not in ${institutionTypes})`);
        include = false;
      }
    }

    // Teaching mode filter
    if (teachingModes.length > 0 && teacher.teachingMode) {
      if (!teachingModes.includes(teacher.teachingMode.toLowerCase().trim())) {
        console.log(`Teacher ${key} excluded: teachingMode mismatch (${teacher.teachingMode} not in ${teachingModes})`);
        include = false;
      }
    }

    // Hourly rate range filter
    if (minHourlyRate && teacher.hourlyRate) {
      const rate = parseFloat(teacher.hourlyRate.replace(/[^0-9.-]+/g, ''));
      if (isNaN(rate) || rate < parseFloat(minHourlyRate)) {
        console.log(`Teacher ${key} excluded: minHourlyRate mismatch (${rate} < ${minHourlyRate})`);
        include = false;
      }
    }

    if (maxHourlyRate && teacher.hourlyRate) {
      const rate = parseFloat(teacher.hourlyRate.replace(/[^0-9.-]+/g, ''));
      if (isNaN(rate) || rate > parseFloat(maxHourlyRate)) {
        console.log(`Teacher ${key} excluded: maxHourlyRate mismatch (${rate} > ${maxHourlyRate})`);
        include = false;
      }
    }

    if (include) {
      console.log(`Teacher ${key} included`);
      result[key] = teacher;
    }

    return result;
  }, {});

  console.log('Filtered teachers:', filteredTeachers);
  return filteredTeachers;
};

// Get a single teacher by ID
const getTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherRef = db.ref(`teachers/${id}`);
    const snapshot = await teacherRef.once('value');
    const teacher = snapshot.val();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher',
      error: error.message
    });
  }
};

// Update a teacher
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherRef = db.ref(`teachers/${id}`);
    const snapshot = await teacherRef.once('value');
    const existingTeacher = snapshot.val();

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Update teacher data
    const updatedData = {
      ...existingTeacher,
      ...req.body,
      facilities: req.body.facilities ? JSON.parse(req.body.facilities) : existingTeacher.facilities,
      socialMedia: req.body.socialMedia ? JSON.parse(req.body.socialMedia) : existingTeacher.socialMedia,
      updatedAt: new Date().toISOString()
    };

    // Upload new profile image if provided
    if (req.files && req.files.profileImage && Array.isArray(req.files.profileImage) && req.files.profileImage[0]) {
      try {
        updatedData.profileImage = await uploadToFirebase(req.files.profileImage[0], 'teachers/images');
      } catch (uploadError) {
        console.error('Failed to upload profile image:', uploadError);
        updatedData.profileImage = existingTeacher.profileImage || '';
      }
    }

    // Save to Firebase
    await teacherRef.set(updatedData);

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update teacher',
      error: error.message
    });
  }
};

// Delete a teacher
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherRef = db.ref(`teachers/${id}`);
    const snapshot = await teacherRef.once('value');
    const teacher = snapshot.val();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Delete from Firebase
    await teacherRef.remove();

    res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete teacher',
      error: error.message
    });
  }
};

// Get all teachers with optional filtering (kept for backward compatibility)
const getTeachersWithFilters = async (req, res) => {
  try {
    const { city, subjects, institutionType, maxHourlyRate, minHourlyRate, teachingMode } = req.query;

    const filteredData = await getFilteredTeachers({ 
      city, 
      subjects, 
      institutionType, 
      maxHourlyRate, 
      minHourlyRate, 
      teachingMode 
    });

    res.status(200).json({
      success: true,
      data: filteredData,
      count: Object.keys(filteredData).length
    });
  } catch (error) {
    console.error('Error fetching filtered teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
};

// Get professional teacher details by ID
const getProfessionalTeacherDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherRef = db.ref(`teachers/${id}`);
    const snapshot = await teacherRef.once('value');
    const teacher = snapshot.val();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Check if it's a professional teacher
    const professionalTypes = ['school', 'college', 'pu college', 'coaching institute'];
    const teacherType = teacher.institutionType ? teacher.institutionType.toLowerCase().trim() : '';
    
    if (!professionalTypes.includes(teacherType)) {
      return res.status(400).json({
        success: false,
        message: 'This teacher is not a professional teacher'
      });
    }

    // Enhanced professional teacher data structure
    const professionalTeacherData = {
      id,
      basicInfo: {
        name: teacher.name || 'Not specified',
        profileImage: teacher.profileImage || '',
        institutionType: teacher.institutionType || 'Not specified',
        subjects: teacher.subjects ? teacher.subjects.split(',').map(s => s.trim()) : [],
        qualification: teacher.qualification || 'Not specified',
        experience: teacher.experience || 'Not specified',
        rating: parseFloat(teacher.rating) || 4.5,
        city: teacher.city || 'Not specified',
        address: teacher.address || 'Not specified'
      },
      teachingDetails: {
        hourlyRate: teacher.hourlyRate || 'Not specified',
        monthlyPackage: teacher.monthlyPackage || 'Not specified',
        demoFee: teacher.demoFee || 'Not specified',
        teachingMode: teacher.teachingMode || 'Not specified',
        sessionDuration: teacher.sessionDuration || 'Not specified',
        studentLevel: teacher.studentLevel || 'Not specified',
        classSize: teacher.classSize || 'Not specified',
        teachingApproach: teacher.teachingApproach || 'Not specified',
        studyMaterials: teacher.studyMaterials || 'Not specified',
        examPreparation: teacher.examPreparation || 'Not specified'
      },
      specialization: {
        specialization: teacher.specialization ? teacher.specialization.split(',').map(s => s.trim()) : [],
        certifications: teacher.certifications ? teacher.certifications.split(',').map(c => c.trim()) : [],
        languages: teacher.languages ? teacher.languages.split(',').map(l => l.trim()) : []
      },
      availability: {
        availability: teacher.availability || 'Not specified',
        onlinePlatform: teacher.onlinePlatform || 'Not specified',
        progressReports: teacher.progressReports || 'Not specified',
        performanceTracking: teacher.performanceTracking || 'Not specified',
        teachingProcess: teacher.teachingProcess || 'Not specified'
      },
      facilities: teacher.facilities || [],
      about: teacher.about || 'No description available',
      contact: {
        phone: teacher.phone || 'Not specified',
        email: teacher.email || 'Not specified',
        website: teacher.website || '',
        socialMedia: teacher.socialMedia || {},
        googleMapsEmbedUrl: teacher.googleMapsEmbedUrl || ''
      },
      timestamps: {
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }
    };

    res.status(200).json({
      success: true,
      message: 'Professional teacher details retrieved successfully',
      data: professionalTeacherData
    });
  } catch (error) {
    console.error('Error fetching professional teacher details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professional teacher details',
      error: error.message
    });
  }
};

// Get personal mentor details by ID
const getPersonalMentorDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherRef = db.ref(`teachers/${id}`);
    const snapshot = await teacherRef.once('value');
    const teacher = snapshot.val();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Check if it's a personal mentor
    const personalType = 'personal mentor';
    const teacherType = teacher.institutionType ? teacher.institutionType.toLowerCase().trim() : '';
    
    if (teacherType !== personalType) {
      return res.status(400).json({
        success: false,
        message: 'This teacher is not a personal mentor'
      });
    }

    // Enhanced personal mentor data structure
    const personalMentorData = {
      id,
      basicInfo: {
        name: teacher.name || 'Not specified',
        profileImage: teacher.profileImage || '',
        institutionType: teacher.institutionType || 'Personal Mentor',
        subjects: teacher.subjects ? teacher.subjects.split(',').map(s => s.trim()) : [],
        qualification: teacher.qualification || 'Not specified',
        experience: teacher.experience || 'Not specified',
        rating: parseFloat(teacher.rating) || 4.5,
        city: teacher.city || 'Not specified',
        address: teacher.address || 'Not specified'
      },
      mentoringDetails: {
        hourlyRate: teacher.hourlyRate || 'Not specified',
        monthlyPackage: teacher.monthlyPackage || 'Not specified',
        demoFee: teacher.demoFee || 'Not specified',
        mentoringMode: teacher.teachingMode || 'Not specified',
        sessionDuration: teacher.sessionDuration || 'Not specified',
        studentLevel: teacher.studentLevel || 'Not specified',
        classSize: teacher.classSize || 'Not specified',
        mentoringApproach: teacher.teachingApproach || 'Not specified',
        studyMaterials: teacher.studyMaterials || 'Not specified',
        specialization: teacher.specialization ? teacher.specialization.split(',').map(s => s.trim()) : []
      },
      expertise: {
        certifications: teacher.certifications ? teacher.certifications.split(',').map(c => c.trim()) : [],
        languages: teacher.languages ? teacher.languages.split(',').map(l => l.trim()) : [],
        skills: teacher.specialization ? teacher.specialization.split(',').map(s => s.trim()) : []
      },
      availability: {
        availability: teacher.availability || 'Not specified',
        onlinePlatform: teacher.onlinePlatform || 'Not specified',
        progressTracking: teacher.performanceTracking || 'Not specified',
        mentoringProcess: teacher.teachingProcess || 'Not specified',
        personalizedGuidance: teacher.progressReports || 'Not specified'
      },
      facilities: teacher.facilities || [],
      about: teacher.about || 'No description available',
      contact: {
        phone: teacher.phone || 'Not specified',
        email: teacher.email || 'Not specified',
        website: teacher.website || '',
        socialMedia: teacher.socialMedia || {},
        googleMapsEmbedUrl: teacher.googleMapsEmbedUrl || ''
      },
      timestamps: {
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }
    };

    res.status(200).json({
      success: true,
      message: 'Personal mentor details retrieved successfully',
      data: personalMentorData
    });
  } catch (error) {
    console.error('Error fetching personal mentor details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personal mentor details',
      error: error.message
    });
  }
};

const searchProfessionalTeachersByName = async (req, res) => {
  try {
    const { name, city, subjects, maxHourlyRate, minHourlyRate, teachingMode } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name query parameter is required'
      });
    }

    const professionalTypes = ['School', 'College', 'PU College', 'Coaching Institute'];
    const institutionTypes = professionalTypes.join(',');

    const filteredData = await getFilteredTeachers({ 
      name,
      city, 
      subjects, 
      institutionType: institutionTypes,
      maxHourlyRate, 
      minHourlyRate, 
      teachingMode 
    });

    res.status(200).json({
      success: true,
      data: filteredData,
      count: Object.keys(filteredData).length
    });
  } catch (error) {
    console.error('Error searching professional teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search professional teachers',
      error: error.message
    });
  }
};

const searchPersonalMentorsByName = async (req, res) => {
  try {
    const { name, city, subjects, maxHourlyRate, minHourlyRate, teachingMode } = req.query;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name query parameter is required'
      });
    }

    const personalType = 'Personal Mentor';
    const institutionType = personalType;

    const filteredData = await getFilteredTeachers({ 
      name,
      city, 
      subjects, 
      institutionType,
      maxHourlyRate, 
      minHourlyRate, 
      teachingMode 
    });

    res.status(200).json({
      success: true,
      data: filteredData,
      count: Object.keys(filteredData).length
    });
  } catch (error) {
    console.error('Error searching personal mentors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search personal mentors',
      error: error.message
    });
  }
};
const addProfessionalReview = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { text, rating, author } = req.body;

    // Check if teacher exists and is professional
    const teacherRef = db.ref(`teachers/${teacherId}`);
    const teacherSnapshot = await teacherRef.once('value');
    const teacher = teacherSnapshot.val();
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    const professionalTypes = ['school', 'college', 'pu college', 'coaching institute'];
    if (!professionalTypes.includes(teacher.institutionType?.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Teacher is not a professional teacher' });
    }

    // Create review instance
    const reviewData = new ReviewModel({
      text,
      rating: parseInt(rating),
      entityId: teacherId,
      entityType: 'professional_teacher',
      author: author || 'Anonymous' // Fallback to 'Anonymous' if not provided
    });

    // Validate review data
    const validationErrors = reviewData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    // Generate a unique ID for the review
    const reviewRef = db.ref(`reviews/professional/${teacherId}`).push();
    const reviewId = reviewRef.key;

    // Save review to Firebase
    await reviewRef.set({
      id: reviewId,
      ...reviewData
    });

    // Update teacher's average rating and review count
    const reviewsSnapshot = await db.ref(`reviews/professional/${teacherId}`).once('value');
    const reviews = reviewsSnapshot.val() || {};
    const reviewList = Object.values(reviews);
    const avgRating = reviewList.length
      ? reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length
      : 0;

    await teacherRef.update({
      rating: avgRating.toFixed(1),
      reviewCount: reviewList.length,
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { id: reviewId, ...reviewData }
    });
  } catch (error) {
    console.error('Error adding professional review:', error);
    res.status(500).json({ success: false, message: 'Failed to add review', error: error.message });
  }
};

// Add a review for a personal mentor
const addPersonalReview = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { text, rating, author } = req.body;

    // Check if teacher exists and is personal mentor
    const teacherRef = db.ref(`teachers/${teacherId}`);
    const teacherSnapshot = await teacherRef.once('value');
    const teacher = teacherSnapshot.val();
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Mentor not found' });
    }
    if (teacher.institutionType?.toLowerCase() !== 'personal mentor') {
      return res.status(400).json({ success: false, message: 'Teacher is not a personal mentor' });
    }

    // Create review instance
    const reviewData = new ReviewModel({
      text,
      rating: parseInt(rating),
      entityId: teacherId,
      entityType: 'personal_mentor',
      author: author || 'Anonymous' // Fallback to 'Anonymous' if not provided
    });

    // Validate review data
    const validationErrors = reviewData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    // Generate a unique ID for the review
    const reviewRef = db.ref(`reviews/personal/${teacherId}`).push();
    const reviewId = reviewRef.key;

    // Save review to Firebase
    await reviewRef.set({
      id: reviewId,
      ...reviewData
    });

    // Update mentor's average rating and review count
    const reviewsSnapshot = await db.ref(`reviews/personal/${teacherId}`).once('value');
    const reviews = reviewsSnapshot.val() || {};
    const reviewList = Object.values(reviews);
    const avgRating = reviewList.length
      ? reviewList.reduce((sum, review) => sum + review.rating, 0) / reviewList.length
      : 0;

    await teacherRef.update({
      rating: avgRating.toFixed(1),
      reviewCount: reviewList.length,
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { id: reviewId, ...reviewData }
    });
  } catch (error) {
    console.error('Error adding personal review:', error);
    res.status(500).json({ success: false, message: 'Failed to add review', error: error.message });
  }
};

// Get reviews for a professional teacher
const getProfessionalReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const reviewsRef = db.ref(`reviews/professional/${teacherId}`);
    const snapshot = await reviewsRef.once('value');
    const reviews = snapshot.val() || {};

    res.status(200).json({
      success: true,
      data: Object.values(reviews),
      count: Object.keys(reviews).length
    });
  } catch (error) {
    console.error('Error fetching professional reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

// Get reviews for a personal mentor
const getPersonalReviews = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const reviewsRef = db.ref(`reviews/personal/${teacherId}`);
    const snapshot = await reviewsRef.once('value');
    const reviews = snapshot.val() || {};

    res.status(200).json({
      success: true,
      data: Object.values(reviews),
      count: Object.keys(reviews).length
    });
  } catch (error) {
    console.error('Error fetching personal reviews:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
  }
};

// Like a professional review
const likeProfessionalReview = async (req, res) => {
  try {
    const { teacherId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/professional/${teacherId}/${reviewId}`);
    const snapshot = await reviewRef.once('value');
    const review = snapshot.val();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await reviewRef.update({
      likes: (review.likes || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Review liked successfully' });
  } catch (error) {
    console.error('Error liking professional review:', error);
    res.status(500).json({ success: false, message: 'Failed to like review', error: error.message });
  }
};

// Like a personal review
const likePersonalReview = async (req, res) => {
  try {
    const { teacherId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/personal/${teacherId}/${reviewId}`);
    const snapshot = await reviewRef.once('value');
    const review = snapshot.val();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await reviewRef.update({
      likes: (review.likes || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Review liked successfully' });
  } catch (error) {
    console.error('Error liking personal review:', error);
    res.status(500).json({ success: false, message: 'Failed to like review', error: error.message });
  }
};

// Dislike a professional review
const dislikeProfessionalReview = async (req, res) => {
  try {
    const { teacherId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/professional/${teacherId}/${reviewId}`);
    const snapshot = await reviewRef.once('value');
    const review = snapshot.val();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await reviewRef.update({
      dislikes: (review.dislikes || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Review disliked successfully' });
  } catch (error) {
    console.error('Error disliking professional review:', error);
    res.status(500).json({ success: false, message: 'Failed to dislike review', error: error.message });
  }
};

// Dislike a personal review
const dislikePersonalReview = async (req, res) => {
  try {
    const { teacherId, reviewId } = req.params;
    const reviewRef = db.ref(`reviews/personal/${teacherId}/${reviewId}`);
    const snapshot = await reviewRef.once('value');
    const review = snapshot.val();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await reviewRef.update({
      dislikes: (review.dislikes || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Review disliked successfully' });
  } catch (error) {
    console.error('Error disliking personal review:', error);
    res.status(500).json({ success: false, message: 'Failed to dislike review', error: error.message });
  }
};



module.exports = {
  addTeacher,
  getTeachers,
  getProfessionalTeachers,
  getPersonalMentors,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersWithFilters,
  getProfessionalTeacherDetails,
  getPersonalMentorDetails,
  searchProfessionalTeachersByName,
  searchPersonalMentorsByName,
  addProfessionalReview,
  addPersonalReview,
  getProfessionalReviews,
  getPersonalReviews,
  likeProfessionalReview,
  likePersonalReview,
  dislikeProfessionalReview,
  dislikePersonalReview


};