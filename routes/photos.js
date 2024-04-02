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
 
// Affichage de toutes les photos 

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
        idCloud: resultCloudinary.public_id,
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
  

// delete une photo
router.post("/:id", async (req, res) => {
  try {
    const photoId = req.params.id;
    // Trouver l'affiche dans la base de données
    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(404).json({ result: false, message: "Photo not found" });
    }

    const result = await cloudinary.uploader.destroy(photo.idCloud, { resource_type: 'image' })

    if (result.result == 'ok') {
      // Supprimer l'affiche de la base de données MongoDB
      await Photo.deleteOne({ _id: photoId });
    } else {
      return res.json({ result: false, message: "Photo not found" });
    }


    res.json({ result: true, message: "Photo deleted successfully" });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
