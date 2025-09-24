class TeacherModel {
  constructor(data) {
    this.name = data.name || '';
    this.institutionType = data.institutionType || '';
    this.subjects = data.subjects || '';
    this.qualification = data.qualification || '';
    this.experience = data.experience || '';
    this.teachingMode = data.teachingMode || '';
    this.languages = data.languages || '';
    this.specialization = data.specialization || '';
    this.certifications = data.certifications || '';
    this.about = data.about || '';
    this.availability = data.availability || '';
    this.hourlyRate = data.hourlyRate || '';
    this.monthlyPackage = data.monthlyPackage || '';
    this.examPreparation = data.examPreparation || '';
    this.demoFee = data.demoFee || '';
    this.teachingApproach = data.teachingApproach || '';
    this.studyMaterials = data.studyMaterials || '';
    this.sessionDuration = data.sessionDuration || '';
    this.studentLevel = data.studentLevel || '';
    this.classSize = data.classSize || '';
    this.onlinePlatform = data.onlinePlatform || '';
    this.progressReports = data.progressReports || '';
    this.performanceTracking = data.performanceTracking || '';
    this.address = data.address || '';
    this.city = data.city || '';
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.website = data.website || '';
    this.socialMedia = data.socialMedia || {};
    this.googleMapsEmbedUrl = data.googleMapsEmbedUrl || '';
    this.teachingProcess = data.teachingProcess || '';
    this.profileImage = data.profileImage || '';
    this.facilities = data.facilities || [];
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validate() {
    const requiredFields = ['name', 'institutionType', 'subjects', 'city'];
    const errors = [];

    requiredFields.forEach(field => {
      if (!this[field]) {
        errors.push(`${field} is required`);
      }
    });

    return errors;
  }
}

module.exports = TeacherModel;