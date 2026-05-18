const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const util = require('util');

const db = require('../db');
const { uploadImage, deleteImage } = require('../lib/cloudinary');

const upload = multer({ dest: '/tmp/uploads' });
const unlinkAsync = util.promisify(fs.unlink);

function toPhoto(row) {
  return {
    _id: row.id,
    id: row.id,
    imageName: row.image_name,
    idCloud: row.id_cloud,
    photoName: row.photo_name,
    auteur: row.auteur,
    prix: row.prix,
    description: row.description,
    creationDate: row.creation_date,
  };
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM photos ORDER BY creation_date DESC').all();
    res.json({ result: true, photos: rows.map(toPhoto) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    if (!row) return res.json({ result: false, message: 'photo not found' });
    res.json({ result: true, photo: toPhoto(row) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { url, publicId } = await uploadImage(req.file.path);
    await unlinkAsync(req.file.path);

    const stmt = db.prepare(
      'INSERT INTO photos (image_name, id_cloud, photo_name, auteur, prix, description) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(url, publicId, req.body.photoName, req.body.auteur, req.body.prix, req.body.description);
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(info.lastInsertRowid);

    res.json({ result: true, photo: toPhoto(photo) });
  } catch (error) {
    if (req.file?.path) await unlinkAsync(req.file.path).catch(() => {});
    res.status(500).json({ result: false, error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { photoName, auteur, prix } = req.body;
    db.prepare('UPDATE photos SET photo_name = ?, auteur = ?, prix = ? WHERE id = ?').run(photoName, auteur, prix, req.params.id);
    const row = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    res.json({ result: true, photo: toPhoto(row) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/:id', async (req, res) => {
  try {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    if (!photo) return res.status(404).json({ result: false, message: 'Photo not found' });

    await deleteImage(photo.id_cloud);
    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);

    res.json({ result: true, message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
