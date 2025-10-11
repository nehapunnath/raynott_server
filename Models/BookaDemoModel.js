class DemoBookingModel {
  constructor(data) {
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.date = data.date; // ISO string (e.g., "2025-10-12T00:00:00.000Z")
    this.time = data.time; // HH:mm format
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  validate() {
    const errors = [];
    const requiredFields = ['name', 'phone', 'email', 'date', 'time'];

    // Check for required fields
    requiredFields.forEach(field => {
      if (!this[field]) {
        errors.push(`${field} is required`);
      }
    });

    // Validate phone number (10-digit Indian mobile number)
    const phoneRegex = /^[0-9]{10}$/;
    if (this.phone && !phoneRegex.test(this.phone)) {
      errors.push('Phone number must be a 10-digit number');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      errors.push('Invalid email format');
    }

    // Validate date (must be today or future)
    if (this.date) {
      const bookingDate = new Date(this.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (bookingDate < today) {
        errors.push('Booking date must be today or in the future');
      }
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (this.time && !timeRegex.test(this.time)) {
      errors.push('Time must be in HH:mm format (24-hour)');
    }

    return errors;
  }
}

module.exports = DemoBookingModel;