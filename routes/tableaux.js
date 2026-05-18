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

function toTableau(row) {
  return {
    _id: row.id,
    id: row.id,
    imageName: row.image_name,
    idCloud: row.id_cloud,
    tableauName: row.tableau_name,
    auteur: row.auteur,
    prix: row.prix,
    description: row.description,
    creationDate: row.creation_date,
  };
}

router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tableaux ORDER BY creation_date DESC').all();
    res.json({ result: true, tableaux: rows.map(toTableau) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM tableaux WHERE id = ?').get(req.params.id);
    if (!row) return res.json({ result: false, message: 'tableau not found' });
    res.json({ result: true, tableau: toTableau(row) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { url, publicId } = await uploadImage(req.file.path);
    await unlinkAsync(req.file.path);

    const stmt = db.prepare(
      'INSERT INTO tableaux (image_name, id_cloud, tableau_name, auteur, prix, description) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const info = stmt.run(url, publicId, req.body.tableauName, req.body.auteur, req.body.prix, req.body.description);
    const tableau = db.prepare('SELECT * FROM tableaux WHERE id = ?').get(info.lastInsertRowid);

    res.json({ result: true, tableau: toTableau(tableau) });
  } catch (error) {
    if (req.file?.path) await unlinkAsync(req.file.path).catch(() => {});
    res.status(500).json({ result: false, error: error.message });
  }
});

router.put('/:id', requireAuth, (req, res) => {
  try {
    const { tableauName, auteur, prix, description } = req.body;
    db.prepare(
      'UPDATE tableaux SET tableau_name = ?, auteur = ?, prix = ?, description = ? WHERE id = ?'
    ).run(tableauName, auteur, prix, description, req.params.id);
    const row = db.prepare('SELECT * FROM tableaux WHERE id = ?').get(req.params.id);
    res.json({ result: true, tableau: toTableau(row) });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

router.post('/:id', requireAuth, async (req, res) => {
  try {
    const tableau = db.prepare('SELECT * FROM tableaux WHERE id = ?').get(req.params.id);
    if (!tableau) return res.status(404).json({ result: false, message: 'Tableau not found' });

    await deleteImage(tableau.id_cloud);
    db.prepare('DELETE FROM tableaux WHERE id = ?').run(req.params.id);

    res.json({ result: true, message: 'Tableau deleted successfully' });
  } catch (error) {
    res.status(500).json({ result: false, error: error.message });
  }
});

module.exports = router;
