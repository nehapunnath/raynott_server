class PUCollegeModel {
  constructor(data) {
    this.name = data.name;
    this.typeOfCollege = data.typeOfCollege;
    this.board = data.board;
    this.streams = data.streams || [];
    this.subjects = data.subjects || [];
    this.programDuration = data.programDuration;
    this.language = data.language;
    this.establishmentYear = data.establishmentYear;
    this.accreditation = data.accreditation;
    this.studentTeacherRatio = data.studentTeacherRatio;
    this.competitiveExamPrep = data.competitiveExamPrep;
    this.totalAnnualFee = data.totalAnnualFee;
    this.admissionFee = data.admissionFee;
    this.tuitionFee = data.tuitionFee;
    this.transportFee = data.transportFee;
    this.booksUniformsFee = data.booksUniformsFee;
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
    this.collegeImage = data.collegeImage || '';
    this.photos = data.photos || [];
    this.facilities = data.facilities || [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const requiredFields = ['name', 'typeOfCollege', 'board', 'address', 'city', 'state'];
    const errors = [];

    requiredFields.forEach(field => {
      if (!this[field]) {
        errors.push(`${field} is required`);
      }
    });

    return errors;
  }
}

module.exports = PUCollegeModel;