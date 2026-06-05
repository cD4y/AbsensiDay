-- Jalankan di Supabase SQL Editor jika login masih 401 karena RLS.
-- Untuk project belajar/demo yang semua aksesnya lewat backend Express, ini paling sederhana.

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- Pastikan admin ada dan password bisa login.
DELETE FROM users WHERE email = 'admin@absensi.com';

INSERT INTO users (
  name,
  email,
  password,
  role,
  position,
  department,
  work_start,
  work_end
)
VALUES (
  'Admin HRD',
  'admin@absensi.com',
  'admin123',
  'admin',
  'HR Manager',
  'HRD',
  '08:00',
  '17:00'
);

-- Jika tabel attendance belum punya unique constraint, boleh jalankan ini.
-- ALTER TABLE attendance ADD CONSTRAINT attendance_user_date_unique UNIQUE (user_id, date);
