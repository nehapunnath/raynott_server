const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');
const Teacher = require('../Models/TeachersModel');

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

// Get all teachers with optional filtering
const getTeachersWithFilters = async (req, res) => {
  try {
    const { city, subjects, institutionType, maxHourlyRate, minHourlyRate, teachingMode } = req.query;

    const teachersRef = db.ref('teachers');
    const snapshot = await teachersRef.once('value');
    const teachers = snapshot.val();

    if (!teachers) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }

    // Filter teachers based on query parameters
    const filteredTeachers = Object.keys(teachers).reduce((result, key) => {
      const teacher = teachers[key];
      let include = true;

      // City filter
      if (city && teacher.city && teacher.city.toLowerCase() !== city.toLowerCase()) {
        include = false;
      }

      // Subjects filter
      if (subjects && teacher.subjects && !teacher.subjects.toLowerCase().includes(subjects.toLowerCase())) {
        include = false;
      }

      // Institution type filter
      if (institutionType && teacher.institutionType && teacher.institutionType.toLowerCase() !== institutionType.toLowerCase()) {
        include = false;
      }

      // Teaching mode filter
      if (teachingMode && teacher.teachingMode && teacher.teachingMode.toLowerCase() !== teachingMode.toLowerCase()) {
        include = false;
      }

      // Hourly rate range filter
      if (minHourlyRate && teacher.hourlyRate) {
        const rate = parseFloat(teacher.hourlyRate.replace(/[^0-9.-]+/g, '')); // Extract numeric value
        if (rate < parseFloat(minHourlyRate)) {
          include = false;
        }
      }

      if (maxHourlyRate && teacher.hourlyRate) {
        const rate = parseFloat(teacher.hourlyRate.replace(/[^0-9.-]+/g, '')); // Extract numeric value
        if (rate > parseFloat(maxHourlyRate)) {
          include = false;
        }
      }

      if (include) {
        result[key] = teacher;
      }

      return result;
    }, {});

    res.status(200).json({
      success: true,
      data: filteredTeachers,
      count: Object.keys(filteredTeachers).length
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

module.exports = {
  addTeacher,
  getTeachers,
  getTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachersWithFilters
};