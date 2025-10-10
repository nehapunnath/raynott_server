class RegistrationRequestModel {
  constructor(data) {
    this.institutionType = data.institutionType;
    this.status = 'pending'; // pending, approved, rejected
    this.submittedAt = new Date().toISOString();
    this.approvedAt = null;
    this.rejectedAt = null;
    this.rejectionReason = null;
    this.adminNotes = null;
    
    // Common Fields
    this.name = data.name;
    this.tagline = data.tagline;
    this.establishmentYear = data.establishmentYear;
    this.about = data.about;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.pincode = data.pincode;
    this.email = data.email;
    this.phone = data.phone;
    this.website = data.website;
    this.googleMapsEmbedUrl = data.googleMapsEmbedUrl;
    this.facilities = data.facilities || [];
    
    // Institution Specific Fields
    if (data.institutionType === 'school') {
      this.typeOfSchool = data.typeOfSchool;
      this.affiliation = data.affiliation;
      this.grade = data.grade;
      this.ageForAdmission = data.ageForAdmission;
      this.language = data.language;
      this.studentStrength = data.studentStrength;
      this.teacherStrength = data.teacherStrength;
      this.studentTeacherRatio = data.studentTeacherRatio;
    } else if (data.institutionType === 'college') {
      this.typeOfCollege = data.typeOfCollege;
      this.universityAffiliation = data.universityAffiliation;
      this.coursesOffered = data.coursesOffered;
      this.duration = data.duration;
      this.accreditation = data.accreditation;
      this.placementStatistics = data.placementStatistics;
      this.departments = data.departments;
    } else if (data.institutionType === 'pu_college') {
      this.board = data.board;
      this.streams = data.streams;
      this.subjects = data.subjects;
      this.programDuration = data.programDuration;
      this.competitiveExamPrep = data.competitiveExamPrep;
    } else if (data.institutionType === 'coaching') {
      this.typeOfCoaching = data.typeOfCoaching;
      this.classes = data.classes;
      this.batchSize = data.batchSize;
      this.classDuration = data.classDuration;
      this.faculty = data.faculty;
      this.studyMaterial = data.studyMaterial;
      this.tests = data.tests;
      this.doubtSessions = data.doubtSessions;
      this.infrastructure = data.infrastructure;
      this.demoClass = data.demoClass;
      this.flexibleTimings = data.flexibleTimings;
    } else if (data.institutionType === 'teacher') {
      this.teacherName = data.teacherName;
      this.qualifications = data.qualifications;
      this.experience = data.experience;
      this.teachingMode = data.teachingMode;
      this.languages = data.languages;
      this.specialization = data.specialization;
      this.certifications = data.certifications;
      this.availability = data.availability;
      this.hourlyRate = data.hourlyRate;
      this.monthlyPackage = data.monthlyPackage;
      this.examPreparation = data.examPreparation;
      this.demoFee = data.demoFee;
      this.teachingApproach = data.teachingApproach;
      this.studyMaterials = data.studyMaterials;
      this.sessionDuration = data.sessionDuration;
      this.studentLevel = data.studentLevel;
      this.classSize = data.classSize;
      this.onlinePlatform = data.onlinePlatform;
      this.progressReports = data.progressReports;
      this.performanceTracking = data.performanceTracking;
      this.teachingProcess = data.teachingProcess;
    }
    
    // Fee Structure
    this.totalAnnualFee = data.totalAnnualFee;
    this.admissionFee = data.admissionFee;
    this.tuitionFee = data.tuitionFee;
    this.transportFee = data.transportFee;
    this.booksUniformsFee = data.booksUniformsFee;
    
    // Contact Information
    this.principalName = data.principalName;
    this.contactPerson = data.contactPerson;
    this.alternatePhone = data.alternatePhone;
    this.officeHours = data.officeHours;
    
    // Social Media
    this.socialMedia = data.socialMedia || {};
    
    // Infrastructure
    this.campusSize = data.campusSize;
    this.classrooms = data.classrooms;
    this.laboratories = data.laboratories;
    this.library = data.library;
    this.playground = data.playground;
    this.auditorium = data.auditorium;
    this.smartBoards = data.smartBoards;
    this.cctv = data.cctv;
    this.medicalRoom = data.medicalRoom;
    this.wifi = data.wifi;
    this.hostel = data.hostel;
    this.sports = data.sports;
    
    // Admission Details
    this.admissionLink = data.admissionLink;
    this.admissionProcess = data.admissionProcess;
    
    // Document URLs (will be set after upload)
    this.registrationCertificate = data.registrationCertificate || '';
    this.affiliationCertificate = data.affiliationCertificate || '';
    this.qualificationCertificates = data.qualificationCertificates || [];
    this.idProof = data.idProof || '';
    this.profileImage = data.profileImage || '';
    this.photos = data.photos || [];
    this.otherDocuments = data.otherDocuments || [];
  }

  validate() {
    const errors = [];
    
    // Common required fields
    const commonRequired = ['institutionType', 'name', 'email', 'phone', 'address', 'city'];
    
    commonRequired.forEach(field => {
      if (!this[field]) {
        errors.push(`${field} is required`);
      }
    });
    
    // Institution type specific validation
    if (this.institutionType === 'school') {
      const schoolRequired = ['typeOfSchool', 'affiliation', 'grade'];
      schoolRequired.forEach(field => {
        if (!this[field]) {
          errors.push(`${field} is required for schools`);
        }
      });
    } else if (this.institutionType === 'college') {
      const collegeRequired = ['typeOfCollege', 'universityAffiliation', 'coursesOffered'];
      collegeRequired.forEach(field => {
        if (!this[field]) {
          errors.push(`${field} is required for colleges`);
        }
      });
    } else if (this.institutionType === 'pu_college') {
      const puRequired = ['board', 'streams', 'subjects'];
      puRequired.forEach(field => {
        if (!this[field]) {
          errors.push(`${field} is required for PU colleges`);
        }
      });
    } else if (this.institutionType === 'coaching') {
      const coachingRequired = ['typeOfCoaching', 'classes', 'subjects'];
      coachingRequired.forEach(field => {
        if (!this[field]) {
          errors.push(`${field} is required for coaching centers`);
        }
      });
    } else if (this.institutionType === 'teacher') {
      const teacherRequired = ['teacherName', 'qualifications', 'experience', 'specialization'];
      teacherRequired.forEach(field => {
        if (!this[field]) {
          errors.push(`${field} is required for teachers`);
        }
      });
    }
    
    return errors;
  }
}

module.exports = RegistrationRequestModel;