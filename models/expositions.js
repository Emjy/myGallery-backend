const mongoose = require('mongoose');

const expoSchema = mongoose.Schema({

    imageCouv: String,
    idCloud: String,
    expoName: String,
    adresse: String,
    auteur: String,
    startDate: Date,
    endDate: Date,
    description: String,
    creationDate: Date,
//Test

});

const Expo = mongoose.model('expositions', expoSchema);

module.exports = Expo;