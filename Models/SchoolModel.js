class SchoolModel {
  constructor(data) {
    this.name = data.name;
    this.typeOfSchool = data.typeOfSchool;
    this.affiliation = data.affiliation;
    this.affiliationNumber = data.affiliationNumber || '';
    this.grade = data.grade;
    this.ageForAdmission = data.ageForAdmission;
    this.language = data.language;
    this.establishmentYear = data.establishmentYear;
    this.facilities = data.facilities || [];
    this.totalAnnualFee = data.totalAnnualFee;
    this.admissionFee = data.admissionFee;
    this.tuitionFee = data.tuitionFee;
    this.transportFee = data.transportFee;
    this.booksUniformsFee = data.booksUniformsFee;
    this.address = data.address;
    this.city = data.city;
    this.phone = data.phone;
    this.email = data.email;
    this.website = data.website;
    this.socialMedia = data.socialMedia || {};
    this.googleMapsEmbedUrl = data.googleMapsEmbedUrl;
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
    this.admissionLink = data.admissionLink;
    this.admissionProcess = data.admissionProcess;
    this.schoolImage = data.schoolImage || '';
    this.photos = data.photos || [];
    // this.rating = data.rating || 0; 
    // this.reviewCount = data.reviewCount || 0;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const requiredFields = ['name', 'typeOfSchool', 'affiliation', 'address', 'city'];
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!this[field]) {
        errors.push(`${field} is required`);
      }
    });
    
    // if (this.rating && (this.rating < 0 || this.rating > 5)) {
    //   errors.push('Rating must be between 0 and 5');
    // }

    // if (this.reviewCount && this.reviewCount < 0) {
    //   errors.push('Review count cannot be negative');
    // }
    
    return errors;
  }
}

module.exports = SchoolModel;