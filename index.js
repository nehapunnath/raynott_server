// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const routes = require('./Routes/Routes');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use('/', routes);

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./Routes/Routes');

const app = express();

// CORS Configuration - UPDATED
const corsOptions = {
  origin: [
    'https://raynott-fe.vercel.app', // Your production frontend
    'http://localhost:3000',         // Your local development
    'http://localhost:3001'          // Alternative port
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware - UPDATED
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Routes
app.use('/', routes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});