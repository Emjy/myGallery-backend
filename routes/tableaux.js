var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });


//dependances pour upload cloudinary
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);

const Tableau = require("../models/tableaux");
 
// Affichage de tous les tableaux 

router.get("/", async (req, res) => {
  try {
    const tableaux = await Tableau.find();

    res.json({ result: true, tableaux });
  } catch (error) {
    res.json({ result: false, error });
  }
});

// Post a tableau

router.post("/", upload.single('file'), async (req, res) => {
    try {
      const resultCloudinary = await cloudinary.uploader.upload(req.file.path, {
        folder: "Tableaux",
      });
  
      const newTableau = new Tableau({
        imageName: resultCloudinary.secure_url,
        tableauName: req.body.tableauName,
        auteur: req.body.auteur,
        prix: req.body.prix,
        creationDate: new Date()
      });
  
      const tableau = await newTableau.save();
      await unlinkAsync(req.file.path); // Assurez-vous d'effacer le fichier temporaire
      res.json({ result: true, tableau });
  
    } catch (error) {
      console.error('An error occurred:', error);
      await unlinkAsync(req.file.path); // En cas d'erreur, effacez aussi le fichier
      res.status(500).json({ result: false, error: error.message });
    }
  });

module.exports = router;
