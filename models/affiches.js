const mongoose = require('mongoose');

const afficheSchema = mongoose.Schema({

    imageName: String,
    idCloud: String,
    filmName: String,
    realName: String,
    creationDate: Date,

});

const Affiche = mongoose.model('affiches', afficheSchema);

module.exports = Affiche;