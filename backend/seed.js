require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  const users = [
    ['Admin HRD', 'admin@absensi.com', 'admin123', 'admin', 'HR Manager', 'HRD', '08:00', '17:00'],
    ['Budi Santoso', 'budi@absensi.com', 'user123', 'employee', 'Staff Operasional', 'Operasional', '08:00', '17:00'],
    ['Siti Aminah', 'siti@absensi.com', 'user123', 'employee', 'Staff Finance', 'Finance', '09:00', '18:00']
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u[2], 10);
    db.run(
      'INSERT OR IGNORE INTO users(name,email,password,role,position,department,work_start,work_end) VALUES(?,?,?,?,?,?,?,?)',
      [u[0], u[1], hash, u[3], u[4], u[5], u[6], u[7]]
    );
  }

  setTimeout(() => {
    console.log('Seed selesai. Login admin: admin@absensi.com / admin123');
    process.exit(0);
  }, 500);
}
seed();
