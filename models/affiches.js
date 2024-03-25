const mongoose = require('mongoose');

const afficheSchema = mongoose.Schema({

    imageName: String,
    filmName: String,
    realName: String,

});

const Affiche = mongoose.model('affiches', afficheSchema);

module.exports = Affiche;