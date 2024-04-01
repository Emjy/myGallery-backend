var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });

//dependances pour upload cloudinary
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: 'dzeivdoia',
  api_key: process.env.API_CLOUDINARY,
  api_secret: process.env.API_CLOUDINARY_SECRET
});

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
      idCloud: resultCloudinary.public_id,
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


// delete une affiche
router.post("/:id", async (req, res) => {
  try {
    const afficheId = req.params.id;
    // Trouver l'affiche dans la base de données
    const affiche = await Affiche.findById(afficheId);

    if (!affiche) {
      return res.status(404).json({ result: false, message: "Affiche not found" });
    }

    // Supprimer l'image de Cloudinary
    // const result = await cloudinary.uploader.destroy(affiche.idCloud);

    // Change 'sample' to any public ID of your choice

    await cloudinary.uploader.destroy(affiche.idCloud, function (result) { console.log(result) });


    if (result == 'ok') {
      // Supprimer l'affiche de la base de données MongoDB
      await Affiche.deleteOne({ _id: afficheId });
    } else {
      res.json({ result: false, message: "Document not found" });
    }


    res.json({ result: true, message: "Affiche deleted successfully" });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ result: false, error: error.message });
  }
});


module.exports = router;
