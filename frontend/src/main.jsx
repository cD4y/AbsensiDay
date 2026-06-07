import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter, Routes, Route, Link, Navigate, useNavigate, useLocation
} from 'react-router-dom';
import {
  Clock, Users, LayoutDashboard, CalendarDays, LogOut, Search,
  Plus, Trash2, CheckCircle2, Pencil, TrendingUp, AlertCircle,
  LogIn, LogOut as LogOutIcon, FileText, Download, BarChart2,
  ShieldOff, Upload
} from 'lucide-react';
import './style.css';

/* ─── HELPERS ─── */
const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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

function initials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function statusBadge(status) {
  const cls = {
    'Hadir': 'bg', 'Terlambat': 'by', 'Pulang Cepat': 'by',
    'Terlambat & Pulang Cepat': 'by', 'Tidak Hadir': 'br',
    'Izin': 'bb', 'Sakit': 'bb', 'Cuti': 'bb',
  };
  return <span className={`badge ${cls[status] || 'bgr'}`}>{status || '—'}</span>;
}

/* ─── ROUTE GUARDS ─── */
function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}
function AdminOnly({ children }) {
  if (getUser()?.role !== 'admin') return <AccessDenied />;
  return children;
}

/* ─── ACCESS DENIED ─── */
function AccessDenied() {
  const nav = useNavigate();
  return (
    <div className="access-denied">
      <div className="denied-icon"><ShieldOff size={30} /></div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>Akses ditolak</h2>
      <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, maxWidth: 280, marginBottom: 20 }}>
        Halaman ini hanya bisa diakses oleh admin.
      </p>
      <button className="btn btn-primary" onClick={() => nav('/absensi')}>
        <LogIn size={14} /> Ke halaman absensi
      </button>
      <p style={{ fontSize: 12, color: '#1e293b', marginTop: 16 }}>
        Login sebagai: <strong style={{ color: '#94a3b8' }}>{getUser()?.name}</strong>
      </p>
    </div>
  );
}

