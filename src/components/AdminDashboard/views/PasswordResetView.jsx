import React, { useState } from "react";
import * as api from "../api";

export function PasswordResetView() {
  const [role, setRole] = useState("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState(null);
  
  const [foundUser, setFoundUser] = useState(null);
  
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetStatus, setResetStatus] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchStatus(null);
    setFoundUser(null);
    setResetStatus(null);
    setNewPassword("");

    try {
      const user = await api.searchUserApi(role, searchQuery.trim());
      setFoundUser(user);
    } catch (err) {
      setSearchStatus({ type: "error", message: err.message || "User not found." });
    } finally {
      setSearching(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!foundUser || !newPassword) return;

    if (newPassword.length < 8) {
      setResetStatus({ type: "error", message: "Password must be at least 8 characters long." });
      return;
    }

    setResetting(true);
    setResetStatus(null);

    try {
      await api.resetPasswordApi({ email: foundUser.email, newPassword });
      setResetStatus({ type: "success", message: `Password successfully reset for ${foundUser.name}.` });
      setNewPassword("");
    } catch (err) {
      setResetStatus({ type: "error", message: err.message || "Failed to reset password." });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem' }}>Password Reset</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Search for a Student by Registration Number or a Supervisor by Email to reset their password.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
        
        {/* Role Selection */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            onClick={() => { setRole("student"); setFoundUser(null); setSearchStatus(null); setResetStatus(null); setSearchQuery(""); }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: `2px solid ${role === 'student' ? '#3b82f6' : '#e2e8f0'}`, background: role === 'student' ? '#eff6ff' : '#fff', color: role === 'student' ? '#1d4ed8' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            🎓 Student
          </button>
          <button 
            type="button"
            onClick={() => { setRole("supervisor"); setFoundUser(null); setSearchStatus(null); setResetStatus(null); setSearchQuery(""); }}
            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: `2px solid ${role === 'supervisor' ? '#3b82f6' : '#e2e8f0'}`, background: role === 'supervisor' ? '#eff6ff' : '#fff', color: role === 'supervisor' ? '#1d4ed8' : '#64748b', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            👨‍🏫 Supervisor
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
              {role === 'student' ? 'Registration Number' : 'Email Address'}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={role === 'student' ? 'e.g. FA22-BSE-005' : 'e.g. supervisor@example.com'}
              style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={searching}
            style={{ padding: '0.875rem 1.5rem', background: searching ? '#94a3b8' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: searching ? 'not-allowed' : 'pointer', height: '48px' }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searchStatus && (
          <div style={{ marginTop: '1rem', padding: '0.8rem', borderRadius: '8px', background: searchStatus.type === 'success' ? '#d1fae5' : '#fee2e2', color: searchStatus.type === 'success' ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>
            {searchStatus.message}
          </div>
        )}
      </div>

      {/* Found User / Reset Form */}
      {foundUser && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {foundUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: '0 0 0.2rem', color: '#1e293b', fontSize: '1.2rem' }}>{foundUser.name}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                {role === 'student' ? (
                  <><strong>Reg No:</strong> {foundUser.regNo} | <strong>Dept:</strong> {foundUser.department}</>
                ) : (
                  <><strong>Email:</strong> {foundUser.email} | <strong>Designation:</strong> {foundUser.designation}</>
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                Set New Password
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                required
              />
            </div>

            {resetStatus && (
              <div style={{ padding: '0.8rem', borderRadius: '8px', background: resetStatus.type === 'success' ? '#d1fae5' : '#fee2e2', color: resetStatus.type === 'success' ? '#065f46' : '#991b1b', fontSize: '0.9rem' }}>
                {resetStatus.message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={resetting}
              style={{ padding: '1rem', background: resetting ? '#94a3b8' : '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, cursor: resetting ? 'not-allowed' : 'pointer' }}
            >
              {resetting ? 'Saving Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
