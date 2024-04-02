var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });

//dependances pour upload cloudinary
const cloudinary = require("cloudinary").v2;
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
        const resultCloudinary = await cloudinary.uploader.upload(req.file.path, {
            folder: "Expos",
        });

        const newExpo = new Expo({
            imageCouv: resultCloudinary.secure_url,
            idCloud: resultCloudinary.public_id,
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

        const result = await cloudinary.uploader.destroy(expo.idCloud, { resource_type: 'image' })

        if (result.result == 'ok') {
            // Supprimer l'affiche de la base de données MongoDB
            await Expo.deleteOne({ _id: expoId });
        } else {
            return res.json({ result: false, message: "Expo not found" });
        }


        res.json({ result: true, message: "Expo deleted successfully" });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ result: false, error: error.message });
    }
});

module.exports = router;
