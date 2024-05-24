var express = require("express");
var router = express.Router();

const multer = require('multer');
const upload = multer({ dest: '/tmp/uploads' });

const FormData = require('form-data');
const axios = require('axios');

const fs = require("fs");
const util = require("util");
const unlinkAsync = util.promisify(fs.unlink);

const Poster = require("../models/posters");

// Affichage de tous les posters  

router.get("/", async (req, res) => {
    try {
        const posters = await Poster.find();

        res.json({ result: true, posters });
    } catch (error) {
        res.json({ result: false, error });
    }
});

// Post an poster
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

            const newPoster = new Poster({
                imageName: response.data.data.url,
                idCloud: response.data.data.id,
                posterName: req.body.filmName,
                // realName: req.body.realName,
                creationDate: new Date()
            });

            const poster = await newPoster.save();
            await unlinkAsync(req.file.path);

            res.json({ result: true, poster });
        } else {
            throw new Error('Failed to upload image to ImgBB');
        }

    } catch (error) {
        console.error('An error occurred:', error);
        await unlinkAsync(req.file.path); // Suppression du fichier temporaire en cas d'erreur

        res.status(500).json({ result: false, error: error.message });
    }
});


// delete un poster
router.post("/:id", async (req, res) => {
    try {
        const afficheId = req.params.id;
        // Trouver l'affiche dans la base de données
        const affiche = await Affiche.findById(afficheId);

        if (!affiche) {
            return res.status(404).json({ result: false, message: "Affiche not found" });
        }

        await Affiche.deleteOne({ _id: afficheId });

        res.json({ result: true, message: "Affiche deleted successfully" });

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ result: false, error: error.message });
    }
});


module.exports = router;
