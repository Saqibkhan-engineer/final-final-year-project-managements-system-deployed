import { useState } from "react";
import React from "react";
import "../App.css";

export function Login({ onLogin }) {
  const [loginType, setLoginType] = useState('student');
  const [semester, setSemester] = useState('FA22');
  const [department, setDepartment] = useState('BSE');
  const [regNumber, setRegNumber] = useState('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Icons as inline SVGs
  const EmailIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );

  const LockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );

  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    let finalEmail = email;

    if (loginType === 'student') {
      if (!semester || !department || !regNumber || !password) {
        setError("Please enter all registration details and password");
        return;
      }
      finalEmail = `${semester}-${department}-${regNumber}`;
    } else {
      if (!email || !password) {
        setError("Please enter both email and password");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: finalEmail, password }),
      });

      let data;
      const responseText = await res.text();
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Server error. Please try again later.');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // ✅ Use sessionStorage by default; localStorage only if "Remember Me" is checked
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', data.accesstoken);
      storage.setItem('user', JSON.stringify(data.user));
      storage.setItem('rememberMe', rememberMe ? 'true' : 'false');

      const roleMap = {
        'student': 'student',
        'pec': 'office',
        'supervisor': 'supervisor',
        'admin': 'admin'
      };

      onLogin(roleMap[data.user.role] || 'student', data.user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-modern">
      <div className="login-card-modern">
        {/* Left Side: Form */}
        <div className="login-form-side">
          <div className="login-form-content">
            <h1 className="login-brand">FYP Portal</h1>
            <p className="login-tagline">Sign in to your account</p>

            {error && (
              <div className="login-error-alert">{error}</div>
            )}

            <form onSubmit={handleLogin}>
              {loginType === 'supervisor' ? (
                <>
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <div className="input-wrapper">
                      <input
                        type="email"
                        className="input-field"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label className="input-label">Registration Details</label>
                    <div className="input-wrapper" style={{ padding: 0, border: 'none', background: 'transparent', gap: '8px' }}>
                      <select
                        className="input-field"
                        style={{ flex: '1', minWidth: '80px' }}
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                      >
                        <option value="FA20">FA20</option>
                        <option value="SP20">SP20</option>
                        <option value="FA21">FA21</option>
                        <option value="SP21">SP21</option>
                        <option value="FA22">FA22</option>
                        <option value="SP22">SP22</option>
                        <option value="FA23">FA23</option>
                        <option value="SP23">SP23</option>
                        <option value="FA24">FA24</option>
                        <option value="SP24">SP24</option>
                      </select>
                      <select
                        className="input-field"
                        style={{ flex: '1', minWidth: '80px' }}
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      >
                        <option value="BSE">BSE</option>
                        <option value="CS">CS</option>
                        <option value="ICT">ICT</option>
                        <option value="EE">EE</option>
                        <option value="BBA">BBA</option>
                      </select>
                      <input
                        type="text"
                        className="input-field"
                        style={{ flex: '2' }}
                        placeholder="005"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Password field */}
              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Remember me / Forgot password */}
              <div className="login-options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="forgot-link">Forgot password?</a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Sign In"}
              </button>

              <div className="login-switch-role">
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {loginType === 'student' ? "Do you want to login as supervisor or faculty?" : "Do you want to login as a student?"}
                </span>
                <button
                  type="button"
                  className="switch-role-link"
                  onClick={() => {
                    setLoginType(loginType === 'student' ? 'supervisor' : 'student');
                    setError('');
                  }}
                >
                  {loginType === 'student' ? "Login as Faculty" : "Login as Student"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Image / SVG */}
        <div className="login-image-side" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #eff6ff, #bfdbfe)' }}>
          <div style={{ width: '70%', maxWidth: '450px' }}>
            <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Bottom Book */}
              <path d="M40 160 C15 160 15 195 40 195 H200 C210 195 215 190 215 177.5 C215 165 210 160 200 160 H40 Z" fill="#1e3a8a" stroke="#0f172a" strokeWidth="10" strokeLinejoin="round" />
              <path d="M35 172 H200" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
              <line x1="130" y1="184" x2="190" y2="184" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" />

              {/* Middle Book */}
              <path d="M50 120 C25 120 25 155 50 155 H190 C200 155 205 150 205 137.5 C205 125 200 120 190 120 H50 Z" fill="#3b82f6" stroke="#0f172a" strokeWidth="10" strokeLinejoin="round" />
              <path d="M45 132 H190" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />

              {/* Graduation Cap Base (Underneath) */}
              <path d="M75 90 V130 C75 145 165 145 165 130 V90" fill="#1e3a8a" stroke="#0f172a" strokeWidth="10" strokeLinejoin="round" />

              {/* Graduation Cap Top */}
              <path d="M120 30 L210 65 L120 100 L30 65 Z" fill="#2563eb" stroke="#0f172a" strokeWidth="10" strokeLinejoin="round" />

              {/* Tassel String */}
              <path d="M120 65 L175 80 V115" fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

              {/* Tassel Button */}
              <circle cx="120" cy="65" r="7" fill="#ffffff" stroke="#0f172a" strokeWidth="5" />

              {/* Tassel End */}
              <path d="M165 115 L160 145 H190 L185 115 Z" fill="#ffffff" stroke="#0f172a" strokeWidth="8" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
