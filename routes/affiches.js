var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


//dependances pour upload cloudinary
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);

const Affiche = require("../models/affiches");



// Affichage de toutes les affcihes 

router.get("/", async (req, res) => {
  try {
    const affiches = await Affiche.find();

    res.json({ result: true, affiches });
  } catch (error) {
    res.json({ result: false, error });
  }
});

// Post an affiche

router.post("/", upload.single('file'), async (req, res) => {
    try {
      const resultCloudinary = await cloudinary.uploader.upload(req.file.path, {
        folder: "Affiches",
      });
  
      const newAffiche = new Affiche({
        imageName: resultCloudinary.secure_url,
        filmName: req.body.filmName,
        realName: req.body.realName,
        creationDate: new Date()
      });
  
      const affiche = await newAffiche.save();
      await unlinkAsync(req.file.path); // Assurez-vous d'effacer le fichier temporaire
      res.json({ result: true, affiche });
  
    } catch (error) {
      console.error('An error occurred:', error);
      await unlinkAsync(req.file.path); // En cas d'erreur, effacez aussi le fichier
      res.status(500).json({ result: false, error: error.message });
    }
  });

module.exports = router;