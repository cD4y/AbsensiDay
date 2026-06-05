require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { auth, adminOnly } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const nowDate = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 8);
const sign = (u) => jwt.sign({ id: u.id, name: u.name, email: u.email, role: u.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
const normalizeTime = (value, fallback) => {
  if (!value) return fallback;
  const text = String(value).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
};
const timeToMinutes = (value) => {
  const [h, m] = String(value || '00:00').slice(0, 5).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const checkInStatus = (actual, scheduled) => timeToMinutes(actual) > timeToMinutes(scheduled) ? 'Terlambat' : 'Hadir';
const checkoutStatus = (currentStatus, actual, scheduled) => {
  if (timeToMinutes(actual) >= timeToMinutes(scheduled)) return currentStatus || 'Hadir';
  if (currentStatus && currentStatus.includes('Pulang Cepat')) return currentStatus;
  if (currentStatus && currentStatus !== 'Hadir') return `${currentStatus} & Pulang Cepat`;
  return 'Pulang Cepat';
};

app.get('/', (_, res) => res.json({ message: 'API Absensi Karyawan aktif' }));

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi' });
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (!user) return res.status(401).json({ message: 'Email atau password salah' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Email atau password salah' });
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      department: user.department,
      work_start: user.work_start || '08:00',
      work_end: user.work_end || '17:00'
    };
    res.json({ token: sign(user), user: safeUser });
  });
});

app.get('/api/me', auth, (req, res) => {
  db.get('SELECT id,name,email,role,position,department,work_start,work_end,created_at FROM users WHERE id=?', [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(user);
  });
});

app.get('/api/users', auth, adminOnly, (req, res) => {
  db.all('SELECT id,name,email,role,position,department,work_start,work_end,created_at FROM users ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil user' });
    res.json(rows);
  });
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  const {
    name,
    email,
    password,
    role = 'employee',
    position = 'Karyawan',
    department = 'Umum',
    work_start = '08:00',
    work_end = '17:00'
  } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Nama, email, password wajib diisi' });
  const hash = await bcrypt.hash(password, 10);
  const start = normalizeTime(work_start, '08:00');
  const end = normalizeTime(work_end, '17:00');
  db.run(
    'INSERT INTO users(name,email,password,role,position,department,work_start,work_end) VALUES(?,?,?,?,?,?,?,?)',
    [name, email, hash, role, position, department, start, end],
    function(err) {
      if (err) return res.status(400).json({ message: 'Email sudah digunakan atau data tidak valid' });
      res.status(201).json({ id: this.lastID, name, email, role, position, department, work_start: start, work_end: end });
    }
  );
});

app.put('/api/users/:id', auth, adminOnly, async (req, res) => {
  const { name, email, password, position = 'Karyawan', department = 'Umum', work_start = '08:00', work_end = '17:00' } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Nama dan email wajib diisi' });
  const start = normalizeTime(work_start, '08:00');
  const end = normalizeTime(work_end, '17:00');

  const updateWithoutPassword = () => {
    db.run(
      'UPDATE users SET name=?, email=?, position=?, department=?, work_start=?, work_end=? WHERE id=?',
      [name, email, position, department, start, end, req.params.id],
      function(err) {
        if (err) return res.status(400).json({ message: 'Email sudah digunakan atau data tidak valid' });
        if (this.changes === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ id: Number(req.params.id), name, email, position, department, work_start: start, work_end: end });
      }
    );
  };

  if (password && String(password).trim()) {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      'UPDATE users SET name=?, email=?, password=?, position=?, department=?, work_start=?, work_end=? WHERE id=?',
      [name, email, hash, position, department, start, end, req.params.id],
      function(err) {
        if (err) return res.status(400).json({ message: 'Email sudah digunakan atau data tidak valid' });
        if (this.changes === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ id: Number(req.params.id), name, email, position, department, work_start: start, work_end: end });
      }
    );
  } else {
    updateWithoutPassword();
  }
});

