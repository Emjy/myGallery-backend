require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// Initialise SQLite (crée les tables si besoin)
require('./db');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const afficheRouter = require('./routes/affiches');
const posterRouter = require('./routes/posters');
const tableauxRouter = require('./routes/tableaux');
const photosRouter = require('./routes/photos');
const expositionsRouter = require('./routes/expositions');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001').split(',');
app.use(cors({ origin: allowedOrigins }));

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/affiches', afficheRouter);
app.use('/posters', posterRouter);
app.use('/tableaux', tableauxRouter);
app.use('/photos', photosRouter);
app.use('/expositions', expositionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
