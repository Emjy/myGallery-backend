var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });

//dependances pour upload cloudinary
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);

const Photo = require("../models/photos");
 
// Affichage de tous les tableaux 

router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find();

    res.json({ result: true, photos });
  } catch (error) {
    res.json({ result: false, error });
  }
});


// Recupération d'une photo

router.get("/:id", async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);

    if (!photo) {
      res.json({ result: false, message: "photo not found" });
      return;
    } else {
      res.json({ result: true, photo });
    }

  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

// Post a photo

router.post("/", upload.single('file'), async (req, res) => {
    try {
      const resultCloudinary = await cloudinary.uploader.upload(req.file.path, {
        folder: "Photos",
      });
  
      const newPhoto = new Photo({
        imageName: resultCloudinary.secure_url,
        photoName: req.body.photoName,
        auteur: req.body.auteur,
        prix: req.body.prix,
        description: req.body.description, 
        creationDate: new Date()
      });
  
      const photo = await newPhoto.save();
      await unlinkAsync(req.file.path); // Assurez-vous d'effacer le fichier temporaire
      res.json({ result: true, photo });
  
    } catch (error) {
      console.error('An error occurred:', error);
      await unlinkAsync(req.file.path); // En cas d'erreur, effacez aussi le fichier
      res.status(500).json({ result: false, error: error.message });
    }
  });

module.exports = router;
