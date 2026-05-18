const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/artpapa.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT    NOT NULL UNIQUE,
    password TEXT NOT NULL,
    token TEXT
  );

  CREATE TABLE IF NOT EXISTS affiches (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    image_name    TEXT NOT NULL,
    id_cloud      TEXT,
    film_name     TEXT,
    real_name     TEXT,
    creation_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS posters (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    image_name    TEXT NOT NULL,
    id_cloud      TEXT,
    poster_name   TEXT,
    creation_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tableaux (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    image_name    TEXT NOT NULL,
    id_cloud      TEXT,
    tableau_name  TEXT,
    auteur        TEXT,
    prix          TEXT,
    description   TEXT,
    creation_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS photos (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    image_name    TEXT NOT NULL,
    id_cloud      TEXT,
    photo_name    TEXT,
    auteur        TEXT,
    prix          TEXT,
    description   TEXT,
    creation_date TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expositions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    image_couv    TEXT NOT NULL,
    id_cloud      TEXT,
    expo_name     TEXT,
    adresse       TEXT,
    auteur        TEXT,
    start_date    TEXT,
    end_date      TEXT,
    description   TEXT,
    creation_date TEXT DEFAULT (datetime('now'))
  );
`);

module.exports = db;
