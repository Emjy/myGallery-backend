var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });

const FormData = require('form-data');
const axios = require('axios');

const fs = require("fs");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);

const Expo = require("../models/expositions");

// Affichage de toutes les expos 

router.get("/", async (req, res) => {
    try {
        const expos = await Expo.find();

        res.json({ result: true, expos });
    } catch (error) {
        res.json({ result: false, error });
    }
});

// Post an expo

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

        const newExpo = new Expo({
            imageCouv: response.data.data.url,
            idCloud: response.data.delete_url,
            expoName: req.body.expoName,
            adresse: req.body.adresse,
            auteur: req.body.auteur,
            startDate: new Date(req.body.startDate),
            endDate: new Date(req.body.endDate),
            description: req.body.description,
            creationDate: new Date(),
        });

        const expo = await newExpo.save();
        await unlinkAsync(req.file.path); // Assurez-vous d'effacer le fichier temporaire
            res.json({ result: true, expo });
        } else {
            throw new Error('Failed to upload image to ImgBB');
        }

    } catch (error) {
        console.error('An error occurred:', error);
        await unlinkAsync(req.file.path); // En cas d'erreur, effacez aussi le fichier
        res.status(500).json({ result: false, error: error.message });
    }
});

// delete une photo
router.post("/:id", async (req, res) => {
    try {
        const expoId = req.params.id;
        // Trouver l'affiche dans la base de données
        const expo = await Expo.findById(expoId);

        if (!expo) {
            return res.status(404).json({ result: false, message: "Expo not found" });
        }

        await Expo.deleteOne({ _id: expoId });
  
        res.json({ result: true, message: "Expo deleted successfully" });

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ result: false, error: error.message });
    }
});

module.exports = router;
