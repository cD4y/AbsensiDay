require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./db');
const { auth, adminOnly } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json());

const nowDate = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 8);

const sign = (u) =>
  jwt.sign(
    { id: u.id, name: u.name, email: u.email, role: u.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

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

const normalizeTime = (value, fallback) => {
  if (!value) return fallback;
  const text = String(value).slice(0, 5);
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
};

const timeToMinutes = (value) => {
  const [h, m] = String(value || '00:00').slice(0, 5).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const checkInStatus = (actual, scheduled) =>
  timeToMinutes(actual) > timeToMinutes(scheduled) ? 'Terlambat' : 'Hadir';

const checkoutStatus = (currentStatus, actual, scheduled) => {
  if (timeToMinutes(actual) >= timeToMinutes(scheduled)) return currentStatus || 'Hadir';
  if (currentStatus && currentStatus.includes('Pulang Cepat')) return currentStatus;
  if (currentStatus && currentStatus !== 'Hadir') return `${currentStatus} & Pulang Cepat`;
  return 'Pulang Cepat';
};

async function isValidPassword(inputPassword, savedPassword) {
  if (!savedPassword) return false;
  if (String(savedPassword).startsWith('$2')) {
    return bcrypt.compare(inputPassword, savedPassword);
  }
  return inputPassword === savedPassword;
}

app.get('/', (_, res) => {
  res.json({ message: 'API Absensi Karyawan aktif dengan Supabase' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id,name,email,password,role,position,department,work_start,work_end,created_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Login Supabase error:', error.message);
      return res.status(500).json({ message: 'Gagal membaca user dari Supabase. Cek RLS/API key.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const valid = await isValidPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    const safeUser = safeUserPayload(user);
    res.json({ token: sign(safeUser), user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Gagal login' });
  }
});

app.get('/api/me', auth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    res.json(user);
  } catch (error) {
    console.error('Me error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil data user' });
  }
});

app.get('/api/users', auth, adminOnly, async (_, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('users')
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .order('id', { ascending: false });

    if (error) throw error;
    res.json(rows || []);
  } catch (error) {
    console.error('Users error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil karyawan dari Supabase' });
  }
});

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const {
      name,
      password,
      position = 'Karyawan',
      department = 'Umum',
      work_start = '08:00',
      work_end = '17:00'
    } = req.body;

    const email = String(req.body.email || '').trim().toLowerCase();
    const role = req.body.role || 'employee';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, password wajib diisi' });
    }

    const payload = {
      name,
      email,
      password: await bcrypt.hash(String(password), 10),
      role,
      position,
      department,
      work_start: normalizeTime(work_start, '08:00'),
      work_end: normalizeTime(work_end, '17:00')
    };

    const { data: user, error } = await supabase
      .from('users')
      .insert(payload)
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .single();

    if (error) {
      console.error('Tambah user error:', error.message);
      return res.status(400).json({ message: 'Email sudah digunakan atau data tidak valid' });
    }

    res.status(201).json(user);
  } catch (error) {
    console.error('Tambah user fatal:', error.message);
    res.status(500).json({ message: 'Gagal menambah karyawan' });
  }
});

app.put('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const {
      name,
      password,
      position = 'Karyawan',
      department = 'Umum',
      work_start = '08:00',
      work_end = '17:00'
    } = req.body;

    const email = String(req.body.email || '').trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({ message: 'Nama dan email wajib diisi' });
    }

    const payload = {
      name,
      email,
      position,
      department,
      work_start: normalizeTime(work_start, '08:00'),
      work_end: normalizeTime(work_end, '17:00')
    };

    if (password && String(password).trim()) {
      payload.password = await bcrypt.hash(String(password), 10);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', req.params.id)
      .select('id,name,email,role,position,department,work_start,work_end,created_at')
      .single();

    if (error || !user) {
      console.error('Edit user error:', error?.message);
      return res.status(400).json({ message: 'User tidak ditemukan, email sudah digunakan, atau data tidak valid' });
    }

    res.json(user);
  } catch (error) {
    console.error('Edit user fatal:', error.message);
    res.status(500).json({ message: 'Gagal mengedit karyawan' });
  }
});

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'Admin tidak bisa menghapus akun sendiri' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    console.error('Hapus user error:', error.message);
    res.status(500).json({ message: 'Gagal menghapus user' });
  }
});

