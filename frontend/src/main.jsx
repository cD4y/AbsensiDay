import React, { useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation
} from 'react-router-dom';
import {
  Clock, Users, LayoutDashboard, CalendarDays, LogOut,
  Search, Plus, Trash2, CheckCircle2, Pencil, TrendingUp,
  AlertCircle, LogIn, LogOut as LogOutIcon, ChevronRight
} from 'lucide-react';
import './style.css';

/* ─── Helpers ─── */
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');
const getUser  = () => JSON.parse(localStorage.getItem('user') || 'null');

async function request(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getToken() ? `Bearer ${getToken()}` : '',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

function Protected({ children }) { return getToken() ? children : <Navigate to="/login" />; }
function AdminOnly({ children }) { return getUser()?.role === 'admin' ? children : <Navigate to="/absensi" />; }

function initials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function statusBadge(status) {
  const map = {
    'Hadir':        'badge-green',
    'Terlambat':    'badge-yellow',
    'Pulang Cepat': 'badge-yellow',
    'Tidak Hadir':  'badge-red',
    'Izin':         'badge-blue',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status || '-'}</span>;
}

/* ─────────────────────────────────────────
   LOGIN
───────────────────────────────────────── */
function Login() {
  const nav = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!email || !password) { setErr('Email dan password wajib diisi.'); return; }
    setLoading(true);
    try {
      const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">

        {/* Left */}
        <div className="login-left">
          <div>
            <div className="login-brand">
              <div className="login-brand-icon">
                <i className="ti ti-clock-check" />
              </div>
              <span className="login-brand-name">AbsensiDay</span>
            </div>
            <p className="login-tagline">Sistem absensi karyawan yang mudah, cepat, dan akurat untuk tim kamu.</p>
            <div className="login-features">
              {[
                { icon: 'ti-fingerprint', title: 'Absen real-time',    desc: 'Catat kehadiran langsung dari browser' },
                { icon: 'ti-chart-bar',   title: 'Laporan otomatis',   desc: 'Rekap hadir, terlambat & pulang cepat' },
                { icon: 'ti-shield-check',title: 'Manajemen akses',    desc: 'Peran admin & karyawan terpisah' },
              ].map(f => (
                <div className="login-feat" key={f.title}>
                  <div className="login-feat-icon"><i className={`ti ${f.icon}`} /></div>
                  <div>
                    <div className="login-feat-title">{f.title}</div>
                    <div className="login-feat-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="login-footer">© 2025 AbsensiDay · v1.0</div>
        </div>

        {/* Right */}
        <div className="login-right">
          <h2 className="login-title">Selamat datang kembali</h2>
          <p className="login-subtitle">Masuk ke akun kamu untuk melanjutkan</p>

          {err && (
            <div className="login-error">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {err}
            </div>
          )}

          <form onSubmit={submit} noValidate>
            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <i className="ti ti-mail login-input-icon" />
                <input
                  className="login-input"
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <i className="ti ti-lock login-input-icon" />
                <input
                  className="login-input"
                  style={{ paddingRight: 42 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label="Toggle password"
                >
                  <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <span className="forgot">Lupa password?</span>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner" /> : <><LogIn size={16} /> Masuk</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   LAYOUT
───────────────────────────────────────── */
function Layout({ children, title, subtitle }) {
  const nav = useNavigate();
  const loc = useLocation();
  const user = getUser();
  const logout = () => { localStorage.clear(); nav('/login'); };

  const navLinks = [
    { to: '/',         icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
    { to: '/absensi',  icon: <Clock size={16} />,           label: 'Absensi Saya' },
    ...(user?.role === 'admin' ? [
      { to: '/karyawan', icon: <Users size={16} />,       label: 'Karyawan' },
      { to: '/laporan',  icon: <CalendarDays size={16} />,label: 'Laporan' },
    ] : []),
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">A</div>
          <div className="brand-text">
            <b>AbsensiDay</b>
            <span>Employee System</span>
          </div>
        </div>

        <div className="sidebar-section-label">Menu</div>
        <nav>
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={loc.pathname === l.to ? 'active' : ''}
            >
              {l.icon} {l.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-section-label">Akun</div>
        <div style={{ padding: '8px 12px', marginBottom: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{user?.role === 'admin' ? 'Administrator' : user?.position || 'Karyawan'}</div>
        </div>
        <button className="logout" onClick={logout}><LogOut size={16} /> Keluar</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="topbar-right">
            <div className="user-badge">
              <div className="user-avatar">{initials(user?.name)}</div>
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">{user?.role === 'admin' ? 'Admin' : 'Karyawan'}</span>
              </div>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────── */
function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);
  const user = getUser();

  useEffect(() => {
    if (user?.role === 'admin') {
      request('/stats').then(setStats).catch(() => {});
      request('/attendance/all').then(rows => setRecent(rows.slice(0, 6))).catch(() => {});
    } else {
      request('/attendance/my-history').then(rows => setRecent(rows.slice(0, 6))).catch(() => {});
    }
  }, []);

  const StatCard = ({ label, value, sub, iconClass, colorClass }) => (
    <div className="stat-card">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? '—'}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div className={`stat-icon ${colorClass}`}>
        <i className={`ti ${iconClass}`} style={{ fontSize: 22 }} />
      </div>
    </div>
  );

  return (
    <Layout
      title={`Halo, ${user?.name?.split(' ')[0]} 👋`}
      subtitle={new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    >
      {user?.role === 'admin' ? (
        <div className="grid3">
          <StatCard label="Total Karyawan"   value={stats?.totalEmployees} sub="Terdaftar"        iconClass="ti-users"        colorClass="blue" />
          <StatCard label="Hadir Hari Ini"   value={stats?.todayPresent}   sub="Tepat waktu"      iconClass="ti-circle-check" colorClass="green" />
          <StatCard label="Terlambat"        value={stats?.lateToday}      sub="Hari ini"         iconClass="ti-clock-exclamation" colorClass="yellow" />
        </div>
      ) : (
        <div className="grid3">
          <StatCard label="Jabatan"    value={user?.position || 'Karyawan'} iconClass="ti-id-badge"     colorClass="blue" />
          <StatCard label="Jam Masuk"  value={user?.work_start || '08:00'}  iconClass="ti-login"        colorClass="green" />
          <StatCard label="Jam Pulang" value={user?.work_end   || '17:00'}  iconClass="ti-logout"       colorClass="yellow" />
        </div>
      )}

      <div className="card">
        <div className="section-header">
          <h3 className="card-title" style={{ margin: 0 }}>
            <TrendingUp size={18} style={{ color: '#fbbf24' }} />
            {user?.role === 'admin' ? 'Absensi Terbaru' : 'Riwayat Absensi'}
          </h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {user?.role === 'admin' && <th>Karyawan</th>}
                <th>Tanggal</th>
                <th>Masuk</th>
                <th>Pulang</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#334155', padding: '32px 0' }}>Belum ada data</td></tr>
              )}
              {recent.map((r, i) => (
                <tr key={i}>
                  {user?.role === 'admin' && (
                    <td>
                      <div className="table-user">
                        <div className="table-avatar">{initials(r.name)}</div>
                        <span>{r.name}</span>
                      </div>
                    </td>
                  )}
                  <td>{r.date}</td>
                  <td>{r.check_in || '—'}</td>
                  <td>{r.check_out || '—'}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

/* ─────────────────────────────────────────
   ABSENSI
───────────────────────────────────────── */
function Absensi() {
  const [today,   setToday]   = useState(null);
  const [history, setHistory] = useState([]);
  const [msg,     setMsg]     = useState({ text: '', type: '' });
  const [time,    setTime]    = useState(new Date());
  const user = getUser();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = () => {
    request('/attendance/today').then(setToday).catch(() => {});
    request('/attendance/my-history').then(setHistory).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const act = async (type) => {
    setMsg({ text: '', type: '' });
    try {
      const data = await request(`/attendance/${type}`, { method: 'POST', body: '{}' });
      setMsg({ text: data.message || 'Berhasil', type: 'success' });
      load();
    } catch (e) {
      setMsg({ text: e.message, type: 'error' });
    }
  };

  const pad = n => String(n).padStart(2, '0');
  const clockStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  return (
    <Layout
      title="Absensi Saya"
      subtitle={time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    >
      <div className="card">
        <div className="absen-hero">
          <div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>
              Jadwal kamu: <strong style={{ color: '#e2e8f0' }}>{user?.work_start || '08:00'} – {user?.work_end || '17:00'}</strong>
            </div>
            <div style={{ marginBottom: 16 }}>
              {today?.status ? statusBadge(today.status) : <span className="badge badge-gray">Belum absen</span>}
            </div>
            {msg.text && (
              <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
                {msg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {msg.text}
              </div>
            )}
            <div className="absen-actions">
              <button
                className="btn-checkin"
                onClick={() => act('check-in')}
                disabled={!!today?.check_in}
              >
                <LogIn size={16} /> Absen Masuk
              </button>
              <button
                className="btn-checkout btn-secondary"
                onClick={() => act('check-out')}
                disabled={!today?.check_in || !!today?.check_out}
              >
                <LogOutIcon size={16} /> Absen Pulang
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="absen-clock">{clockStr}</div>
            <div className="absen-date">Waktu sekarang</div>
          </div>
        </div>

        <div className="absen-box-grid">
          <div className="absen-box">
            <div className="absen-box-label">Absen Masuk</div>
            <div className="absen-box-value" style={{ color: today?.check_in ? '#4ade80' : '#334155' }}>
              {today?.check_in || '—'}
            </div>
          </div>
          <div className="absen-box">
            <div className="absen-box-label">Absen Pulang</div>
            <div className="absen-box-value" style={{ color: today?.check_out ? '#60a5fa' : '#334155' }}>
              {today?.check_out || '—'}
            </div>
          </div>
          <div className="absen-box">
            <div className="absen-box-label">Status</div>
            <div className="absen-box-value" style={{ fontSize: 18, marginTop: 6 }}>
              {statusBadge(today?.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title"><CalendarDays size={18} style={{ color: '#fbbf24' }} /> Riwayat Absensi</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#334155', padding: '32px 0' }}>Belum ada riwayat</td></tr>
              )}
              {history.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.check_in || '—'}</td>
                  <td>{r.check_out || '—'}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

/* ─────────────────────────────────────────
   KARYAWAN (Admin)
───────────────────────────────────────── */
const emptyForm = { name: '', email: '', password: 'user123', position: 'Karyawan', department: 'Umum', role: 'employee', work_start: '08:00', work_end: '17:00' };

function Karyawan() {
  const [users,   setUsers]   = useState([]);
  const [q,       setQ]       = useState('');
  const [form,    setForm]    = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [msg,     setMsg]     = useState({ text: '', type: '' });

  const load = () => request('/users').then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const reset = () => { setEditing(null); setForm(emptyForm); };

  const edit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', position: u.position || '', department: u.department || '', role: u.role || 'employee', work_start: u.work_start || '08:00', work_end: u.work_end || '17:00' });
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });
    try {
      if (editing) {
        await request('/users/' + editing.id, { method: 'PUT', body: JSON.stringify(form) });
        setMsg({ text: 'Data karyawan berhasil diperbarui.', type: 'success' });
      } else {
        await request('/users', { method: 'POST', body: JSON.stringify(form) });
        setMsg({ text: 'Karyawan baru berhasil ditambahkan.', type: 'success' });
      }
      reset(); load();
    } catch (err) {
      setMsg({ text: err.message, type: 'error' });
    }
  };

  const del = async (id) => {
    if (!confirm('Hapus karyawan ini?')) return;
    await request('/users/' + id, { method: 'DELETE' });
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const filtered = users.filter(u => `${u.name}${u.email}${u.department}${u.position}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Layout title="Manajemen Karyawan" subtitle="Kelola data dan jadwal karyawan">
      <div className="split">

        {/* Form */}
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title">
            {editing ? <Pencil size={16} style={{ color: '#fbbf24' }} /> : <Plus size={16} style={{ color: '#fbbf24' }} />}
            {editing ? 'Edit Karyawan' : 'Tambah Karyawan'}
          </h3>

          {msg.text && (
            <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
              {msg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {msg.text}
            </div>
          )}

          <form onSubmit={save} className="form-grid">
            {[
              { label: 'Nama Lengkap', key: 'name',       type: 'text',  placeholder: 'Nama' },
              { label: 'Email',        key: 'email',      type: 'email', placeholder: 'email@perusahaan.com' },
              { label: `Password${editing ? ' (kosongkan jika tidak diubah)' : ''}`, key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Jabatan',      key: 'position',   type: 'text',  placeholder: 'Staff, Manager, dll' },
              { label: 'Departemen',   key: 'department', type: 'text',  placeholder: 'HRD, IT, Marketing, dll' },
            ].map(field => (
              <div className="form-group" key={field.key}>
                <label className="form-label">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={e => f(field.key, e.target.value)}
                />
              </div>
            ))}

            <div className="form-group">
              <label className="form-label">Role</label>
              <select value={form.role} onChange={e => f('role', e.target.value)}>
                <option value="employee">Karyawan</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="time-grid">
              <div className="form-group">
                <label className="form-label">Jam Masuk</label>
                <input type="time" value={form.work_start} onChange={e => f('work_start', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Jam Pulang</label>
                <input type="time" value={form.work_end} onChange={e => f('work_end', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ flex: 1 }}>
                {editing ? <><CheckCircle2 size={14} /> Simpan</> : <><Plus size={14} /> Tambah</>}
              </button>
              {editing && (
                <button type="button" className="btn-secondary" onClick={reset}>Batal</button>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="section-header">
            <h3 className="card-title" style={{ margin: 0 }}>
              <Users size={16} style={{ color: '#fbbf24' }} /> Data Karyawan
              <span className="badge badge-blue" style={{ marginLeft: 6 }}>{filtered.length}</span>
            </h3>
            <div className="search-bar" style={{ width: 220 }}>
              <Search size={14} style={{ color: '#475569', flexShrink: 0 }} />
              <input placeholder="Cari nama, email..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Karyawan</th>
                  <th>Jabatan</th>
                  <th>Jadwal</th>
                  <th>Role</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#334155', padding: '32px 0' }}>Tidak ada karyawan</td></tr>
                )}
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="table-user">
                        <div className="table-avatar">{initials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: '#475569' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ color: '#e2e8f0' }}>{u.position || '—'}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{u.department || '—'}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{u.work_start || '08:00'} – {u.work_end || '17:00'}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-yellow' : 'badge-blue'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Karyawan'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon edit" onClick={() => edit(u)}><Pencil size={13} /></button>
                        {u.role !== 'admin' && (
                          <button className="btn-icon del" onClick={() => del(u.id)}><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}

/* ─────────────────────────────────────────
   LAPORAN (Admin)
───────────────────────────────────────── */
function Laporan() {
  const [rows,   setRows]   = useState([]);
  const [q,      setQ]      = useState('');
  const [filter, setFilter] = useState('Semua');

  useEffect(() => { request('/attendance/all').then(setRows).catch(() => {}); }, []);

  const statuses = ['Semua', 'Hadir', 'Terlambat', 'Pulang Cepat', 'Tidak Hadir'];

  const filtered = rows.filter(r => {
    const matchQ = `${r.name}${r.date}${r.department}${r.status}`.toLowerCase().includes(q.toLowerCase());
    const matchF  = filter === 'Semua' || r.status === filter;
    return matchQ && matchF;
  });

  const counts = {
    hadir:    rows.filter(r => r.status === 'Hadir').length,
    terlambat: rows.filter(r => r.status === 'Terlambat').length,
    tidakHadir: rows.filter(r => r.status === 'Tidak Hadir').length,
  };

  return (
    <Layout title="Laporan Absensi" subtitle="Rekap kehadiran seluruh karyawan">
      <div className="grid3">
        <div className="stat-card">
          <div><div className="stat-label">Total Hadir</div><div className="stat-value">{counts.hadir}</div></div>
          <div className="stat-icon green"><i className="ti ti-circle-check" style={{ fontSize: 22 }} /></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Terlambat</div><div className="stat-value">{counts.terlambat}</div></div>
          <div className="stat-icon yellow"><i className="ti ti-clock-exclamation" style={{ fontSize: 22 }} /></div>
        </div>
        <div className="stat-card">
          <div><div className="stat-label">Tidak Hadir</div><div className="stat-value">{counts.tidakHadir}</div></div>
          <div className="stat-icon red"><i className="ti ti-user-x" style={{ fontSize: 22 }} /></div>
        </div>
      </div>

      <div className="card">
        <div className="section-header">
          <h3 className="card-title" style={{ margin: 0 }}>
            <CalendarDays size={16} style={{ color: '#fbbf24' }} /> Data Absensi
          </h3>
          <div className="search-bar" style={{ width: 240 }}>
            <Search size={14} style={{ color: '#475569', flexShrink: 0 }} />
            <input placeholder="Cari nama, tanggal, status..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: '5px 14px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 500,
                background: filter === s ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                color: filter === s ? '#fbbf24' : '#64748b',
                border: filter === s ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Tanggal</th>
                <th>Jadwal</th>
                <th>Masuk</th>
                <th>Pulang</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#334155', padding: '32px 0' }}>Tidak ada data</td></tr>
              )}
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td>
                    <div className="table-user">
                      <div className="table-avatar">{initials(r.name)}</div>
                      <div>
                        <div style={{ fontWeight: 500, color: '#e2e8f0' }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>{r.department}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.date}</td>
                  <td style={{ fontSize: 12 }}>{r.work_start || '08:00'} – {r.work_end || '17:00'}</td>
                  <td>{r.check_in || '—'}</td>
                  <td>{r.check_out || '—'}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

/* ─────────────────────────────────────────
   APP ROUTER
───────────────────────────────────────── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/"         element={<Protected><Dashboard /></Protected>} />
        <Route path="/absensi"  element={<Protected><Absensi /></Protected>} />
        <Route path="/karyawan" element={<Protected><AdminOnly><Karyawan /></AdminOnly></Protected>} />
        <Route path="/laporan"  element={<Protected><AdminOnly><Laporan /></AdminOnly></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
