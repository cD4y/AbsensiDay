require('dotenv').config();
const bcrypt = require('bcryptjs');
const supabase = require('./db');

async function upsertUser(user) {
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('id')
    .eq('email', user.email)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from('users')
      .update(user)
      .eq('id', existing.id);

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('users')
    .insert(user);

  if (error) throw error;
}

async function seed() {
  try {
    const users = [
      {
        name: 'Admin HRD',
        email: 'admin@absensi.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        position: 'HR Manager',
        department: 'HRD',
        work_start: '08:00',
        work_end: '17:00'
      },
      {
        name: 'Budi Santoso',
        email: 'budi@absensi.com',
        password: await bcrypt.hash('user123', 10),
        role: 'employee',
        position: 'Staff Operasional',
        department: 'Operasional',
        work_start: '08:00',
        work_end: '17:00'
      },
      {
        name: 'Siti Aminah',
        email: 'siti@absensi.com',
        password: await bcrypt.hash('user123', 10),
        role: 'employee',
        position: 'Staff Finance',
        department: 'Finance',
        work_start: '09:00',
        work_end: '18:00'
      }
    ];

    for (const user of users) {
      await upsertUser(user);
    }

    console.log('Seed Supabase selesai.');
    console.log('Login admin: admin@absensi.com / admin123');
  } catch (error) {
    console.error('Seed gagal:', error.message);
  }
}

seed();
