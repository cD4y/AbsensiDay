import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Clock, Users, LayoutDashboard, CalendarDays, LogOut, Search, Plus, Trash2, CheckCircle2, Pencil } from 'lucide-react';
import './style.css';

const API = 'http://localhost:5000/api';
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

function Layout({ children }) {
  const nav = useNavigate();
  const user = getUser();
  const logout = () => { localStorage.clear(); nav('/login'); };
  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo">A</div><div><b>AbsensiPro</b><span>Employee System</span></div></div>
      <nav>
        <Link to="/"><LayoutDashboard size={18}/> Dashboard</Link>
        <Link to="/absensi"><Clock size={18}/> Absensi Saya</Link>
        {user?.role==='admin' && <><Link to="/karyawan"><Users size={18}/> Karyawan</Link><Link to="/laporan"><CalendarDays size={18}/> Laporan</Link></>}
      </nav>
      <button className="logout" onClick={logout}><LogOut size={18}/> Keluar</button>
    </aside>
    <main className="main">
      <header className="topbar"><div><h2>Website Absensi Karyawan</h2><p>Selamat datang, {user?.name}</p></div><div className="pill">{user?.role === 'admin' ? 'Admin' : 'Karyawan'}</div></header>
      {children}
    </main>
  </div>
}

function StatCard({ title, value, icon }) { return <div className="card stat"><div><p>{title}</p><h2>{value}</h2></div><div className="statIcon">{icon}</div></div> }

function Login() {
  const nav = useNavigate();
  const [email,setEmail]=useState('admin@absensi.com');
  const [password,setPassword]=useState('admin123');
  const [err,setErr]=useState('');
  const submit = async e => {
    e.preventDefault();
    setErr('');
    try {
      const data = await request('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
      localStorage.setItem('token',data.token);
      localStorage.setItem('user',JSON.stringify(data.user));
      nav('/');
    } catch(ex){ setErr(ex.message); }
  };
  return <div className="loginPage"><form className="loginCard" onSubmit={submit}><div className="loginLogo">AbsensiPro</div><h1>Login</h1><p>Masuk sebagai admin atau karyawan.</p>{err && <div className="alert">{err}</div>}<label>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} /><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /><button>Masuk</button><small>Admin: admin@absensi.com / admin123<br/>User: budi@absensi.com / user123</small></form></div>
}

function Dashboard(){
  const [stats,setStats]=useState(null);
  const user=getUser();
  useEffect(()=>{ if(user?.role==='admin') request('/stats').then(setStats).catch(()=>{}); },[]);
  return <Layout><section className="grid3">{user?.role==='admin'?<><StatCard title="Total Karyawan" value={stats?.totalEmployees??'-'} icon={<Users/>}/><StatCard title="Hadir Hari Ini" value={stats?.todayPresent??'-'} icon={<CheckCircle2/>}/><StatCard title="Terlambat Hari Ini" value={stats?.lateToday??'-'} icon={<Clock/>}/></>:<><StatCard title="Status Akun" value="Aktif" icon={<CheckCircle2/>}/><StatCard title="Jabatan" value={user?.position || 'Karyawan'} icon={<Users/>}/><StatCard title="Jadwal" value={`${user?.work_start || '08:00'} - ${user?.work_end || '17:00'}`} icon={<CalendarDays/>}/></>}</section><div className="card"><h3>Ringkasan</h3><p>Admin dapat mengatur jam masuk dan jam pulang berbeda untuk setiap karyawan. Status absensi akan otomatis menjadi Hadir, Terlambat, atau Pulang Cepat sesuai jadwal masing-masing.</p></div></Layout>
}

