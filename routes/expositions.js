const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const util = require('util');

const db = require('../db');
const { uploadImage, deleteImage } = require('../lib/cloudinary');

const upload = multer({ dest: '/tmp/uploads' });
const unlinkAsync = util.promisify(fs.unlink);

function toExpo(row) {
  return {
    _id: row.id,
    id: row.id,
    imageCouv: row.image_couv,
    idCloud: row.id_cloud,
    expoName: row.expo_name,
    adresse: row.adresse,
    auteur: row.auteur,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
    creationDate: row.creation_date,
  };
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM expositions ORDER BY creation_date DESC').all();
    res.json({ result: true, expos: rows.map(toExpo) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { url, publicId } = await uploadImage(req.file.path);
    await unlinkAsync(req.file.path);

    const stmt = db.prepare(
      'INSERT INTO expositions (image_couv, id_cloud, expo_name, adresse, auteur, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(
      url, publicId,
      req.body.expoName, req.body.adresse, req.body.auteur,
      req.body.startDate, req.body.endDate, req.body.description
    );
    const expo = db.prepare('SELECT * FROM expositions WHERE id = ?').get(info.lastInsertRowid);

    res.json({ result: true, expo: toExpo(expo) });
  } catch (error) {
    if (req.file?.path) await unlinkAsync(req.file.path).catch(() => {});
    res.status(500).json({ result: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { expoName, auteur, adresse, startDate, endDate, description } = req.body;
    db.prepare(
      'UPDATE expositions SET expo_name = ?, auteur = ?, adresse = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?'
    ).run(expoName, auteur, adresse, startDate, endDate, description, req.params.id);
    const row = db.prepare('SELECT * FROM expositions WHERE id = ?').get(req.params.id);
    res.json({ result: true, expo: toExpo(row) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/:id', async (req, res) => {
  try {
    const expo = db.prepare('SELECT * FROM expositions WHERE id = ?').get(req.params.id);
    if (!expo) return res.status(404).json({ result: false, message: 'Expo not found' });

    await deleteImage(expo.id_cloud);
    db.prepare('DELETE FROM expositions WHERE id = ?').run(req.params.id);

    res.json({ result: true, message: 'Expo deleted successfully' });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
