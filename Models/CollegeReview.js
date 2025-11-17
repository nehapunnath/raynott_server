class ReviewModel {
  constructor(data) {
    this.text = data.text;
    this.rating = data.rating;
    this.collegeId = data.collegeId; // Use collegeId for colleges
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

    if (!this.collegeId) {
      errors.push('College ID is required');
    }

    if (!this.author || this.author.trim() === '') {
      errors.push('Author is required');
    }

    return errors;
  }
}

module.exports = ReviewModel;




