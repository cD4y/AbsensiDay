import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Sora:wght@400;600&display=swap');

  .login-root {
    display: flex;
    min-height: 100vh;
    background: #f0f4f8;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }

  .login-card {
    display: flex;
    width: 100%;
    max-width: 860px;
    min-height: 520px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 40px rgba(12, 68, 124, 0.10);
  }

  /* ── Left panel ── */
  .login-left {
    width: 300px;
    flex-shrink: 0;
    background: #0C447C;
    padding: 40px 32px;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .login-left::before {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: rgba(55, 138, 221, 0.18);
  }

  .login-left::after {
    content: '';
    position: absolute;
    bottom: -60px;
    left: -40px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 36px;
    position: relative;
    z-index: 1;
  }

  .brand-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .brand-name {
    font-family: 'Sora', sans-serif;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.3px;
  }

  .left-tagline {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.7;
    margin-bottom: 36px;
    position: relative;
    z-index: 1;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 18px;
    position: relative;
    z-index: 1;
  }

  .feat {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .feat-icon {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    color: #fff;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .feat-body strong {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 2px;
  }

  .feat-body span {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
  }

  .left-footer {
    margin-top: auto;
    padding-top: 28px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.28);
    position: relative;
    z-index: 1;
  }

  /* ── Right panel ── */
  .login-right {
    flex: 1;
    background: #fff;
    padding: 48px 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .form-head {
    margin-bottom: 32px;
  }

  .form-head h2 {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: #0a1628;
    margin-bottom: 6px;
    letter-spacing: -0.4px;
  }

  .form-head p {
    font-size: 13px;
    color: #6b7280;
  }

  .field {
    margin-bottom: 18px;
  }

  .field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 7px;
    letter-spacing: 0.2px;
  }

  .input-wrap {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: #9ca3af;
    pointer-events: none;
  }

  .input-wrap input {
    width: 100%;
    padding: 11px 40px 11px 38px;
    font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    background: #fafafa;
    color: #111827;
    outline: none;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }

  .input-wrap input:focus {
    border-color: #378ADD;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(55, 138, 221, 0.1);
  }

  .input-wrap input::placeholder {
    color: #d1d5db;
  }

  .eye-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    color: #9ca3af;
    padding: 0;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }

  .eye-btn:hover {
    color: #6b7280;
  }

  .form-footer-row {
    display: flex;
    justify-content: flex-end;
    margin-top: -8px;
    margin-bottom: 24px;
  }

  .forgot-link {
    font-size: 12px;
    color: #378ADD;
    cursor: pointer;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
  }

  .forgot-link:hover {
    color: #185FA5;
  }

  .btn-login {
    width: 100%;
    padding: 13px;
    background: #0C447C;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s, transform 0.1s;
    letter-spacing: 0.1px;
  }

  .btn-login:hover {
    background: #185FA5;
  }

  .btn-login:active {
    transform: scale(0.985);
  }

  .btn-login:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }

  .btn-login .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-msg {
    display: flex;
    align-items: center;
    gap: 7px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #b91c1c;
    margin-top: 14px;
    animation: fadeIn 0.2s ease;
  }

  .toast-success {
    display: flex;
    align-items: center;
    gap: 7px;
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #15803d;
    margin-top: 14px;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .login-left { display: none; }
    .login-right { padding: 36px 28px; }
    .login-card { border-radius: 16px; }
  }
`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Email dan password tidak boleh kosong.");
      return;
    }

    setLoading(true);

    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (ex) {
      setError(ex.message);
    } finally {
      setLoading(false);
    }

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        <div className="login-card">

          {/* ── Left Panel ── */}
          <div className="login-left">
            <div className="brand">
              <div className="brand-icon">
                <i className="ti ti-clock-check" />
              </div>
              <span className="brand-name">AbsensiDay</span>
            </div>

            <p className="left-tagline">
              Sistem absensi karyawan yang mudah, cepat, dan akurat untuk tim kamu.
            </p>

            <div className="features">
              <div className="feat">
                <div className="feat-icon"><i className="ti ti-fingerprint" /></div>
                <div className="feat-body">
                  <strong>Absen real-time</strong>
                  <span>Catat kehadiran langsung dari browser</span>
                </div>
              </div>
              <div className="feat">
                <div className="feat-icon"><i className="ti ti-chart-bar" /></div>
                <div className="feat-body">
                  <strong>Laporan otomatis</strong>
                  <span>Rekap hadir, terlambat & pulang cepat</span>
                </div>
              </div>
              <div className="feat">
                <div className="feat-icon"><i className="ti ti-shield-check" /></div>
                <div className="feat-body">
                  <strong>Manajemen akses</strong>
                  <span>Peran admin & karyawan terpisah</span>
                </div>
              </div>
            </div>

            <div className="left-footer">© 2025 AbsensiDay · v1.0</div>
          </div>

          {/* ── Right Panel ── */}
          <div className="login-right">
            <div className="form-head">
              <h2>Selamat datang kembali</h2>
              <p>Masuk ke akun kamu untuk melanjutkan</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="email">Email</label>
                <div className="input-wrap">
                  <i className="ti ti-mail input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <i className="ti ti-lock input-icon" />
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    <i className={`ti ${showPass ? "ti-eye-off" : "ti-eye"}`} />
                  </button>
                </div>
              </div>

              <div className="form-footer-row">
                <span className="forgot-link">Lupa password?</span>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <i className="ti ti-login" />
                    Masuk
                  </>
                )}
              </button>

              {error && (
                <div className="error-msg">
                  <i className="ti ti-alert-circle" style={{ fontSize: 15 }} />
                  {error}
                </div>
              )}

              {success && (
                <div className="toast-success">
                  <i className="ti ti-circle-check" style={{ fontSize: 15 }} />
                  {success}
                </div>
              )}
            </form>
          </div>

        </div>
      </div>
    </>
  );
}
