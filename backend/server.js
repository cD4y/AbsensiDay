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

const safeUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  position: user.position,
  department: user.department,
  work_start: user.work_start || '08:00',
  work_end: user.work_end || '17:00',
  created_at: user.created_at
});

async function isValidPassword(inputPassword, savedPassword) {
  if (!savedPassword) return false;

  // Password lama dari SQLite biasanya bcrypt.
  // Admin awal yang dibuat manual di Supabase bisa masih plain text: admin123.
  if (String(savedPassword).startsWith('$2')) {
    return bcrypt.compare(inputPassword, savedPassword);
  }

  return inputPassword === savedPassword;
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const { data: user, error } = await db.supabase
      .from('users')
      .select('id,name,email,password,role,position,department,work_start,work_end,created_at')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const valid = await isValidPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const safeUser = safeUserPayload(user);
    res.json({ token: sign(safeUser), user: safeUser });
  } catch (error) {
    console.error('Login Supabase error:', error.message);
    res.status(500).json({ message: 'Gagal login ke Supabase' });
  }
});

app.get('/api/me', auth, async (req, res) => {
  try {
    const { data: user, error } = await db.supabase
      .from('users')
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user);
  } catch (error) {
    console.error('Me Supabase error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data user' });
  }
});

app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { data: rows, error } = await db.supabase
      .from('users')
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(rows || []);
  } catch (error) {
    console.error('Ambil users Supabase error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil user dari Supabase' });
  }
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
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

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, password wajib diisi' });
    }

    const hash = await bcrypt.hash(password, 10);
    const start = normalizeTime(work_start, '08:00');
    const end = normalizeTime(work_end, '17:00');

    const payload = {
      name,
      email,
      password: hash,
      role,
      position,
      department,
      work_start: start,
      work_end: end
    };

    const { data: user, error } = await db.supabase
      .from('users')
      .insert(payload)
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .single();

    if (error) {
      console.error('Tambah user Supabase error:', error.message);
      return res.status(400).json({ message: 'Email sudah digunakan atau data tidak valid' });
    }

    res.status(201).json(user);
  } catch (error) {
    console.error('Tambah user error:', error.message);
    res.status(500).json({ message: 'Gagal menambah karyawan' });
  }
});

app.put('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      position = 'Karyawan',
      department = 'Umum',
      work_start = '08:00',
      work_end = '17:00'
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Nama dan email wajib diisi' });
    }

    const start = normalizeTime(work_start, '08:00');
    const end = normalizeTime(work_end, '17:00');

    const payload = {
      name,
      email,
      position,
      department,
      work_start: start,
      work_end: end
    };

    if (password && String(password).trim()) {
      payload.password = await bcrypt.hash(password, 10);
    }

    const { data: user, error } = await db.supabase
      .from('users')
      .update(payload)
      .eq('id', req.params.id)
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .single();

    if (error || !user) {
      console.error('Edit user Supabase error:', error?.message);
      return res.status(400).json({ message: 'User tidak ditemukan, email sudah digunakan, atau data tidak valid' });
    }

    res.json(user);
  } catch (error) {
    console.error('Edit user error:', error.message);
    res.status(500).json({ message: 'Gagal mengedit karyawan' });
  }
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'Admin tidak bisa menghapus akun sendiri' });
    }

    const { error } = await db.supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Hapus user Supabase error:', error.message);
      return res.status(500).json({ message: 'Gagal menghapus user dari Supabase' });
    }

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Hapus user error:', error.message);
    res.status(500).json({ message: 'Gagal menghapus user' });
  }
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

app.get('/api/stats', auth, adminOnly, async (req, res) => {
  const date = nowDate();

  try {
    const { count: totalEmployees, error } = await db.supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .neq('role', 'admin');

    if (error) throw error;

    // Tahap 3: statistik karyawan sudah dari Supabase.
    // Statistik absensi masih dari SQLite dan akan dipindah pada Tahap 4.
    db.get('SELECT COUNT(*) as todayPresent FROM attendance WHERE date=? AND check_in IS NOT NULL', [date], (e2, present) => {
      db.get('SELECT COUNT(*) as checkedOut FROM attendance WHERE date=? AND check_out IS NOT NULL', [date], (e3, out) => {
        db.get('SELECT COUNT(*) as lateToday FROM attendance WHERE date=? AND status LIKE "%Terlambat%"', [date], (e4, late) => {
          res.json({
            totalEmployees: totalEmployees || 0,
            todayPresent: present?.todayPresent || 0,
            checkedOut: out?.checkedOut || 0,
            lateToday: late?.lateToday || 0,
            date
          });
        });
      });
    });
  } catch (error) {
    console.error('Stats Supabase error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil statistik' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
