var express = require('express');
var router = express.Router();

const Affiche = require('../models/affiches');

/* GET users listing. */
router.get('/', async (req, res) => {
 
    try {
        const affiches = await Affiche.find()
         
        res.json({ result: true, affiches })

    } catch(error) {

        res.json({ result: false, error })

    }

});


router.post('/', async (req, res) => {

    try {
        const newAffiche = new Affiche({
            imageName: req.body.imageName,
            filmName: req.body.filmName,
            realName: req.body.realName, 
        })

        const affiche = await newAffiche.save()

        res.json({ result: true, affiche })

    } catch(error) {

        res.json({ result: false, error })

    }


});


module.exports = router;