function Absensi(){
  const [today,setToday]=useState(null);
  const [history,setHistory]=useState([]);
  const [msg,setMsg]=useState('');
  const user=getUser();
  const load=()=>{request('/attendance/today').then(setToday); request('/attendance/my-history').then(setHistory); };
  useEffect(()=>{load();}, []);
  const act=async(type)=>{setMsg(''); try{const data=await request(`/attendance/${type}`,{method:'POST',body:'{}'}); setMsg(data.message || 'Berhasil'); load();}catch(e){setMsg(e.message)}};
  return <Layout><div className="card hero"><h1>Absensi Hari Ini</h1><p>{new Date().toLocaleDateString('id-ID',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p><p className="muted">Jadwal kamu: {user?.work_start || '08:00'} - {user?.work_end || '17:00'}</p>{msg&&<div className="success">{msg}</div>}<div className="absenBox"><div><span>Masuk</span><b>{today?.check_in || '--:--:--'}</b></div><div><span>Pulang</span><b>{today?.check_out || '--:--:--'}</b></div><div><span>Status</span><b>{today?.status || '-'}</b></div></div><div className="actions"><button onClick={()=>act('check-in')} disabled={!!today?.check_in}>Absen Masuk</button><button className="secondary" onClick={()=>act('check-out')} disabled={!today?.check_in || !!today?.check_out}>Absen Pulang</button></div></div><Table title="Riwayat Absensi Saya" rows={history} columns={[["date","Tanggal"],["check_in","Masuk"],["check_out","Pulang"],["status","Status"]]} /></Layout>
}

function Karyawan(){
  const emptyForm={name:'',email:'',password:'user123',position:'Karyawan',department:'Umum',role:'employee',work_start:'08:00',work_end:'17:00'};
  const [users,setUsers]=useState([]);
  const [q,setQ]=useState('');
  const [form,setForm]=useState(emptyForm);
  const [editing,setEditing]=useState(null);
  const [msg,setMsg]=useState('');
  const load=()=>request('/users').then(setUsers);
  useEffect(()=>{load();}, []);
  const reset=()=>{setEditing(null); setForm(emptyForm);};
  const edit=(u)=>{setEditing(u); setForm({name:u.name,email:u.email,password:'',position:u.position||'Karyawan',department:u.department||'Umum',role:u.role||'employee',work_start:u.work_start||'08:00',work_end:u.work_end||'17:00'}); window.scrollTo({top:0,behavior:'smooth'});};
  const save=async(e)=>{e.preventDefault(); setMsg(''); try{ if(editing){ await request('/users/'+editing.id,{method:'PUT',body:JSON.stringify(form)}); setMsg('Data karyawan berhasil diedit'); } else { await request('/users',{method:'POST',body:JSON.stringify(form)}); setMsg('Karyawan berhasil ditambahkan'); } reset(); load(); }catch(err){setMsg(err.message);} };
  const del=async(id)=>{ if(confirm('Hapus karyawan ini?')){ await request('/users/'+id,{method:'DELETE'}); load(); }};
  const filtered=users.filter(u=>`${u.name}${u.email}${u.department}${u.position}`.toLowerCase().includes(q.toLowerCase()));
  return <Layout><div className="split"><form className="card form" onSubmit={save}><h3>{editing ? <Pencil size={18}/> : <Plus size={18}/>} {editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</h3>{msg&&<div className={msg.includes('berhasil')?'success':'alert'}>{msg}</div>}<label>Nama</label><input placeholder="Nama" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><label>Email</label><input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><label>Password {editing && <small>(kosongkan jika tidak diubah)</small>}</label><input placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><label>Jabatan</label><input placeholder="Jabatan" value={form.position} onChange={e=>setForm({...form,position:e.target.value})}/><label>Departemen</label><input placeholder="Departemen" value={form.department} onChange={e=>setForm({...form,department:e.target.value})}/><div className="timeGrid"><div><label>Jam Masuk</label><input type="time" value={form.work_start} onChange={e=>setForm({...form,work_start:e.target.value})}/></div><div><label>Jam Pulang</label><input type="time" value={form.work_end} onChange={e=>setForm({...form,work_end:e.target.value})}/></div></div><button>{editing ? 'Simpan Perubahan' : 'Tambah'}</button>{editing&&<button type="button" className="secondary" onClick={reset}>Batal Edit</button>}</form><div className="card"><div className="tableHead"><h3>Data Karyawan</h3><div className="search"><Search size={16}/><input placeholder="Cari..." value={q} onChange={e=>setQ(e.target.value)}/></div></div><table><thead><tr><th>Nama</th><th>Email</th><th>Jabatan</th><th>Dept</th><th>Jam Masuk</th><th>Jam Pulang</th><th>Aksi</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.position}</td><td>{u.department}</td><td>{u.work_start || '-'}</td><td>{u.work_end || '-'}</td><td><div className="rowActions"><button className="iconBtn edit" onClick={()=>edit(u)}><Pencil size={16}/></button>{u.role!=='admin'&&<button className="iconBtn" onClick={()=>del(u.id)}><Trash2 size={16}/></button>}</div></td></tr>)}</tbody></table></div></div></Layout>
}

function Laporan(){
  const [rows,setRows]=useState([]);
  const [q,setQ]=useState('');
  useEffect(()=>{request('/attendance/all').then(setRows)},[]);
  const filtered=rows.filter(r=>`${r.name}${r.date}${r.department}${r.status}`.toLowerCase().includes(q.toLowerCase()));
  return <Layout><div className="card"><div className="tableHead"><h3>Laporan Absensi</h3><div className="search"><Search size={16}/><input placeholder="Cari nama/tanggal/dept/status..." value={q} onChange={e=>setQ(e.target.value)}/></div></div><table><thead><tr><th>Tanggal</th><th>Nama</th><th>Departemen</th><th>Jadwal</th><th>Masuk</th><th>Pulang</th><th>Status</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td>{r.date}</td><td>{r.name}</td><td>{r.department}</td><td>{r.work_start || '-'} - {r.work_end || '-'}</td><td>{r.check_in}</td><td>{r.check_out || '-'}</td><td><span className="badge">{r.status}</span></td></tr>)}</tbody></table></div></Layout>
}

function Table({title,rows,columns}){ return <div className="card"><h3>{title}</h3><table><thead><tr>{columns.map(c=><th key={c[0]}>{c[1]}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{columns.map(c=><td key={c[0]}>{r[c[0]] || '-'}</td>)}</tr>)}</tbody></table></div> }
function App(){ return <BrowserRouter><Routes><Route path="/login" element={<Login/>}/><Route path="/" element={<Protected><Dashboard/></Protected>}/><Route path="/absensi" element={<Protected><Absensi/></Protected>}/><Route path="/karyawan" element={<Protected><AdminOnly><Karyawan/></AdminOnly></Protected>}/><Route path="/laporan" element={<Protected><AdminOnly><Laporan/></AdminOnly></Protected>}/></Routes></BrowserRouter> }

createRoot(document.getElementById('root')).render(<App/>);
