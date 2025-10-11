const { db } = require('../firebaseAdmin');
const DemoBookingModel = require('../Models/BookaDemoModel');

const bookDemo = async (req, res) => {
  try {
    console.log('Request body:', req.body);

    // Create booking instance
    const bookingData = new DemoBookingModel(req.body);

    // Validate booking data
    const validationErrors = bookingData.validate();
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Store booking in Firebase
    const bookingRef = db.ref('demoBookings').push();
    const bookingId = bookingRef.key;

    const bookingPayload = {
      id: bookingId,
      ...bookingData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await bookingRef.set(bookingPayload);

    res.status(201).json({
      success: true,
      message: 'Demo booked successfully',
      data: bookingPayload
    });
  } catch (error) {
    console.error('Error booking demo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book demo',
      error: error.message
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const { date } = req.query;
    const bookingsRef = db.ref('demoBookings');
    const snapshot = await bookingsRef.once('value');
    let bookings = snapshot.val() || {};

    // Convert to array
    bookings = Object.values(bookings);

    // Apply date filter
    if (date) {
      const filterDate = new Date(date).toISOString().split('T')[0];
      bookings = bookings.filter(booking => booking.date.startsWith(filterDate));
    }

    // Sort by createdAt (newest first)
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

module.exports = { bookDemo, getBookings };