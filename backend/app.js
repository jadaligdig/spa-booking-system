require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);                                              // the REST API
app.use(express.static(path.join(__dirname, '..', 'frontend')));       // the separate frontend (HTML/JS)

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`SPA Booking running: http://localhost:${port}`));
