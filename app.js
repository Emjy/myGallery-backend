require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const mongoose = require('mongoose');
require('./models/connection');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var afficheRouter = require('./routes/affiches');
var tableauxRouter = require('./routes/tableaux');
var photosRouter = require('./routes/photos');



var app = express();

const cors = require('cors');
app.use(cors());

// Autoriser des domaines spécifiques
const corsOptions = {
    origin: ['https://art-papa-frontend.vercel.app', 'http://localhost:3001'],
};

app.use(cors(corsOptions));

app.listen(3000, () => console.log('Server running on port 3000'));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/affiches', afficheRouter)
app.use('/tableaux', tableauxRouter)
app.use('/photos', photosRouter)


module.exports = app;
