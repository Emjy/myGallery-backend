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