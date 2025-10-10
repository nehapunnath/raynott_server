const { db } = require('../firebaseAdmin');
const { uploadToFirebase } = require('../Middleware/uploadMiddleware');

const submitRegistration = async (req, res) => {
  try {
    const { institutionType } = req.body;
    if (!institutionType) {
      return res.status(400).json({ success: false, message: 'institutionType is required' });
    }

    // Parse JSON fields if sent as strings (from frontend JSON.stringify)
    const parsedData = {
      ...req.body,
      facilities: req.body.facilities ? JSON.parse(req.body.facilities) : [],
      socialMedia: req.body.socialMedia ? JSON.parse(req.body.socialMedia) : {},
      streams: req.body.streams ? JSON.parse(req.body.streams) : [],
      subjects: req.body.subjects ? JSON.parse(req.body.subjects) : [],
      coursesOffered: req.body.coursesOffered ? JSON.parse(req.body.coursesOffered) : [],
      entranceExams: req.body.entranceExams ? JSON.parse(req.body.entranceExams) : [],
      topRecruiters: req.body.topRecruiters ? JSON.parse(req.body.topRecruiters) : [],
    //   placementStatistics: req.body.placementStatistics ? JSON.parse(req.body.placementStatistics) : {},
      placementStatistics: req.body.placementStatistics,
      languages: req.body.languages ? JSON.parse(req.body.languages) : [],
    };

    // Handle file uploads (no validation here - raw save)
    const fileUrls = {};

    if (req.files.photos && req.files.photos.length > 0) {
      const photoUploads = req.files.photos.map(file =>
        uploadToFirebase(file, `${institutionType}s/gallery`).catch(() => null)
      );
      fileUrls.photos = (await Promise.all(photoUploads)).filter(url => url !== null);
    } else {
      fileUrls.photos = [];
    }

    if (req.files.otherDocuments && req.files.otherDocuments.length > 0) {
      const docUploads = req.files.otherDocuments.map(file =>
        uploadToFirebase(file, `${institutionType}s/documents`).catch(() => null)
      );
      fileUrls.otherDocuments = (await Promise.all(docUploads)).filter(url => url !== null);
    } else {
      fileUrls.otherDocuments = [];
    }

    if (['school', 'college', 'pu_college', 'coaching'].includes(institutionType)) {
      if (req.files.registrationCertificate && req.files.registrationCertificate[0]) {
        fileUrls.registrationCertificate = await uploadToFirebase(req.files.registrationCertificate[0], `${institutionType}s/documents`).catch(() => '');
      }
      // Removed affiliationCertificate handling as it's now a text field (affiliationNumber)
    } else if (institutionType === 'teacher') {
      if (req.files.profileImage && req.files.profileImage[0]) {
        fileUrls.profileImage = await uploadToFirebase(req.files.profileImage[0], 'teachers/profiles').catch(() => '');
      }
      if (req.files.idProof && req.files.idProof[0]) {
        fileUrls.idProof = await uploadToFirebase(req.files.idProof[0], 'teachers/documents').catch(() => '');
      }
      if (req.files.qualificationCertificates && req.files.qualificationCertificates.length > 0) {
        const certUploads = req.files.qualificationCertificates.map(file =>
          uploadToFirebase(file, 'teachers/certificates').catch(() => null)
        );
        fileUrls.qualificationCertificates = (await Promise.all(certUploads)).filter(url => url !== null);
      } else {
        fileUrls.qualificationCertificates = [];
      }
    }

    // Merge file URLs with parsed data (affiliationNumber is included in parsedData)
    const submissionData = { ...parsedData, ...fileUrls };

    // Save raw to registration_requests
    const requestRef = db.ref('registration_requests').push();
    const requestId = requestRef.key;

    await requestRef.set({
      id: requestId,
      ...submissionData,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. It will be reviewed by admin.',
      id: requestId,
    });
  } catch (error) {
    console.error('Error submitting registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit registration',
      error: error.message,
    });
  }
};

const getRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const requestRef = db.ref(`registration_requests/${id}`);
    const snapshot = await requestRef.once('value');
    const request = snapshot.val();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Registration request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: request.id,
        institutionType: request.institutionType,
        status: request.status,
        submittedAt: request.submittedAt,
        approvedAt: request.approvedAt,
        rejectedAt: request.rejectedAt,
        rejectionReason: request.rejectionReason,
      },
    });
  } catch (error) {
    console.error('Error fetching registration status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registration status',
      error: error.message,
    });
  }
};

module.exports = {
  submitRegistration,
  getRegistrationStatus,
};