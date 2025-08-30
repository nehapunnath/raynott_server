require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./Routes/Routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
