import React from "react";

export function AddUserView({
  userStatus,
  userForm,
  setUserForm,
  userFieldErrors,
  setUserFieldErrors,
  userLoading,
  handleCreateUser,
  createdUsers,
}) {
  return (
    <div className="proposal-container">
      <div className="proposal-form-card">
        <div className="form-header-new" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          <h2>Add New User</h2>
          <p>Create accounts for students, supervisors, PEC members, or admins.</p>
        </div>
        <div className="form-body">
          {userStatus && (
            <div style={{ padding: '0.875rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem', background: userStatus.type === 'success' ? '#d1fae5' : '#fee2e2', border: `1px solid ${userStatus.type === 'success' ? '#10b981' : '#ef4444'}`, color: userStatus.type === 'success' ? '#065f46' : '#991b1b' }}>
              {userStatus.message}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
            <input type="text" className={`form-input ${userFieldErrors.name ? 'error' : ''}`} placeholder="Enter full name" value={userForm.name} onChange={e => { setUserForm({ ...userForm, name: e.target.value }); setUserFieldErrors(p => ({ ...p, name: '' })); }} disabled={userLoading} />
            {userFieldErrors.name && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.name}</span>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email <span style={{ color: 'var(--error)' }}>*</span></label>
            <input type="email" className={`form-input ${userFieldErrors.email ? 'error' : ''}`} placeholder="user@example.com" value={userForm.email} onChange={e => { setUserForm({ ...userForm, email: e.target.value }); setUserFieldErrors(p => ({ ...p, email: '' })); }} disabled={userLoading} />
            {userFieldErrors.email && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password <span style={{ color: 'var(--error)' }}>*</span></label>
            <input type="text" className={`form-input ${userFieldErrors.password ? 'error' : ''}`} placeholder="Min 8 characters" value={userForm.password} onChange={e => { setUserForm({ ...userForm, password: e.target.value }); setUserFieldErrors(p => ({ ...p, password: '' })); }} disabled={userLoading} />
            {userFieldErrors.password && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.password}</span>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label className="form-label">Role <span style={{ color: 'var(--error)' }}>*</span></label>
            <select className="form-input" value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} disabled={userLoading}>
              <option value="student">Student</option>
              <option value="pec">PEC Member</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin (FYP Office)</option>
            </select>
          </div>

          {/* Student fields */}
          {userForm.role === 'student' && (
            <>
              <div className="form-group">
                <label className="form-label">Registration Number <span style={{ color: 'var(--error)' }}>*</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    className={`form-input ${userFieldErrors.regNo ? 'error' : ''}`}
                    style={{ flex: 1.2 }}
                    value={userForm.regNo ? (userForm.regNo.split('-')[0] || "FA22") : "FA22"}
                    onChange={e => {
                      const parts = userForm.regNo ? userForm.regNo.split('-') : ["FA22", "", ""];
                      setUserForm({ ...userForm, regNo: `${e.target.value}-${parts[1] || ""}-${parts[2] || ""}`.toUpperCase() });
                      setUserFieldErrors(p => ({ ...p, regNo: '' }));
                    }}
                    disabled={userLoading}
                  >
                    {['FA22', 'SP22', 'FA23', 'SP23', 'FA24', 'SP24', 'FA25', 'SP25', 'FA26', 'SP26'].map(sem => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>-</span>
                  <input
                    type="text"
                    className={`form-input ${userFieldErrors.regNo ? 'error' : ''}`}
                    style={{ flex: 1 }}
                    placeholder="e.g. BSE"
                    value={userForm.regNo ? (userForm.regNo.split('-')[1] || "") : ""}
                    onChange={e => {
                      const parts = userForm.regNo ? userForm.regNo.split('-') : ["FA22", "", ""];
                      setUserForm({ ...userForm, regNo: `${parts[0] || "FA22"}-${e.target.value}-${parts[2] || ""}`.toUpperCase() });
                      setUserFieldErrors(p => ({ ...p, regNo: '' }));
                    }}
                    disabled={userLoading}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>-</span>
                  <input
                    type="text"
                    className={`form-input ${userFieldErrors.regNo ? 'error' : ''}`}
                    style={{ flex: 1 }}
                    placeholder="e.g. 005"
                    value={userForm.regNo ? (userForm.regNo.split('-')[2] || "") : ""}
                    onChange={e => {
                      const parts = userForm.regNo ? userForm.regNo.split('-') : ["FA22", "", ""];
                      setUserForm({ ...userForm, regNo: `${parts[0] || "FA22"}-${parts[1] || ""}-${e.target.value}`.toUpperCase() });
                      setUserFieldErrors(p => ({ ...p, regNo: '' }));
                    }}
                    disabled={userLoading}
                  />
                </div>
                {userFieldErrors.regNo && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.regNo}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Father's Name</label>
                <input type="text" className="form-input" placeholder="Enter father's name" value={userForm.fatherName} onChange={e => setUserForm({ ...userForm, fatherName: e.target.value })} disabled={userLoading} />
              </div>
              <div className="form-group">
                <label className="form-label">Department <span style={{ color: 'var(--error)' }}>*</span></label>
                <select className={`form-input ${userFieldErrors.department ? 'error' : ''}`} value={userForm.department} onChange={e => { setUserForm({ ...userForm, department: e.target.value }); setUserFieldErrors(p => ({ ...p, department: '' })); }} disabled={userLoading}>
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Data Science">Data Science</option>
                </select>
                {userFieldErrors.department && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.department}</span>}
              </div>
            </>
          )}

          {/* Supervisor fields */}
          {userForm.role === 'supervisor' && (
            <>
              <div className="form-group">
                <label className="form-label">Designation <span style={{ color: 'var(--error)' }}>*</span></label>
                <select className={`form-input ${userFieldErrors.designation ? 'error' : ''}`} value={userForm.designation} onChange={e => { setUserForm({ ...userForm, designation: e.target.value }); setUserFieldErrors(p => ({ ...p, designation: '' })); }} disabled={userLoading}>
                  <option value="">Select Designation</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                </select>
                {userFieldErrors.designation && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.designation}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Expertise <span style={{ color: 'var(--error)' }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                  {['AI', 'Web', 'Mobile', 'Data Science', 'Cybersecurity'].map(item => (
                    <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                      <input type="checkbox" value={item} checked={userForm.expertise.includes(item)} onChange={e => { const updated = e.target.checked ? [...userForm.expertise, item] : userForm.expertise.filter(x => x !== item); setUserForm({ ...userForm, expertise: updated }); setUserFieldErrors(p => ({ ...p, expertise: '' })); }} />
                      {item}
                    </label>
                  ))}
                </div>
                {userFieldErrors.expertise && <span className="input-error" style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{userFieldErrors.expertise}</span>}
              </div>
            </>
          )}

          {/* Submit */}
          <button className="submit-btn-new" onClick={handleCreateUser} disabled={userLoading} style={{ background: userLoading ? '#64748b' : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            {userLoading ? (<><span className="spinner"></span> Creating...</>) : ('Create User')}
          </button>

          {/* Recently Created */}
          {createdUsers.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Recently Created Users</h4>
              {createdUsers.slice(0, 5).map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.375rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                  <span><strong>{u.name}</strong> — {u.email}</span>
                  <span className="meta-badge domain" style={{ textTransform: 'capitalize' }}>{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