app.get('/api/attendance/today', auth, async (req, res) => {
  try {
    const { data: row, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', nowDate())
      .maybeSingle();

    if (error) throw error;
    res.json(row || null);
  } catch (error) {
    console.error('Today attendance error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil absensi hari ini' });
  }
});

app.post('/api/attendance/check-in', auth, async (req, res) => {
  try {
    const date = nowDate();
    const time = nowTime();

    const { data: existing, error: existingError } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      return res.status(400).json({ message: 'Kamu sudah absen masuk hari ini' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('work_start')
      .eq('id', req.user.id)
      .maybeSingle();

    if (userError || !user) {
      return res.status(500).json({ message: 'Gagal mengambil jadwal kerja' });
    }

    const status = checkInStatus(time, normalizeTime(user.work_start, '08:00'));

    const payload = {
      user_id: req.user.id,
      date,
      check_in: time,
      check_out: null,
      status
    };

    // Kolom note tidak wajib. Jika tabel kamu punya kolom note, boleh aktifkan baris di bawah.
    // payload.note = req.body.note || '';

    const { data: row, error } = await supabase
      .from('attendance')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    res.status(201).json(row);
  } catch (error) {
    console.error('Check-in error:', error.message);
    res.status(500).json({ message: 'Gagal absen masuk' });
  }
});

app.post('/api/attendance/check-out', auth, async (req, res) => {
  try {
    const date = nowDate();
    const time = nowTime();

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('date', date)
      .maybeSingle();

    if (attendanceError) throw attendanceError;
    if (!attendance) return res.status(400).json({ message: 'Belum absen masuk' });
    if (attendance.check_out) return res.status(400).json({ message: 'Sudah absen pulang' });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('work_end')
      .eq('id', req.user.id)
      .maybeSingle();

    if (userError || !user) {
      return res.status(500).json({ message: 'Gagal mengambil jadwal pulang' });
    }

    const status = checkoutStatus(attendance.status, time, normalizeTime(user.work_end, '17:00'));

    const { data: row, error } = await supabase
      .from('attendance')
      .update({ check_out: time, status })
      .eq('id', attendance.id)
      .select('*')
      .single();

    if (error) throw error;

    res.json({ message: 'Absen pulang berhasil', ...row });
  } catch (error) {
    console.error('Check-out error:', error.message);
    res.status(500).json({ message: 'Gagal absen pulang' });
  }
});

app.get('/api/attendance/my-history', auth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .limit(60);

    if (error) throw error;
    res.json(rows || []);
  } catch (error) {
    console.error('My history error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil riwayat absensi' });
  }
});

app.get('/api/attendance/all', auth, adminOnly, async (_, res) => {
  try {
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })
      .order('id', { ascending: false });

    if (attendanceError) throw attendanceError;

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id,name,email,position,department,work_start,work_end');

    if (usersError) throw usersError;

    const userMap = new Map((users || []).map((u) => [Number(u.id), u]));

    const rows = (attendanceRows || []).map((a) => {
      const u = userMap.get(Number(a.user_id)) || {};
      return {
        ...a,
        name: u.name || '-',
        email: u.email || '-',
        position: u.position || '-',
        department: u.department || '-',
        work_start: u.work_start || '08:00',
        work_end: u.work_end || '17:00'
      };
    });

    res.json(rows);
  } catch (error) {
    console.error('Attendance all error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil laporan absensi' });
  }
});

app.get('/api/stats', auth, adminOnly, async (_, res) => {
  try {
    const date = nowDate();

    const { count: totalEmployees, error: totalError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .neq('role', 'admin');

    if (totalError) throw totalError;

    const { count: todayPresent, error: presentError } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', date)
      .not('check_in', 'is', null);

    if (presentError) throw presentError;

    const { count: checkedOut, error: outError } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', date)
      .not('check_out', 'is', null);

    if (outError) throw outError;

    const { count: lateToday, error: lateError } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', date)
      .ilike('status', '%Terlambat%');

    if (lateError) throw lateError;

    res.json({
      totalEmployees: totalEmployees || 0,
      todayPresent: todayPresent || 0,
      checkedOut: checkedOut || 0,
      lateToday: lateToday || 0,
      date
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ message: 'Gagal mengambil statistik' });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
}
