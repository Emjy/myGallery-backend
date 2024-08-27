// Charger les variables d'environnement en premier
require('dotenv').config();

// Importations des modules nécessaires
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

// Configuration de la connexion à la base de données
const mongoose = require('mongoose');
require('./models/connection');

// Importation des routeurs
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var afficheRouter = require('./routes/affiches');
var posterRouter = require('./routes/posters');
var tableauxRouter = require('./routes/tableaux');
var photosRouter = require('./routes/photos');
var exposistionsRouter = require('./routes/expositions');


// Initialisation de l'application express
var app = express();

// Configuration de CORS pour autoriser des domaines spécifiques
const corsOptions = {
    origin: ['https://art-papa-frontend.vercel.app', 'http://localhost:3001', 'https://art-papa-backend.vercel.app', 'https://gallerie.françoisgiraud.fr', 'https://gallerie.xn--franoisgiraud-lgb.fr', , 'https://art.xn--franoisgiraud-lgb.fr'],
};
app.use(cors(corsOptions));

// Configuration des middlewares
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration des routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/affiches', afficheRouter);
app.use('/posters', posterRouter);
app.use('/tableaux', tableauxRouter);
app.use('/photos', photosRouter);
app.use('/expositions', exposistionsRouter);

// Lancement du serveur
app.listen(3000, () => console.log('Server running on port 3000'));

module.exports = app;