/* ─── SKELETON ─── */
function SkeletonStats() {
  return (
    <div className="grid3">
      {[1, 2, 3].map(i => (
        <div className="stat-card" key={i}>
          <div style={{ flex: 1 }}>
            <div className="skel" style={{ height: 11, width: '60%', marginBottom: 10 }} />
            <div className="skel" style={{ height: 28, width: '40%' }} />
          </div>
          <div className="skel" style={{ width: 42, height: 42, borderRadius: 13 }} />
        </div>
      ))}
    </div>
  );
}
function SkeletonRows({ cols = 4, rows = 4 }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{Array(cols).fill(0).map((_, i) => (
            <th key={i}><div className="skel" style={{ height: 10, width: 60 }} /></th>
          ))}</tr>
        </thead>
        <tbody>
          {Array(rows).fill(0).map((_, i) => (
            <tr key={i}>{Array(cols).fill(0).map((_, j) => (
              <td key={j}><div className="skel" style={{ height: 10, width: j === 0 ? 120 : 70 }} /></td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── LAYOUT ─── */
function Layout({ children, title, subtitle }) {
  const nav  = useNavigate();
  const loc  = useLocation();
  const user = getUser();
  const logout = () => { localStorage.clear(); nav('/login'); };

  const links = [
    { to: '/',            icon: <LayoutDashboard size={15} />, label: 'Dashboard' },
    { to: '/absensi',     icon: <Clock size={15} />,           label: 'Absensi Saya' },
    ...(user?.role === 'admin' ? [
      { to: '/karyawan',  icon: <Users size={15} />,        label: 'Karyawan' },
      { to: '/laporan',   icon: <CalendarDays size={15} />, label: 'Laporan' },
      { to: '/izin',      icon: <FileText size={15} />,     label: 'Izin & Sakit' },
    ] : [
      { to: '/izin-ajukan', icon: <FileText size={15} />,   label: 'Izin & Sakit' },
    ]),
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">A</div>
          <div className="brand-text"><b>AbsensiDay</b><span>Employee System</span></div>
        </div>
        <div className="sidebar-label">Menu</div>
        <nav>
          {links.map(l => (
            <Link key={l.to} to={l.to} className={loc.pathname === l.to ? 'active' : ''}>
              {l.icon} {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-label">Akun</div>
        <div className="user-info-box">
          <div className="user-info-name">{user?.name}</div>
          <div className="user-info-role">{user?.role === 'admin' ? 'Administrator' : user?.position || 'Karyawan'}</div>
        </div>
        <button className="logout" onClick={logout}><LogOut size={14} /> Keluar</button>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="user-badge">
            <div className="user-avatar">{initials(user?.name)}</div>
            <div>
              <div className="uname">{user?.name}</div>
              <div className="urole">{user?.role === 'admin' ? 'Admin' : 'Karyawan'}</div>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

/* ─── LOGIN ─── */
function Login() {
  const nav = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');

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
        <div className="login-left">
          <div>
            <div className="login-brand">
              <div className="login-brand-icon"><i className="ti ti-clock-check" /></div>
              <span className="login-brand-name">AbsensiDay</span>
            </div>
            <p className="login-tagline">Sistem absensi karyawan yang mudah, cepat, dan akurat untuk tim kamu.</p>
            <div className="login-feats">
              {[
                { icon: 'ti-fingerprint',   title: 'Absen real-time',  desc: 'Catat kehadiran dari browser' },
                { icon: 'ti-chart-bar',     title: 'Laporan otomatis', desc: 'Rekap hadir & terlambat' },
                { icon: 'ti-shield-check',  title: 'Manajemen akses',  desc: 'Peran admin & karyawan' },
              ].map(f => (
                <div className="login-feat" key={f.title}>
                  <div className="feat-icon"><i className={`ti ${f.icon}`} /></div>
                  <div>
                    <div className="feat-title">{f.title}</div>
                    <div className="feat-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="login-footer">© 2025 AbsensiDay · v2.0</div>
        </div>
        <div className="login-right">
          <h2 className="login-title">Selamat datang kembali</h2>
          <p className="login-subtitle">Masuk ke akun kamu untuk melanjutkan</p>
          {err && (
            <div className="login-error">
              <AlertCircle size={14} style={{ flexShrink: 0 }} /> {err}
            </div>
          )}
          <form onSubmit={submit} noValidate>
            <div className="login-field">
              <label className="login-label">Email</label>
              <div className="login-input-wrap">
                <i className="ti ti-mail login-input-icon" />
                <input className="login-input" type="email" placeholder="contoh@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-input-wrap">
                <i className="ti ti-lock login-input-icon" />
                <input className="login-input" style={{ paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                  <i className={`ti ${showPass ? 'ti-eye-off' : 'ti-eye'}`} />
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: 22 }}>
              <span className="forgot">Lupa password?</span>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="login-spinner" /> : <><LogIn size={15} /> Masuk</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function Dashboard() {
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === 'admin') {
          const [s, rows] = await Promise.all([request('/stats'), request('/attendance/all')]);
          setStats(s);
          setRecent(rows.slice(0, 6));
        } else {
          const rows = await request('/attendance/my-history');
          setRecent(rows.slice(0, 6));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const barData = [
    { label: 'Sen', val: 18 }, { label: 'Sel', val: 20 },
    { label: 'Rab', val: 17 }, { label: 'Kam', val: 22 }, { label: 'Jum', val: 19 },
  ];
  const maxBar = Math.max(...barData.map(b => b.val));

  return (
    <Layout
      title={`Halo, ${user?.name?.split(' ')[0]} 👋`}
      subtitle={new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    >
      {loading ? <SkeletonStats /> : (
        <div className="grid3">
          {user?.role === 'admin' ? [
            { label: 'Total Karyawan', val: stats?.totalEmployees, sub: 'Terdaftar',   icon: 'si-blue',   ti: 'ti-users' },
            { label: 'Hadir Hari Ini', val: stats?.todayPresent,   sub: 'Tepat waktu', icon: 'si-green',  ti: 'ti-circle-check' },
            { label: 'Terlambat',      val: stats?.lateToday,      sub: 'Hari ini',    icon: 'si-yellow', ti: 'ti-clock-exclamation' },
          ] : [
            { label: 'Jabatan',    val: user?.position || 'Karyawan', sub: '', icon: 'si-blue',   ti: 'ti-id-badge' },
            { label: 'Jam Masuk',  val: user?.work_start || '08:00',  sub: '', icon: 'si-green',  ti: 'ti-login' },
            { label: 'Jam Pulang', val: user?.work_end   || '17:00',  sub: '', icon: 'si-yellow', ti: 'ti-logout' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={user?.role !== 'admin' ? { fontSize: 20, marginTop: 4 } : {}}>{s.val ?? '—'}</div>
                {s.sub && <div className="stat-sub">{s.sub}</div>}
              </div>
              <div className={`stat-icon ${s.icon}`}><i className={`ti ${s.ti}`} /></div>
            </div>
          ))}
        </div>
      )}

      {user?.role === 'admin' && !loading && (
        <div className="grid2">
          <div className="card">
            <div className="card-title"><BarChart2 size={16} style={{ color: '#fbbf24' }} /> Kehadiran minggu ini</div>
            <div className="bar-wrap">
              {barData.map(b => (
                <div className="bar-col" key={b.label}>
                  <div className="bar-val">{b.val}</div>
                  <div className="bar" style={{ height: `${(b.val / maxBar) * 80}px` }} />
                  <div className="bar-label">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-title"><TrendingUp size={16} style={{ color: '#fbbf24' }} /> Paling sering terlambat</div>
            {[
              { name: 'Sari Rahayu', count: 8, pct: 80 },
              { name: 'Andi Basuki', count: 5, pct: 50 },
              { name: 'Dewi Wulan',  count: 3, pct: 30 },
            ].map(r => (
              <div className="progress-row" key={r.name}>
                <div style={{ width: 110, fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>{r.name}</div>
                <div className="progress-bg"><div className="progress-fill" style={{ width: `${r.pct}%` }} /></div>
                <div style={{ fontSize: 12, color: '#475569', width: 30 }}>{r.count}x</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-hd">
          <h3 className="card-title" style={{ margin: 0 }}>
            <TrendingUp size={16} style={{ color: '#fbbf24' }} />
            {user?.role === 'admin' ? 'Absensi terbaru' : 'Riwayat absensi'}
          </h3>
        </div>
        {loading ? <SkeletonRows cols={user?.role === 'admin' ? 5 : 4} /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {user?.role === 'admin' && <th>Karyawan</th>}
                  <th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '28px 0', color: '#1e293b' }}>Belum ada data</td></tr>
                )}
                {recent.map((r, i) => (
                  <tr key={i}>
                    {user?.role === 'admin' && (
                      <td>
                        <div className="t-user">
                          <div className="t-av">{initials(r.name)}</div>
                          <span className="t-name">{r.name}</span>
                        </div>
                      </td>
                    )}
                    <td>{r.date}</td><td>{r.check_in || '—'}</td>
                    <td>{r.check_out || '—'}</td><td>{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* ─── ABSENSI ─── */
function Absensi() {
  const [today,   setToday]   = useState(null);
  const [history, setHistory] = useState([]);
  const [msg,     setMsg]     = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState(new Date());
  const user = getUser();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = async () => {
    try {
      const [t, h] = await Promise.all([request('/attendance/today'), request('/attendance/my-history')]);
      setToday(t); setHistory(h);
    } catch (e) {
      setMsg({ text: 'Gagal memuat data. Periksa koneksi kamu.', type: 'error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const act = async (type) => {
    setMsg({ text: '', type: '' });
    try {
      const data = await request(`/attendance/${type}`, { method: 'POST', body: '{}' });
      setMsg({
        text: type === 'check-in'
          ? `Absen masuk berhasil! Tercatat pukul ${data.check_in}.`
          : (data.message || 'Absen pulang berhasil!'),
        type: 'success'
      });
      load();
    } catch (e) { setMsg({ text: e.message, type: 'error' }); }
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
            <div style={{ fontSize: 13, color: '#334155', marginBottom: 8 }}>
              Jadwal: <strong style={{ color: '#94a3b8' }}>{user?.work_start || '08:00'} – {user?.work_end || '17:00'}</strong>
            </div>
            <div style={{ marginBottom: 14 }}>
              {today?.status ? statusBadge(today.status) : <span className="badge bgr">Belum absen</span>}
            </div>
            {msg.text && (
              <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {msg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {msg.text}
              </div>
            )}
            <div className="absen-actions">
              <button className="btn btn-checkin" onClick={() => act('check-in')} disabled={!!today?.check_in}>
                <LogIn size={15} /> Absen Masuk
              </button>
              <button className="btn btn-checkout" onClick={() => act('check-out')} disabled={!today?.check_in || !!today?.check_out}>
                <LogOutIcon size={15} /> Absen Pulang
              </button>
            </div>
          </div>
          <div>
            <div className="absen-clock">{clockStr}</div>
            <div className="absen-date">Waktu sekarang</div>
          </div>
        </div>
        <div className="absen-grid">
          <div className="absen-box">
            <div className="absen-box-label">Absen masuk</div>
            <div className="absen-box-val" style={{ color: today?.check_in ? '#4ade80' : '#1e293b' }}>{today?.check_in || '—'}</div>
          </div>
          <div className="absen-box">
            <div className="absen-box-label">Absen pulang</div>
            <div className="absen-box-val" style={{ color: today?.check_out ? '#60a5fa' : '#1e293b' }}>{today?.check_out || '—'}</div>
          </div>
          <div className="absen-box">
            <div className="absen-box-label">Status hari ini</div>
            <div style={{ marginTop: 6 }}>{statusBadge(today?.status)}</div>
          </div>
        </div>
      </div>
      <div className="card">
        <h3 className="card-title"><CalendarDays size={16} style={{ color: '#fbbf24' }} /> Riwayat absensi</h3>
        {loading ? <SkeletonRows /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr></thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '28px 0', color: '#1e293b' }}>Belum ada riwayat</td></tr>
                )}
                {history.map((r, i) => (
                  <tr key={i}><td>{r.date}</td><td>{r.check_in||'—'}</td><td>{r.check_out||'—'}</td><td>{statusBadge(r.status)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

/* ─── KARYAWAN ─── */
const emptyForm = { name:'', email:'', password:'user123', position:'Karyawan', department:'Umum', role:'employee', work_start:'08:00', work_end:'17:00' };

function Karyawan() {
  const [users,   setUsers]   = useState([]);
  const [q,       setQ]       = useState('');
  const [form,    setForm]    = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [msg,     setMsg]     = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setUsers(await request('/users')); }
    catch (e) { setMsg({ text: e.message, type: 'error' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setEditing(null); setForm(emptyForm); setMsg({ text:'', type:'' }); };
  const edit = (u) => {
    setEditing(u);
    setForm({ name:u.name, email:u.email, password:'', position:u.position||'', department:u.department||'', role:u.role||'employee', work_start:u.work_start||'08:00', work_end:u.work_end||'17:00' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const save = async (e) => {
    e.preventDefault(); setMsg({ text:'', type:'' });
    try {
      if (editing) {
        await request('/users/' + editing.id, { method:'PUT', body:JSON.stringify(form) });
        setMsg({ text:'Data karyawan berhasil diperbarui.', type:'success' });
      } else {
        await request('/users', { method:'POST', body:JSON.stringify(form) });
        setMsg({ text:'Karyawan baru berhasil ditambahkan.', type:'success' });
      }
      reset(); load();
    } catch (err) { setMsg({ text:err.message, type:'error' }); }
  };
  const del = async (id) => {
    if (!confirm('Hapus karyawan ini?')) return;
    try { await request('/users/' + id, { method:'DELETE' }); load(); }
    catch (e) { setMsg({ text:e.message, type:'error' }); }
  };
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const filtered = users.filter(u => `${u.name}${u.email}${u.department}${u.position}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Layout title="Manajemen Karyawan" subtitle="Kelola data dan jadwal karyawan">
      <div className="split">
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 className="card-title">
            {editing ? <Pencil size={15} style={{ color:'#fbbf24' }} /> : <Plus size={15} style={{ color:'#fbbf24' }} />}
            {editing ? 'Edit Karyawan' : 'Tambah Karyawan'}
          </h3>
          {msg.text && (
            <div className={`alert ${msg.type==='success'?'alert-success':'alert-error'}`}>
              {msg.type==='success'?<CheckCircle2 size={13}/>:<AlertCircle size={13}/>} {msg.text}
            </div>
          )}
          <form onSubmit={save}>
            {[
              { label:'Nama lengkap', key:'name',       type:'text',     ph:'Nama karyawan' },
              { label:'Email',        key:'email',      type:'email',    ph:'email@perusahaan.com' },
              { label:`Password${editing?' (kosongkan jika tidak diubah)':''}`, key:'password', type:'password', ph:'••••••••' },
              { label:'Jabatan',      key:'position',   type:'text',     ph:'Staff, Manager, dll' },
              { label:'Departemen',   key:'department', type:'text',     ph:'HRD, IT, dll' },
            ].map(field => (
              <div className="form-group" key={field.key}>
                <label className="form-label">{field.label}</label>
                <input type={field.type} placeholder={field.ph} value={form[field.key]} onChange={e => f(field.key, e.target.value)} />
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
                <label className="form-label">Jam masuk</label>
                <input type="time" value={form.work_start} onChange={e => f('work_start', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Jam pulang</label>
                <input type="time" value={form.work_end} onChange={e => f('work_end', e.target.value)} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" className="btn btn-primary" style={{ flex:1 }}>
                {editing ? <><CheckCircle2 size={13}/> Simpan</> : <><Plus size={13}/> Tambah</>}
              </button>
              {editing && <button type="button" className="btn btn-sec" onClick={reset}>Batal</button>}
            </div>
          </form>
        </div>

        <div className="card" style={{ marginBottom:0 }}>
          <div className="section-hd">
            <h3 className="card-title" style={{ margin:0 }}>
              <Users size={15} style={{ color:'#fbbf24' }} /> Data karyawan
              <span className="badge bb" style={{ marginLeft:6 }}>{filtered.length}</span>
            </h3>
            <div className="search-bar">
              <Search size={13} />
              <input placeholder="Cari nama, email..." value={q} onChange={e => setQ(e.target.value)} />
            </div>
          </div>
          {loading ? <SkeletonRows cols={5} /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Karyawan</th><th>Jabatan</th><th>Jadwal</th><th>Role</th><th>Aksi</th></tr></thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign:'center', padding:'28px 0', color:'#1e293b' }}>Tidak ada karyawan</td></tr>
                  )}
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="t-user">
                          <div className="t-av">{initials(u.name)}</div>
                          <div>
                            <div className="t-name">{u.name}</div>
                            <div className="t-sub">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ color:'#e2e8f0', fontSize:13 }}>{u.position||'—'}</div>
                        <div className="t-sub">{u.department||'—'}</div>
                      </td>
                      <td style={{ fontSize:12 }}>{u.work_start||'08:00'} – {u.work_end||'17:00'}</td>
                      <td><span className={`badge ${u.role==='admin'?'by':'bb'}`}>{u.role==='admin'?'Admin':'Karyawan'}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="btn-icon edit" onClick={() => edit(u)}><Pencil size={13}/></button>
                          {u.role !== 'admin' && <button className="btn-icon del" onClick={() => del(u.id)}><Trash2 size={13}/></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

/* ─── LAPORAN + EXPORT ─── */
function Laporan() {
  const [rows,     setRows]     = useState([]);
  const [q,        setQ]        = useState('');
  const [filter,   setFilter]   = useState('Semua');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    request('/attendance/all').then(setRows).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statuses = ['Semua','Hadir','Terlambat','Pulang Cepat','Tidak Hadir'];
  const filtered = rows.filter(r => {
    const matchQ  = `${r.name}${r.date}${r.department}${r.status}`.toLowerCase().includes(q.toLowerCase());
    const matchF  = filter === 'Semua' || r.status === filter;
    const matchD1 = !dateFrom || r.date >= dateFrom;
    const matchD2 = !dateTo   || r.date <= dateTo;
    return matchQ && matchF && matchD1 && matchD2;
  });

  const exportCSV = () => {
    const header = 'Karyawan,Tanggal,Departemen,Jadwal,Masuk,Pulang,Status\n';
    const body   = filtered.map(r =>
      `${r.name},${r.date},${r.department},${r.work_start||'08:00'}-${r.work_end||'17:00'},${r.check_in||'-'},${r.check_out||'-'},${r.status||'-'}`
    ).join('\n');
    const blob = new Blob([header + body], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'laporan-absensi.csv'; a.click();
  };

  const counts = {
    hadir:      rows.filter(r => r.status === 'Hadir').length,
    terlambat:  rows.filter(r => r.status?.includes('Terlambat')).length,
    tidakHadir: rows.filter(r => r.status === 'Tidak Hadir').length,
  };

  return (
    <Layout title="Laporan Absensi" subtitle="Rekap kehadiran seluruh karyawan">
      {loading ? <SkeletonStats /> : (
        <div className="grid3">
          {[
            { label:'Total hadir',  val:counts.hadir,      icon:'si-green',  ti:'ti-circle-check' },
            { label:'Terlambat',    val:counts.terlambat,  icon:'si-yellow', ti:'ti-clock-exclamation' },
            { label:'Tidak hadir',  val:counts.tidakHadir, icon:'si-red',    ti:'ti-user-x' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.val}</div>
              </div>
              <div className={`stat-icon ${s.icon}`}><i className={`ti ${s.ti}`} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div>
            <label className="form-label">Dari</label>
            <input type="date" style={{ width:140 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Sampai</label>
            <input type="date" style={{ width:140 }} value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div className="search-bar" style={{ flex:1 }}>
            <Search size={13} />
            <input placeholder="Cari nama, status..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button className="btn btn-success btn-sm" onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
        </div>
        <div className="filter-row">
          {statuses.map(s => (
            <div key={s} className={`chip ${filter===s?'on':''}`} onClick={() => setFilter(s)}>{s}</div>
          ))}
        </div>
        {loading ? <SkeletonRows cols={7} rows={5} /> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Karyawan</th><th>Tanggal</th><th>Dept</th><th>Jadwal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:'28px 0', color:'#1e293b' }}>Tidak ada data</td></tr>
                )}
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <div className="t-user">
                        <div className="t-av">{initials(r.name)}</div>
                        <div>
                          <div className="t-name">{r.name}</div>
                          <div className="t-sub">{r.department}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.date}</td>
                    <td>{r.department}</td>
                    <td style={{ fontSize:12 }}>{r.work_start||'08:00'} – {r.work_end||'17:00'}</td>
                    <td>{r.check_in||'—'}</td>
                    <td>{r.check_out||'—'}</td>
                    <td>{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ fontSize:11, color:'#1e293b', marginTop:10 }}>
          {filtered.length} dari {rows.length} data ditampilkan
        </div>
      </div>
    </Layout>
  );
}

/* ─── IZIN ADMIN ─── */
function IzinAdmin() {
  const [msg, setMsg] = useState({ text:'', type:'' });
  const statusCls = { Menunggu:'by', Disetujui:'bg', Ditolak:'br' };
  const dummy = [
    { id:1, name:'Budi Santoso', type:'Izin',  date:'09/06/2025', reason:'Keperluan keluarga',     status:'Menunggu' },
    { id:2, name:'Sari Rahayu',  type:'Sakit', date:'07/06/2025', reason:'Lampiran: surat dokter', status:'Disetujui' },
    { id:3, name:'Rizky Hadi',   type:'Cuti',  date:'05/06/2025', reason:'Cuti tahunan',           status:'Ditolak' },
  ];
  return (
    <Layout title="Izin & Sakit" subtitle="Kelola pengajuan izin dan sakit karyawan">
      {msg.text && (
        <div className={`alert ${msg.type==='success'?'alert-success':'alert-error'}`}>
          {msg.type==='success'?<CheckCircle2 size={13}/>:<AlertCircle size={13}/>} {msg.text}
        </div>
      )}
      <div className="card">
        <h3 className="card-title"><FileText size={15} style={{ color:'#fbbf24' }} /> Daftar pengajuan</h3>
        {dummy.map(item => (
          <div className="izin-item" key={item.id}>
            <div className="izin-left">
              <div className="t-av">{initials(item.name)}</div>
              <div>
                <div className="t-name">{item.name}</div>
                <div className="t-sub">{item.type} · {item.date}</div>
                <div style={{ fontSize:11, color:'#1e293b', marginTop:2 }}>{item.reason}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
              <span className={`badge ${statusCls[item.status]||'bgr'}`}>{item.status}</span>
              {item.status === 'Menunggu' && (
                <div style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-success btn-sm" onClick={() => setMsg({ text:`Pengajuan #${item.id} disetujui.`, type:'success' })}>
                    <CheckCircle2 size={12} /> Setuju
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setMsg({ text:`Pengajuan #${item.id} ditolak.`, type:'error' })}>
                    <AlertCircle size={12} /> Tolak
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

/* ─── IZIN KARYAWAN ─── */
function IzinAjukan() {
  const [form, setForm] = useState({ type:'Izin', date:'', reason:'' });
  const [msg,  setMsg]  = useState({ text:'', type:'' });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault(); setMsg({ text:'', type:'' });
    if (!form.date || !form.reason) {
      setMsg({ text:'Tanggal dan keterangan wajib diisi.', type:'error' }); return;
    }
    /* Uncomment saat endpoint /api/leaves/request sudah dibuat di backend:
    request('/leaves/request', { method:'POST', body:JSON.stringify(form) })
      .then(() => { setMsg({ text:'Pengajuan berhasil dikirim!', type:'success' }); setForm({ type:'Izin', date:'', reason:'' }); })
      .catch(e => setMsg({ text:e.message, type:'error' }));
    */
    setMsg({ text:'Pengajuan berhasil dikirim. Menunggu persetujuan admin.', type:'success' });
    setForm({ type:'Izin', date:'', reason:'' });
  };

  return (
    <Layout title="Ajukan Izin / Sakit" subtitle="Kirim permohonan izin atau sakit ke admin">
      <div style={{ maxWidth:480 }}>
        {msg.text && (
          <div className={`alert ${msg.type==='success'?'alert-success':'alert-error'}`}>
            {msg.type==='success'?<CheckCircle2 size={13}/>:<AlertCircle size={13}/>} {msg.text}
          </div>
        )}
        <div className="card">
          <h3 className="card-title"><FileText size={15} style={{ color:'#fbbf24' }} /> Form pengajuan</h3>
          <form onSubmit={submit}>
            <div className="form-group">
              <label className="form-label">Jenis</label>
              <select value={form.type} onChange={e => f('type', e.target.value)}>
                <option>Izin</option><option>Sakit</option><option>Cuti</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input type="date" value={form.date} onChange={e => f('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Keterangan</label>
              <textarea placeholder="Tulis alasan izin / sakit kamu..."
                value={form.reason} onChange={e => f('reason', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Lampiran (opsional)</label>
              <div className="upload-area">
                <i className="ti ti-upload" />
                Upload surat dokter atau bukti pendukung
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>
              <Upload size={14} /> Kirim pengajuan
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

/* ─── APP ROUTER ─── */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"       element={<Login />} />
        <Route path="/"            element={<Protected><Dashboard /></Protected>} />
        <Route path="/absensi"     element={<Protected><Absensi /></Protected>} />
        <Route path="/karyawan"    element={<Protected><AdminOnly><Karyawan /></AdminOnly></Protected>} />
        <Route path="/laporan"     element={<Protected><AdminOnly><Laporan /></AdminOnly></Protected>} />
        <Route path="/izin"        element={<Protected><AdminOnly><IzinAdmin /></AdminOnly></Protected>} />
        <Route path="/izin-ajukan" element={<Protected><IzinAjukan /></Protected>} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
