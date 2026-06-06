import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Clock, Users, LayoutDashboard, CalendarDays, LogOut, Search, Plus, Trash2, CheckCircle2, Pencil } from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

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

/* ─────────────────────────────────────────
   LOGIN PAGE  (redesigned)
───────────────────────────────────────── */
function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!email || !password) { setErr('Email dan password tidak boleh kosong.'); return; }
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
    <div style={s.page}>
      <div style={s.card}>

        {/* ── Left panel ── */}
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={s.brand}>
              <div style={s.brandIcon}><i className="ti ti-clock-check" style={{ fontSize: 22 }} /></div>
              <span style={s.brandName}>AbsensiDay</span>
            </div>
            <p style={s.tagline}>Sistem absensi karyawan yang mudah, cepat, dan akurat.</p>
            <div style={s.features}>
              {[
                { icon: 'ti-fingerprint', title: 'Absen real-time', desc: 'Catat kehadiran langsung dari browser' },
                { icon: 'ti-chart-bar', title: 'Laporan otomatis', desc: 'Rekap hadir, terlambat & pulang cepat' },
                { icon: 'ti-shield-check', title: 'Manajemen akses', desc: 'Peran admin & karyawan terpisah' },
              ].map(f => (
                <div key={f.title} style={s.feat}>
                  <div style={s.featIcon}><i className={`ti ${f.icon}`} style={{ fontSize: 16 }} /></div>
                  <div>
                    <div style={s.featTitle}>{f.title}</div>
                    <div style={s.featDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={s.leftFooter}>© 2025 AbsensiDay · v1.0</div>
        </div>

        {/* ── Right panel / Form ── */}
        <div style={s.right}>
          <div style={s.formHead}>
            <h2 style={s.formTitle}>Selamat datang kembali</h2>
            <p style={s.formSub}>Masuk ke akun kamu untuk melanjutkan</p>
          </div>

          <form onSubmit={submit} noValidate>
            {/* Email */}
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <div style={s.inputWrap}>
                <i className="ti ti-mail" style={s.inputIcon} />
                <input
                  style={s.input}
                  type="email"
                  placeholder="contoh@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={s.field}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <i className="ti ti-lock" style={s.inputIcon} />
                <input
                  style={{ ...s.input, paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={s.eyeBtn}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} style={{ fontSize: 16 }} />
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div style={{ textAlign: 'right', marginBottom: 24, marginTop: -4 }}>
              <span style={s.forgotLink}>Lupa password?</span>
            </div>

            {/* Error */}
            {err && (
              <div style={s.errBox}>
                <i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0 }} />
                {err}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }}
            >
              {loading
                ? <span style={s.spinner} />
                : <><i className="ti ti-login" style={{ fontSize: 16 }} /> Masuk</>
              }
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

/* ── Inline styles untuk Login (dark theme) ── */
const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at top, #1e293b, #020617)',
    padding: 24,
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: 860,
    minHeight: 520,
    borderRadius: 24,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 30px 90px rgba(0,0,0,0.5)',
  },
  left: {
    width: 280,
    flexShrink: 0,
    background: 'rgba(15,23,42,0.95)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    padding: '36px 28px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  leftInner: { position: 'relative', zIndex: 1 },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  brandIcon: {
    width: 40, height: 40, borderRadius: 12,
    background: 'rgba(245,158,11,0.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fbbf24',
  },
  brandName: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' },
  tagline: { fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 28 },
  features: { display: 'flex', flexDirection: 'column', gap: 16 },
  feat: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  featIcon: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: 'rgba(245,158,11,0.12)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fbbf24', marginTop: 1,
  },
  featTitle: { fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 },
  featDesc: { fontSize: 11, color: '#64748b', lineHeight: 1.5 },
  leftFooter: { fontSize: 11, color: 'rgba(255,255,255,0.2)', paddingTop: 24, position: 'relative', zIndex: 1 },

  right: {
    flex: 1,
    background: 'rgba(15,23,42,0.92)',
    padding: '48px 44px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  formHead: { marginBottom: 32 },
  formTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.4px' },
  formSub: { marginTop: 6, marginBottom: 0, fontSize: 13, color: '#64748b' },

  field: { marginBottom: 18 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 7, letterSpacing: '0.2px' },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#475569', pointerEvents: 'none' },
  input: {
    width: '100%',
    padding: '11px 12px 11px 38px',
    fontSize: 13,
    fontFamily: 'inherit',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    outline: 'none',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#475569', padding: 0, display: 'flex', alignItems: 'center',
    borderRadius: 0,
  },
  forgotLink: { fontSize: 12, color: '#f59e0b', cursor: 'pointer', fontWeight: 500 },
  errBox: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 10, padding: '10px 12px',
    fontSize: 12, color: '#fca5a5', marginBottom: 14,
  },
  submitBtn: {
    width: '100%', padding: 13, marginTop: 0,
    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    color: '#111827', border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  spinner: {
    width: 16, height: 16,
    border: '2px solid rgba(0,0,0,0.2)',
    borderTopColor: '#111827',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
};

/* ─────────────────────────────────────────
   LAYOUT (tidak berubah)
───────────────────────────────────────── */
function Layout({ children }) {
  const nav = useNavigate();
  const user = getUser();
  const logout = () => { localStorage.clear(); nav('/login'); };
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">A</div>
          <div><b>AbsensiPro</b><span>Employee System</span></div>
        </div>
        <nav>
          <Link to="/"><LayoutDashboard size={18} /> Dashboard</Link>
          <Link to="/absensi"><Clock size={18} /> Absensi Saya</Link>
          {user?.role === 'admin' && (
            <>
              <Link to="/karyawan"><Users size={18} /> Karyawan</Link>
              <Link to="/laporan"><CalendarDays size={18} /> Laporan</Link>
            </>
          )}
        </nav>
        <button className="logout" onClick={logout}><LogOut size={18} /> Keluar</button>
      </aside>
      <main className="main">
        <header className="topbar">
          <div><h2>Website Absensi Karyawan</h2><p>Selamat datang, {user?.name}</p></div>
          <div className="pill">{user?.role === 'admin' ? 'Admin' : 'Karyawan'}</div>
        </header>
        {children}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────
   HALAMAN LAIN (tidak berubah)
───────────────────────────────────────── */
function StatCard({ title, value, icon }) {
  return (
    <div className="card stat">
      <div><p>{title}</p><h2>{value}</h2></div>
      <div className="statIcon">{icon}</div>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const user = getUser();
  useEffect(() => { if (user?.role === 'admin') request('/stats').then(setStats).catch(() => {}); }, []);
  return (
    <Layout>
      <section className="grid3">
        {user?.role === 'admin' ? (
          <>
            <StatCard title="Total Karyawan" value={stats?.totalEmployees ?? '-'} icon={<Users />} />
            <StatCard title="Hadir Hari Ini" value={stats?.todayPresent ?? '-'} icon={<CheckCircle2 />} />
            <StatCard title="Terlambat Hari Ini" value={stats?.lateToday ?? '-'} icon={<Clock />} />
          </>
        ) : (
          <>
            <StatCard title="Status Akun" value="Aktif" icon={<CheckCircle2 />} />
            <StatCard title="Jabatan" value={user?.position || 'Karyawan'} icon={<Users />} />
            <StatCard title="Jadwal" value={`${user?.work_start || '08:00'} - ${user?.work_end || '17:00'}`} icon={<CalendarDays />} />
          </>
        )}
      </section>
      <div className="card">
        <h3>Ringkasan</h3>
        <p>Admin dapat mengatur jam masuk dan jam pulang berbeda untuk setiap karyawan. Status absensi akan otomatis menjadi Hadir, Terlambat, atau Pulang Cepat sesuai jadwal masing-masing.</p>
      </div>
    </Layout>
  );
}

function Absensi() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [msg, setMsg] = useState('');
  const user = getUser();
  const load = () => {
    request('/attendance/today').then(setToday);
    request('/attendance/my-history').then(setHistory);
  };
  useEffect(() => { load(); }, []);
  const act = async (type) => {
    setMsg('');
    try {
      const data = await request(`/attendance/${type}`, { method: 'POST', body: '{}' });
      setMsg(data.message || 'Berhasil');
      load();
    } catch (e) { setMsg(e.message); }
  };
  return (
    <Layout>
      <div className="card hero">
        <h1>Absensi Hari Ini</h1>
        <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p className="muted">Jadwal kamu: {user?.work_start || '08:00'} - {user?.work_end || '17:00'}</p>
        {msg && <div className="success">{msg}</div>}
        <div className="absenBox">
          <div><span>Masuk</span><b>{today?.check_in || '--:--:--'}</b></div>
          <div><span>Pulang</span><b>{today?.check_out || '--:--:--'}</b></div>
          <div><span>Status</span><b>{today?.status || '-'}</b></div>
        </div>
        <div className="actions">
          <button onClick={() => act('check-in')} disabled={!!today?.check_in}>Absen Masuk</button>
          <button className="secondary" onClick={() => act('check-out')} disabled={!today?.check_in || !!today?.check_out}>Absen Pulang</button>
        </div>
      </div>
      <Table title="Riwayat Absensi Saya" rows={history} columns={[['date', 'Tanggal'], ['check_in', 'Masuk'], ['check_out', 'Pulang'], ['status', 'Status']]} />
    </Layout>
  );
}

function Karyawan() {
  const emptyForm = { name: '', email: '', password: 'user123', position: 'Karyawan', department: 'Umum', role: 'employee', work_start: '08:00', work_end: '17:00' };
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const load = () => request('/users').then(setUsers);
  useEffect(() => { load(); }, []);
  const reset = () => { setEditing(null); setForm(emptyForm); };
  const edit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', position: u.position || 'Karyawan', department: u.department || 'Umum', role: u.role || 'employee', work_start: u.work_start || '08:00', work_end: u.work_end || '17:00' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const save = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      if (editing) {
        await request('/users/' + editing.id, { method: 'PUT', body: JSON.stringify(form) });
        setMsg('Data karyawan berhasil diedit');
      } else {
        await request('/users', { method: 'POST', body: JSON.stringify(form) });
        setMsg('Karyawan berhasil ditambahkan');
      }
      reset(); load();
    } catch (err) { setMsg(err.message); }
  };
  const del = async (id) => {
    if (confirm('Hapus karyawan ini?')) { await request('/users/' + id, { method: 'DELETE' }); load(); }
  };
  const filtered = users.filter(u => `${u.name}${u.email}${u.department}${u.position}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Layout>
      <div className="split">
        <form className="card form" onSubmit={save}>
          <h3>{editing ? <Pencil size={18} /> : <Plus size={18} />} {editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>
          {msg && <div className={msg.includes('berhasil') ? 'success' : 'alert'}>{msg}</div>}
          <label>Nama</label><input placeholder="Nama" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <label>Email</label><input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label>Password {editing && <small>(kosongkan jika tidak diubah)</small>}</label>
          <input placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <label>Jabatan</label><input placeholder="Jabatan" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
          <label>Departemen</label><input placeholder="Departemen" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          <div className="timeGrid">
            <div><label>Jam Masuk</label><input type="time" value={form.work_start} onChange={e => setForm({ ...form, work_start: e.target.value })} /></div>
            <div><label>Jam Pulang</label><input type="time" value={form.work_end} onChange={e => setForm({ ...form, work_end: e.target.value })} /></div>
          </div>
          <button>{editing ? 'Simpan Perubahan' : 'Tambah'}</button>
          {editing && <button type="button" className="secondary" onClick={reset}>Batal Edit</button>}
        </form>
        <div className="card">
          <div className="tableHead">
            <h3>Data Karyawan</h3>
            <div className="search"><Search size={16} /><input placeholder="Cari..." value={q} onChange={e => setQ(e.target.value)} /></div>
          </div>
          <table>
            <thead><tr><th>Nama</th><th>Email</th><th>Jabatan</th><th>Dept</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Aksi</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.email}</td><td>{u.position}</td><td>{u.department}</td>
                  <td>{u.work_start || '-'}</td><td>{u.work_end || '-'}</td>
                  <td>
                    <div className="rowActions">
                      <button className="iconBtn edit" onClick={() => edit(u)}><Pencil size={16} /></button>
                      {u.role !== 'admin' && <button className="iconBtn" onClick={() => del(u.id)}><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function Laporan() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { request('/attendance/all').then(setRows); }, []);
  const filtered = rows.filter(r => `${r.name}${r.date}${r.department}${r.status}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Layout>
      <div className="card">
        <div className="tableHead">
          <h3>Laporan Absensi</h3>
          <div className="search"><Search size={16} /><input placeholder="Cari nama/tanggal/dept/status..." value={q} onChange={e => setQ(e.target.value)} /></div>
        </div>
        <table>
          <thead><tr><th>Tanggal</th><th>Nama</th><th>Departemen</th><th>Jadwal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>{r.date}</td><td>{r.name}</td><td>{r.department}</td>
                <td>{r.work_start || '-'} - {r.work_end || '-'}</td>
                <td>{r.check_in}</td><td>{r.check_out || '-'}</td>
                <td><span className="badge">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

function Table({ title, rows, columns }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <table>
        <thead><tr>{columns.map(c => <th key={c[0]}>{c[1]}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{columns.map(c => <td key={c[0]}>{r[c[0]] || '-'}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────
   APP ROUTER
───────────────────────────────────────── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/absensi" element={<Protected><Absensi /></Protected>} />
        <Route path="/karyawan" element={<Protected><AdminOnly><Karyawan /></AdminOnly></Protected>} />
        <Route path="/laporan" element={<Protected><AdminOnly><Laporan /></AdminOnly></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
