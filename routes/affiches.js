var express = require("express");
var router = express.Router();
const axios = require('axios');


const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });

const FormData = require('form-data');

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
    // URL de l'endpoint ImgBB pour télécharger une image
    const uploadUrl = "https://api.imgbb.com/1/upload";

    // Remplacez 'YOUR_API_KEY' par votre clé API ImgBB
    const apiKey = '08031bcaa1a14c2050baadf36c10d07d';

    // Chemin vers l'image que vous souhaitez télécharger
    const imagePath = req.file.path;

    // Lecture de l'image en tant que flux binaire
    const imageStream = fs.createReadStream(imagePath);

    // Création du payload de la requête POST
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', imageStream);

    // Envoi de la requête POST à ImgBB pour télécharger l'image
    const response = await axios.post(uploadUrl, formData, {
      headers: formData.getHeaders()
    });

    // Vérification de la réponse et récupération de l'URL de l'image téléchargée
    if (response.status === 200 && response.data.success) {
      const imageUrl = response.data.data.url;

    // Création d'une nouvelle Affiche avec les données de l'image téléchargée depuis ImgBB
      const newAffiche = new Affiche({
        imageName: imageUrl,
        // idCloud: response.data.public_id, // ImgBB ne fournit pas de public_id
        filmName: req.body.filmName,
        realName: req.body.realName,
        creationDate: new Date()
      });

      // Sauvegarde de la nouvelle Affiche dans la base de données
      const affiche = await newAffiche.save();

      // Suppression du fichier temporaire une fois qu'il a été téléchargé et enregistré
      await unlinkAsync(imagePath);

      // Réponse JSON avec le résultat et les données de l'affiche sauvegardée
      res.json({ result: true, affiche });
    } else {
      throw new Error('Failed to upload image to ImgBB');
    }
  } catch (error) {
    console.error('An error occurred:', error);
    await unlinkAsync(req.file.path); // Suppression du fichier temporaire en cas d'erreur
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

    const result = await cloudinary.uploader.destroy(affiche.idCloud, { resource_type: 'image' })

    if (result.result == 'ok') {
      // Supprimer l'affiche de la base de données MongoDB
      await Affiche.deleteOne({ _id: afficheId });
    } else {
      return res.json({ result: false, message: "Document not found" });
    }


    res.json({ result: true, message: "Affiche deleted successfully" });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ result: false, error: error.message });
  }
});


module.exports = router;
