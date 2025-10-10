const { db } = require('../firebaseAdmin');
const SchoolModel = require('../Models/SchoolModel');
const CollegeModel = require('../Models/CollegeModel');
const PUCollegeModel = require('../Models/PuCollegeModel');
const TuitionCoachingModel = require('../Models/TuitionCoachingModel');
const TeacherModel = require('../Models/TeachersModel');

const getPendingRegistrations = async (req, res) => {
  try {
    const requestsRef = db.ref('registration_requests');
    const snapshot = await requestsRef.once('value');
    const allRequests = snapshot.val() || {};

    const pendingRequests = Object.values(allRequests).filter(request => request.status === 'pending');

    res.status(200).json({
      success: true,
      data: pendingRequests,
      count: pendingRequests.length
    });
  } catch (error) {
    console.error('Error fetching pending registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending registrations',
      error: error.message
    });
  }
};

const getAllRegistrations = async (req, res) => {
  try {
    const requestsRef = db.ref('registration_requests');
    const snapshot = await requestsRef.once('value');
    const requests = snapshot.val() || {};

    res.status(200).json({
      success: true,
      data: Object.values(requests),
      count: Object.keys(requests).length
    });
  } catch (error) {
    console.error('Error fetching all registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
};

const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const requestRef = db.ref(`registration_requests/${id}`);
    const snapshot = await requestRef.once('value');
    const request = snapshot.val();
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found'
      });
    }
    
    // Validate using specific model only if moving to public collection
    if (request.status !== 'approved') {
      let model;
      switch (request.institutionType) {
        case 'school':
          model = new SchoolModel(request);
          break;
        case 'college':
          model = new CollegeModel(request);
          break;
        case 'pu_college':
          model = new PUCollegeModel(request);
          break;
        case 'coaching':
          model = new TuitionCoachingModel(request);
          break;
        case 'teacher':
          model = new TeacherModel(request);
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid institution type' });
      }

      const validationErrors = model.validate();
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }
    }
    
    // Update status
    const updateData = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      adminNotes: adminNotes || null,
      updatedAt: new Date().toISOString()
    };
    
    await requestRef.update(updateData);
    
    // Move to public collection only if not already approved
    if (request.status !== 'approved') {
      await moveToPublicCollection(request);
    }
    
    res.status(200).json({
      success: true,
      message: 'Registration approved successfully',
      data: { ...request, ...updateData }
    });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
      error: error.message
    });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const requestRef = db.ref(`registration_requests/${id}`);
    const snapshot = await requestRef.once('value');
    const request = snapshot.val();
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found'
      });
    }
    
    const updateData = {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      adminNotes: adminNotes || null,
      updatedAt: new Date().toISOString()
    };
    
    await requestRef.update(updateData);
    
    res.status(200).json({
      success: true,
      message: 'Registration rejected successfully',
      data: { ...request, ...updateData }
    });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
      error: error.message
    });
  }
};

const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestRef = db.ref(`registration_requests/${id}`);
    const snapshot = await requestRef.once('value');
    const request = snapshot.val();
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration',
      error: error.message
    });
  }
};

const moveToPublicCollection = async (request) => {
  try {
    const publicData = { ...request };
    
    // Remove admin fields
    delete publicData.status;
    delete publicData.submittedAt;
    delete publicData.approvedAt;
    delete publicData.rejectedAt;
    delete publicData.adminNotes;
    
    // Add public fields
    publicData.isActive = true;
    publicData.listedAt = new Date().toISOString();
    publicData.updatedAt = new Date().toISOString();
    
    // Collection mapping
    let collectionName;
    switch (request.institutionType) {
      case 'school':
        collectionName = 'schools';
        break;
      case 'college':
        collectionName = 'colleges';
        break;
      case 'pu_college':
        collectionName = 'pucolleges';
        break;
      case 'coaching':
        collectionName = 'tuitioncoaching';
        break;
      case 'teacher':
        collectionName = 'teachers';
        break;
      default:
        collectionName = 'others';
    }
    
    const publicRef = db.ref(collectionName).push();
    const publicId = publicRef.key;
    
    publicData.id = publicId;
    
    await publicRef.set(publicData);
    
    console.log(`Moved to ${collectionName} as ${publicId}`);
  } catch (error) {
    console.error('Error moving to public collection:', error);
    throw error;
  }
};

module.exports = {
  getPendingRegistrations,
  getAllRegistrations,
  approveRegistration,
  rejectRegistration,
  getRegistrationById
};