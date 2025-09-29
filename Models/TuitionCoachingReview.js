class ReviewModel {
  constructor(data) {
    this.text = data.text;
    this.rating = data.rating;
    this.entityId = data.entityId; // ID for tuition/coaching center
    this.entityType = data.entityType; // 'tuitionCoaching'
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

    if (!this.entityType || this.entityType !== 'tuitionCoaching') {
      errors.push('Entity type must be tuitionCoaching');
    }

    if (!this.author || this.author.trim() === '') {
      errors.push('Author is required');
    }

    return errors;
  }
}

module.exports = ReviewModel;