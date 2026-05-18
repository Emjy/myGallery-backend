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

function toPoster(row) {
  return {
    _id: row.id,
    id: row.id,
    imageName: row.image_name,
    idCloud: row.id_cloud,
    posterName: row.poster_name,
    creationDate: row.creation_date,
  };
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM posters ORDER BY creation_date DESC').all();
    res.json({ result: true, posters: rows.map(toPoster) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { url, publicId } = await uploadImage(req.file.path);
    await unlinkAsync(req.file.path);

    const stmt = db.prepare(
      'INSERT INTO posters (image_name, id_cloud, poster_name) VALUES (?, ?, ?)'
    );
    const info = stmt.run(url, publicId, req.body.posterName);
    const poster = db.prepare('SELECT * FROM posters WHERE id = ?').get(info.lastInsertRowid);

    res.json({ result: true, poster: toPoster(poster) });
  } catch (error) {
    if (req.file?.path) await unlinkAsync(req.file.path).catch(() => {});
    res.status(500).json({ result: false, error: error.message });
  }
});

router.put('/:id', requireAuth, (req, res) => {
  try {
    const { posterName } = req.body;
    db.prepare('UPDATE posters SET poster_name = ? WHERE id = ?').run(posterName, req.params.id);
    const row = db.prepare('SELECT * FROM posters WHERE id = ?').get(req.params.id);
    res.json({ result: true, poster: toPoster(row) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/:id', requireAuth, async (req, res) => {
  try {
    const poster = db.prepare('SELECT * FROM posters WHERE id = ?').get(req.params.id);
    if (!poster) return res.status(404).json({ result: false, message: 'Poster not found' });

    await deleteImage(poster.id_cloud);
    db.prepare('DELETE FROM posters WHERE id = ?').run(req.params.id);

    res.json({ result: true, message: 'Poster deleted successfully' });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
