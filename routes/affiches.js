var express = require("express");
var router = express.Router();

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
    // Récupérer le jeton d'accès (bearer token)
    const accessToken = 'AIzaSyB1Q2xC0qYpWLqh4_D8vYQl1oiV4QtlKbk'; // Remplacez cela par votre propre jeton

    // Construction de l'URL pour l'API de Google Drive
    const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media';
 
    // Création d'un objet FormData et ajout du fichier
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    // Envoi de la requête POST à l'API de Google Drive avec FormData
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders() // Inclure les en-têtes du formulaire
      },
      body: formData
    });

    // Vérification de la réponse de l'API Google Drive
    if (response.ok) {
      // Si la requête est réussie, vous pouvez traiter la réponse comme nécessaire
      const data = await response.json();
      res.status(200).json({ result: true, message: 'Image stockée avec succès dans Google Drive.', data: data });
    } else {
      // Si la requête a échoué, vous pouvez gérer l'erreur en conséquence
      const errorData = await response.json();
      res.status(400).json({ result: false, message: 'Erreur lors du stockage de l\'image dans Google Drive.', error: errorData });
    }

    // Assurez-vous d'effacer le fichier temporaire après l'envoi
    await unlinkAsync(req.file.path);

  } catch (error) {
    // En cas d'erreur, renvoyez une réponse avec le statut d'erreur et le message d'erreur
    console.error('An error occurred:', error);
    await unlinkAsync(req.file.path);
    res.status(500).json({ result: false, error: error.message });
  }

  // try {

  //   const resultCloudinary = await cloudinary.uploader.upload(req.file.path, {
  //     folder: "Affiches",
  //   });

  //   const newAffiche = new Affiche({
  //     imageName: resultCloudinary.secure_url,
  //     idCloud: resultCloudinary.public_id,
  //     filmName: req.body.filmName,
  //     realName: req.body.realName,
  //     creationDate: new Date()
  //   });

  //   const affiche = await newAffiche.save();
  //   await unlinkAsync(req.file.path); // Assurez-vous d'effacer le fichier temporaire
  //   res.json({ result: true, affiche });

  // } catch (error) {
  //   console.error('An error occurred:', error);
  //   await unlinkAsync(req.file.path); // En cas d'erreur, effacez aussi le fichier
  //   res.status(500).json({ result: false, error: error.message });
  // }
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
