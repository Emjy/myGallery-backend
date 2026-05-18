const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

const db = require('../db');

router.post('/createUser', (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM users WHERE user = ?').get(req.body.user);
    if (existing) return res.json({ result: false, error: 'Existing user' });

    const hash = bcrypt.hashSync(req.body.password, 10);
    const token = uid2(32);

    db.prepare('INSERT INTO users (user, password, token) VALUES (?, ?, ?)').run(req.body.user, hash, token);

    res.json({ result: true, token, user: req.body.user });
  } catch (error) {
    res.status(500).json({ result: false, error: 'Erreur serveur' });
  }
});

router.post('/signIn', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE user = ?').get(req.body.user);

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.json({ result: true, token: user.token, user: user.user });
    } else {
      res.json({ result: false, error: 'Incorrect user or password' });
    }
  } catch (error) {
    res.status(500).json({ result: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
