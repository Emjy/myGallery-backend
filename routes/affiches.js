var express = require("express");
var router = express.Router();
const Airtable = require('airtable');

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

    // Convertir l'image en base64
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');

    // Construction du corps de la requête
    const requestBody = {
      fields: {
        Name: req.body.filmName,
        Image: {
          filename: req.body.filmName,
          content: base64Image
        }
      }
    };

    // Envoi de la requête POST à l'API Airtable
    const response = await fetch('https://api.airtable.com/v0/appDkyKj8S89iXd0H/affiches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer patk2i01FftZcO5Yk.49a9294f61bcb729923f2e1f9072721ed3a2101010bc39fdc3c3a3571ae2fbae'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(response)
    const responseData = await response.json();


    // Vérification de la réponse de l'API Airtable
    if (response.ok) {
      res.status(200).json({ result: true, message: 'Image stockée avec succès dans Airtable.', data: responseData });
    } else {
      res.status(400).json({ result: false, message: 'Erreur lors du stockage de l\'image dans Airtable.', error: responseData });
    }

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
