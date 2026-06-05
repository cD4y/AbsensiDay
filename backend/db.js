const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// SQLite tetap dipertahankan sementara supaya fitur lain belum rusak saat migrasi bertahap.
const db = new sqlite3.Database(path.join(__dirname, 'absensi.sqlite'));

// Supabase dipakai mulai Tahap 2 untuk login dan /api/me.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL atau SUPABASE_KEY belum diisi di file .env');
}

db.supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseKey || 'missing-key');

function addColumnIfMissing(table, column, definition) {
  db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
    if (err) return console.error(`Gagal cek kolom ${table}.${column}:`, err.message);
    const exists = rows.some((row) => row.name === column);
    if (!exists) {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, (alterErr) => {
        if (alterErr) console.error(`Gagal tambah kolom ${column}:`, alterErr.message);
      });
    }
  });
}

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    position TEXT DEFAULT 'Karyawan',
    department TEXT DEFAULT 'Umum',
    role TEXT DEFAULT 'employee',
    work_start TEXT DEFAULT '08:00',
    work_end TEXT DEFAULT '17:00',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT DEFAULT 'Hadir',
    note TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  addColumnIfMissing('users', 'work_start', "TEXT DEFAULT '08:00'");
  addColumnIfMissing('users', 'work_end', "TEXT DEFAULT '17:00'");
});

module.exports = db;
