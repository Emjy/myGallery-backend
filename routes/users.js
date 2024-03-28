var express = require('express');
var router = express.Router();
require('../models/connection');

const User = require('../models/users');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

router.post('/createUser', async (req, res) => {
  try {

    // Vérification d'un compte déjà existant
    const existingUser = await User.findOne({ user: req.body.user });
    if (existingUser) {
      res.json({ result: false, user: false, error: 'Existing user' });
      return;
    }

    // hashage du mot de passe
    const hash = bcrypt.hashSync(req.body.password, 10);

    const newUser = new User({
      user: req.body.user,
      password: hash,
      token: uid2(32),
    });

    const data = await newUser.save();

    res.json({ result: true, token : data.token, user: data.user });

  } catch (error) {

    res.status(500).json({ result: false, error: 'Erreur serveur' });

  }
});

module.exports = router;
