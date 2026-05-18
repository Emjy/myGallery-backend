const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const util = require('util');

const db = require('../db');
const { requireAuth } = require('../lib/auth');
const { uploadImage, deleteImage } = require('../lib/cloudinary');

const upload = multer({
  dest: '/tmp/uploads',
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});
const unlinkAsync = util.promisify(fs.unlink);

function toAffiche(row) {
  return {
    _id: row.id,
    id: row.id,
    imageName: row.image_name,
    idCloud: row.id_cloud,
    filmName: row.film_name,
    realName: row.real_name,
    creationDate: row.creation_date,
  };
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM affiches ORDER BY creation_date DESC').all();
    res.json({ result: true, affiches: rows.map(toAffiche) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { url, publicId } = await uploadImage(req.file.path);
    await unlinkAsync(req.file.path);

    const stmt = db.prepare(
      'INSERT INTO affiches (image_name, id_cloud, film_name, real_name) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(url, publicId, req.body.filmName, req.body.realName);
    const affiche = db.prepare('SELECT * FROM affiches WHERE id = ?').get(info.lastInsertRowid);

    res.json({ result: true, affiche: toAffiche(affiche) });
  } catch (error) {
    if (req.file?.path) await unlinkAsync(req.file.path).catch(() => {});
    res.status(500).json({ result: false, error: error.message });
  }
});

router.put('/:id', requireAuth, (req, res) => {
  try {
    const { filmName, realName } = req.body;
    db.prepare('UPDATE affiches SET film_name = ?, real_name = ? WHERE id = ?').run(filmName, realName, req.params.id);
    const row = db.prepare('SELECT * FROM affiches WHERE id = ?').get(req.params.id);
    res.json({ result: true, affiche: toAffiche(row) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/:id', requireAuth, async (req, res) => {
  try {
    const affiche = db.prepare('SELECT * FROM affiches WHERE id = ?').get(req.params.id);
    if (!affiche) return res.status(404).json({ result: false, message: 'Affiche not found' });

    await deleteImage(affiche.id_cloud);
    db.prepare('DELETE FROM affiches WHERE id = ?').run(req.params.id);

    res.json({ result: true, message: 'Affiche deleted successfully' });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
