/**
 * Script de migration : MongoDB → SQLite + ImgBB → Cloudinary
 *
 * Usage :
 *   node migrate.js
 *
 * Prérequis : avoir les variables d'env suivantes dans le .env du backend
 *   CONNECTION_STRING, CLOUDINARY_URL, DB_PATH (optionnel)
 */

require('dotenv').config();

const mongoose = require('mongoose');
const Database = require('better-sqlite3');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data/artpapa.db');

// --- Schémas Mongoose (lecture seule) ---
const afficheSchema = new mongoose.Schema({ imageName: String, idCloud: String, filmName: String, realName: String, creationDate: Date });
const posterSchema  = new mongoose.Schema({ imageName: String, idCloud: String, posterName: String, creationDate: Date });
const tableauSchema = new mongoose.Schema({ imageName: String, idCloud: String, tableauName: String, auteur: String, prix: String, description: String, creationDate: Date });
const photoSchema   = new mongoose.Schema({ imageName: String, idCloud: String, photoName: String, auteur: String, prix: String, description: String, creationDate: Date });
const expoSchema    = new mongoose.Schema({ imageCouv: String, idCloud: String, expoName: String, adresse: String, auteur: String, startDate: Date, endDate: Date, description: String, creationDate: Date });
const userSchema    = new mongoose.Schema({ user: String, password: String, token: String });

const AfficheM = mongoose.model('affiches', afficheSchema);
const PosterM  = mongoose.model('posters', posterSchema);
const TableauM = mongoose.model('tableaux', tableauSchema);
const PhotoM   = mongoose.model('photos', photoSchema);
const ExpoM    = mongoose.model('expositions', expoSchema);
const UserM    = mongoose.model('users', userSchema);

// --- SQLite ---
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT NOT NULL UNIQUE, password TEXT NOT NULL, token TEXT
  );
  CREATE TABLE IF NOT EXISTS affiches (
    id INTEGER PRIMARY KEY AUTOINCREMENT, image_name TEXT NOT NULL, id_cloud TEXT, film_name TEXT, real_name TEXT, creation_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS posters (
    id INTEGER PRIMARY KEY AUTOINCREMENT, image_name TEXT NOT NULL, id_cloud TEXT, poster_name TEXT, creation_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS tableaux (
    id INTEGER PRIMARY KEY AUTOINCREMENT, image_name TEXT NOT NULL, id_cloud TEXT, tableau_name TEXT, auteur TEXT, prix TEXT, description TEXT, creation_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, image_name TEXT NOT NULL, id_cloud TEXT, photo_name TEXT, auteur TEXT, prix TEXT, description TEXT, creation_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS expositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, image_couv TEXT NOT NULL, id_cloud TEXT, expo_name TEXT, adresse TEXT, auteur TEXT, start_date TEXT, end_date TEXT, description TEXT, creation_date TEXT DEFAULT (datetime('now'))
  );
`);

// --- Helpers ---
async function migrateImage(imageUrl, folder = 'artpapa') {
  if (!imageUrl) return { url: '', publicId: '' };

  // Déjà sur Cloudinary → on garde
  if (imageUrl.includes('res.cloudinary.com')) {
    console.log('  [skip] déjà Cloudinary:', imageUrl.slice(0, 60));
    return { url: imageUrl, publicId: '' };
  }

  // Télécharger depuis ImgBB puis uploader sur Cloudinary
  console.log('  [upload] ImgBB →', imageUrl.slice(0, 60));
  const tmpFile = path.join(os.tmpdir(), `migration_${Date.now()}`);

  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
    fs.writeFileSync(tmpFile, response.data);

    const result = await cloudinary.uploader.upload(tmpFile, {
      folder,
      resource_type: 'image',
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    });

    return { url: result.secure_url, publicId: result.public_id };
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}

function isoDate(d) {
  return d ? new Date(d).toISOString() : null;
}

// --- Migration ---
async function migrate() {
  console.log('Connexion MongoDB…');
  await mongoose.connect(process.env.CONNECTION_STRING, { serverSelectionTimeoutMS: 15000 });
  console.log('Connecté.\n');

  // Users
  const users = await UserM.find();
  console.log(`Users : ${users.length}`);
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (user, password, token) VALUES (?, ?, ?)');
  for (const u of users) {
    insertUser.run(u.user, u.password, u.token);
  }

  // Affiches
  const affiches = await AfficheM.find();
  console.log(`Affiches : ${affiches.length}`);
  const insertAffiche = db.prepare('INSERT INTO affiches (image_name, id_cloud, film_name, real_name, creation_date) VALUES (?, ?, ?, ?, ?)');
  for (const a of affiches) {
    const { url, publicId } = await migrateImage(a.imageName, 'artpapa/affiches');
    insertAffiche.run(url, publicId, a.filmName, a.realName, isoDate(a.creationDate));
  }

  // Posters
  const posters = await PosterM.find();
  console.log(`Posters : ${posters.length}`);
  const insertPoster = db.prepare('INSERT INTO posters (image_name, id_cloud, poster_name, creation_date) VALUES (?, ?, ?, ?)');
  for (const p of posters) {
    const { url, publicId } = await migrateImage(p.imageName, 'artpapa/posters');
    insertPoster.run(url, publicId, p.posterName, isoDate(p.creationDate));
  }

  // Tableaux
  const tableaux = await TableauM.find();
  console.log(`Tableaux : ${tableaux.length}`);
  const insertTableau = db.prepare('INSERT INTO tableaux (image_name, id_cloud, tableau_name, auteur, prix, description, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const t of tableaux) {
    const { url, publicId } = await migrateImage(t.imageName, 'artpapa/tableaux');
    insertTableau.run(url, publicId, t.tableauName, t.auteur, t.prix, t.description, isoDate(t.creationDate));
  }

  // Photos
  const photos = await PhotoM.find();
  console.log(`Photos : ${photos.length}`);
  const insertPhoto = db.prepare('INSERT INTO photos (image_name, id_cloud, photo_name, auteur, prix, description, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const p of photos) {
    const { url, publicId } = await migrateImage(p.imageName, 'artpapa/photos');
    insertPhoto.run(url, publicId, p.photoName, p.auteur, p.prix, p.description, isoDate(p.creationDate));
  }

  // Expositions
  const expos = await ExpoM.find();
  console.log(`Expositions : ${expos.length}`);
  const insertExpo = db.prepare('INSERT INTO expositions (image_couv, id_cloud, expo_name, adresse, auteur, start_date, end_date, description, creation_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const e of expos) {
    const { url, publicId } = await migrateImage(e.imageCouv, 'artpapa/expos');
    insertExpo.run(url, publicId, e.expoName, e.adresse, e.auteur, isoDate(e.startDate), isoDate(e.endDate), e.description, isoDate(e.creationDate));
  }

  await mongoose.disconnect();
  console.log('\nMigration terminée ! Base SQLite :', DB_PATH);
}

migrate().catch((err) => {
  console.error('Erreur migration :', err);
  process.exit(1);
});
