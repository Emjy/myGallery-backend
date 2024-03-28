const mongoose = require('mongoose');

const photoSchema = mongoose.Schema({

    imageName: String,
    photoName: String,
    auteur: String,
    prix: Number, 
    description: String,
    creationDate: Date,
    
});

const Photo = mongoose.model('photos', photoSchema);

module.exports = Photo;