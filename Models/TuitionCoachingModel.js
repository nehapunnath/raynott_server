class TuitionCoachingModel {
  constructor(data) {
    this.name = data.name;
    this.typeOfCoaching = data.typeOfCoaching;
    this.classes = data.classes;
    this.subjects = data.subjects;
    this.batchSize = data.batchSize;
    this.classDuration = data.classDuration;
    this.language = data.language;
    this.establishmentYear = data.establishmentYear;
    this.faculty = data.faculty;
    this.studyMaterial = data.studyMaterial;
    this.tests = data.tests;
    this.doubtSessions = data.doubtSessions;
    this.infrastructure = data.infrastructure;
    this.demoClass = data.demoClass;
    this.flexibleTimings = data.flexibleTimings;
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
    this.classrooms = data.classrooms;
    this.laboratories = data.laboratories;
    this.library = data.library;
    this.smartBoards = data.smartBoards;
    this.cctv = data.cctv;
    this.medicalRoom = data.medicalRoom;
    this.wifi = data.wifi;
    this.admissionLink = data.admissionLink;
    this.admissionProcess = data.admissionProcess;
    this.centerImage = data.centerImage || '';
    this.photos = data.photos || [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const requiredFields = ['name', 'typeOfCoaching', 'address', 'city'];
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!this[field]) {
        errors.push(`${field} is required`);
      }
    });
    
    return errors;
  }
}

module.exports = TuitionCoachingModel;