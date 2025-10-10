class CollegeModel {
  constructor(data) {
    this.name = data.name;
    this.typeOfCollege = data.typeOfCollege;
    this.affiliation = data.affiliation;
    this.affiliationNumber = data.affiliationNumber || '';
    this.accreditation = data.accreditation;
    this.coursesOffered = data.coursesOffered || [];
    this.duration = data.duration;
    this.eligibilityCriteria = data.eligibilityCriteria;
    this.entranceExams = data.entranceExams || [];
    this.language = data.language;
    this.establishmentYear = data.establishmentYear;
    this.facilities = data.facilities || [];
    this.totalAnnualFee = data.totalAnnualFee;
    this.admissionFee = data.admissionFee;
    this.tuitionFee = data.tuitionFee;
    this.hostelFee = data.hostelFee;
    this.libraryFee = data.libraryFee;
    this.laboratoryFee = data.laboratoryFee;
    this.otherFees = data.otherFees;
    this.address = data.address;
    this.city = data.city; 
    this.state = data.state;
    this.pincode = data.pincode;
    this.phone = data.phone;
    this.email = data.email;
    this.website = data.website;
    this.socialMedia = data.socialMedia || {};
    this.googleMapsEmbedUrl = data.googleMapsEmbedUrl;
    this.campusSize = data.campusSize;
    this.classrooms = data.classrooms;
    this.laboratories = data.laboratories;
    this.library = data.library;
    this.hostel = data.hostel;
    this.playground = data.playground;
    this.auditorium = data.auditorium;
    this.smartBoards = data.smartBoards;
    this.cctv = data.cctv;
    this.medicalRoom = data.medicalRoom;
    this.wifi = data.wifi;
    this.admissionLink = data.admissionLink;
    this.admissionProcess = data.admissionProcess;
    this.placementStatistics = data.placementStatistics || {};
    this.topRecruiters = data.topRecruiters || [];
    this.collegeImage = data.collegeImage || '';
    this.photos = data.photos || [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const requiredFields = ['name', 'typeOfCollege', 'affiliation', 'address', 'city', 'state'];
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!this[field]) {
        errors.push(`${field} is required`);
      }
    });
    
    return errors;
  }
}

module.exports = CollegeModel;