const mongoose = require('mongoose');

const posterSchema = mongoose.Schema({

    imageName: String,
    idCloud: String,
    posterName: String,
    creationDate: Date,

});

const Poster = mongoose.model('posters', posterSchema);

module.exports = Poster;