app.delete('/api/users/:id', auth, adminOnly, (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: 'Admin tidak bisa menghapus akun sendiri' });
  db.run('DELETE FROM users WHERE id=?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ message: 'Gagal menghapus user' });
    res.json({ message: 'User berhasil dihapus' });
  });
});

app.get('/api/attendance/today', auth, (req, res) => {
  db.get('SELECT * FROM attendance WHERE user_id=? AND date=?', [req.user.id, nowDate()], (err, row) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil absensi' });
    res.json(row || null);
  });
});

app.post('/api/attendance/check-in', auth, (req, res) => {
  const date = nowDate();
  const time = nowTime();
  db.get('SELECT work_start FROM users WHERE id=?', [req.user.id], (userErr, user) => {
    if (userErr || !user) return res.status(500).json({ message: 'Gagal mengambil jadwal kerja' });
    const workStart = normalizeTime(user.work_start, '08:00');
    const status = checkInStatus(time, workStart);
    db.run('INSERT INTO attendance(user_id,date,check_in,status,note) VALUES(?,?,?,?,?)', [req.user.id, date, time, status, req.body.note || ''], function(err) {
      if (err) return res.status(400).json({ message: 'Kamu sudah absen masuk hari ini' });
      res.status(201).json({ id: this.lastID, user_id: req.user.id, date, check_in: time, check_out: null, status });
    });
  });
});

app.post('/api/attendance/check-out', auth, (req, res) => {
  const date = nowDate();
  const time = nowTime();
  db.get('SELECT a.status, u.work_end FROM attendance a JOIN users u ON u.id=a.user_id WHERE a.user_id=? AND a.date=?', [req.user.id, date], (getErr, row) => {
    if (getErr) return res.status(500).json({ message: 'Gagal mengambil data absensi' });
    if (!row) return res.status(400).json({ message: 'Belum absen masuk' });
    const status = checkoutStatus(row.status, time, normalizeTime(row.work_end, '17:00'));
    db.run('UPDATE attendance SET check_out=?, status=? WHERE user_id=? AND date=? AND check_out IS NULL', [time, status, req.user.id, date], function(err) {
      if (err) return res.status(500).json({ message: 'Gagal absen pulang' });
      if (this.changes === 0) return res.status(400).json({ message: 'Sudah absen pulang' });
      res.json({ message: 'Absen pulang berhasil', check_out: time, status });
    });
  });
});

app.get('/api/attendance/my-history', auth, (req, res) => {
  db.all('SELECT * FROM attendance WHERE user_id=? ORDER BY date DESC LIMIT 60', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil riwayat' });
    res.json(rows);
  });
});

app.get('/api/attendance/all', auth, adminOnly, (req, res) => {
  db.all(`SELECT a.*, u.name, u.email, u.position, u.department, u.work_start, u.work_end FROM attendance a JOIN users u ON u.id=a.user_id ORDER BY a.date DESC, a.id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil laporan' });
    res.json(rows);
  });
});

app.get('/api/stats', auth, adminOnly, (req, res) => {
  const date = nowDate();
  db.get('SELECT COUNT(*) as totalEmployees FROM users WHERE role="employee"', [], (e1, employees) => {
    db.get('SELECT COUNT(*) as todayPresent FROM attendance WHERE date=? AND check_in IS NOT NULL', [date], (e2, present) => {
      db.get('SELECT COUNT(*) as checkedOut FROM attendance WHERE date=? AND check_out IS NOT NULL', [date], (e3, out) => {
        db.get('SELECT COUNT(*) as lateToday FROM attendance WHERE date=? AND status LIKE "%Terlambat%"', [date], (e4, late) => {
          res.json({
            totalEmployees: employees?.totalEmployees || 0,
            todayPresent: present?.todayPresent || 0,
            checkedOut: out?.checkedOut || 0,
            lateToday: late?.lateToday || 0,
            date
          });
        });
      });
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
