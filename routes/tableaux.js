var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });

const FormData = require('form-data');
const axios = require('axios');

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


// Recupération d'un tableau

router.get("/:id", async (req, res) => {
  try {
    const tableau = await Tableau.findById(req.params.id);

    if (!tableau) {
      res.json({ result: false, message: "tableau not found" });
      return;
    } else {
      res.json({ result: true, tableau });
    }

  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

// Post a tableau

router.post("/", upload.single('file'), async (req, res) => {
  try {
      
      const apiKey = process.env.API_IMGBB;
      const imageStream = fs.createReadStream(req.file.path);

      // Création du payload de la requête POST
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('image', imageStream);

      // Envoi de la requête POST à ImgBB pour télécharger l'image
      const response = await axios.post("https://api.imgbb.com/1/upload", formData, {
        headers: formData.getHeaders()
      });

      if (response.data.success) {
  
      const newTableau = new Tableau({
        imageName: response.data.data.url,
        idCloud: response.data.data.id,
        tableauName: req.body.tableauName,
        auteur: req.body.auteur,
        prix: req.body.prix,
        description: req.body.description, 
        creationDate: new Date()
      });
  
      const tableau = await newTableau.save();
      await unlinkAsync(req.file.path); // Assurez-vous d'effacer le fichier temporaire
        res.json({ result: true, tableau });
      } else {
        throw new Error('Failed to upload image to ImgBB');
      }
  
    } catch (error) {
      console.error('An error occurred:', error);
      await unlinkAsync(req.file.path); // En cas d'erreur, effacez aussi le fichier
      res.status(500).json({ result: false, error: error.message });
    }
});

// delete un tableau
router.post("/:id", async (req, res) => {
  try {
    const tableauId = req.params.id;
    // Trouver l'affiche dans la base de données
    const tableau = await Tableau.findById(tableauId);

    if (!tableau) {
      return res.status(404).json({ result: false, message: "Tableau not found" });
    }

    const result = await cloudinary.uploader.destroy(tableau.idCloud, { resource_type: 'image' })

    if (result.result == 'ok') {
      // Supprimer l'affiche de la base de données MongoDB
      await Tableau.deleteOne({ _id: tableauId });
    } else {
      return res.json({ result: false, message: "Tableau not found" });
    }


    res.json({ result: true, message: "Tableau deleted successfully" });
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
