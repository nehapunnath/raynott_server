class ReviewModel {
  constructor(data) {
    this.text = data.text;
    this.rating = data.rating;
    this.entityId = data.entityId;
    this.entityType = data.entityType; 
    this.author = data.author;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
    this.likes = data.likes || 0;
    this.dislikes = data.dislikes || 0;
  }

  validate() {
    const errors = [];

    if (!this.text || this.text.trim() === '') {
      errors.push('Review text is required');
    }

    if (!this.rating || this.rating < 1 || this.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    if (!this.entityId) {
      errors.push('Entity ID is required');
    }

    if (!this.entityType || !['professional_teacher', 'personal_mentor'].includes(this.entityType)) {
      errors.push('Entity type must be professional_teacher or personal_mentor');
    }

    if (!this.author || this.author.trim() === '') {
      errors.push('Author is required');
    }

    return errors;
  }
}

module.exports = ReviewModel;