const mongoose = require('mongoose');

const tableauSchema = mongoose.Schema({

    imageName: String,
    tableauName: String,
    auteur: String,
    prix: Number, 
    creationDate: Date,
    
});

const Tableau = mongoose.model('tableaux', tableauSchema);

module.exports = Tableau;