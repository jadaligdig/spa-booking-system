// One shared connection to the SQLite database file.
// node:sqlite is built into Node 22.13+ so there is nothing extra to install.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const file = path.join(__dirname, '..', 'database', process.env.DB_FILE || 'spa.db');
const db = new DatabaseSync(file);
db.exec('PRAGMA foreign_keys = ON'); // make FOREIGN KEY rules actually enforced

module.exports = db;
