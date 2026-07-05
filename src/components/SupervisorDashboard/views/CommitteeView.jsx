import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from "recharts";

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export function CommitteeView({
  evalGroupsLoading,
  evalGroupsError,
  evalGroups,
  fetchEvalGroups,
  handleOpenEvaluate,
  groupRepos,
  performanceData,
  checkingPerf,
  perfError,
  handleCheckPerformance,
}) {
  return (
    <div className="section-card">
      <h2 className="section-title">⚖️ Evaluation Committee Groups</h2>

      {evalGroupsLoading ? (
        <div className="center-state">
          <div className="loading-spinner-lg" />
          <p>Loading allocated groups…</p>
        </div>
      ) : evalGroupsError ? (
        <div className="center-state">
          <div className="state-icon">⚠️</div>
          <h3>Error</h3>
          <p>{evalGroupsError}</p>
          <button className="retry-btn" onClick={fetchEvalGroups}>Retry</button>
        </div>
      ) : evalGroups.length === 0 ? (
        <div className="center-state">
          <div className="state-icon">👥</div>
          <h3>No Groups Allocated</h3>
          <p>You don't have any groups allocated for evaluation at the moment.</p>
        </div>
      ) : (
        <div className="groups-grid">
          {evalGroups.map((g, i) => {
            const gId = g.id || g._id || i;
            
            // GitHub performance data extraction
            const repoUrl = groupRepos[gId] ?? g.repoUrl ?? null;
            const perf = performanceData[gId];
            const isChecking = checkingPerf[gId];
            const thisError = perfError[gId];
            const CHART_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6'];

            const totalCommitData = perf?.contributors?.map((c) => ({ name: c.username, Commits: c.totalCommits })) || [];
            const pieData = perf?.contributors?.map((c, ci) => ({ name: c.username, value: c.totalCommits, fill: CHART_COLORS[ci % CHART_COLORS.length] })) || [];
            const weekMonthData = perf ? Object.keys({ ...perf.monthCommits, ...perf.weekCommits }).map(user => ({
              name: user, 'Last Month': perf.monthCommits[user] || 0, 'Last Week': perf.weekCommits[user] || 0,
            })) : [];
            const consistencyData = perf?.consistencyData || [];
            
            const twoWeeksData = perf ? Object.keys(perf.twoWeekCommits || {}).map(user => ({
              name: user,
              Commits: perf.twoWeekCommits[user] || 0
            })) : [];

            const monthPieData = perf ? Object.keys(perf.monthCommits || {}).map((user, ci) => ({
              name: user,
              value: perf.monthCommits[user] || 0,
              fill: CHART_COLORS[ci % CHART_COLORS.length]
            })) : [];
            
            const heatmapData = perf?.heatmapData || [];
            const trendData = perf?.trendData || [];
            const impactData = perf?.impactData || [];
            const burndownData = perf?.burndownData || [];

            return (
              <div key={gId} className="group-card" style={{ width: '100%', maxWidth: 'none', display: 'flex', flexDirection: 'column' }}>
                <div className="group-card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.5rem' }}>📋</span> {g.proposal?.title || `Group #${gId}`}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <span className="group-badge" style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '100px' }}>To Evaluate</span>
                      {g.proposal?.domain && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '100px' }}>🏷️ {g.proposal.domain}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleOpenEvaluate(gId, 'committee')}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', transition: 'transform 0.2s', fontWeight: 700 }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
                  >
                    ⚖️ Evaluate Now
                  </button>
                </div>

                {/* Students */}
                <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <p className="students-section-title" style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>Team Members</p>
                  <div className="students-list" style={{ gap: '10px' }}>
                    {g.teamMembers && g.teamMembers.length > 0 ? (
                      g.teamMembers.map((member, idx) => (
                        <div key={idx} className="student-chip" style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                          <div className="avatar-mini" style={{ background: 'linear-gradient(135deg, #10b981, #14b8a6)' }}>👤</div>
                          <div>
                            <span className="reg-text" style={{ fontWeight: 700, color: '#1e293b' }}>{member.name || `Member ${idx + 1}`}</span>
                            {member.regNo && <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '6px' }}>{member.regNo}</span>}
                          </div>
                        </div>
                      ))
                    ) : g.studentRegs && g.studentRegs.length > 0 ? (
                      g.studentRegs.map((reg, idx) => (
                        <div key={idx} className="student-chip" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                          <div className="avatar-mini">👤</div>
                          <span className="reg-text">{reg}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No students info</p>
                    )}
                  </div>
                </div>

                {/* --- Read-Only GitHub Section --- */}
                <div className="github-section" style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h4 className="github-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                      <GitHubIcon /> Deep GitHub Analytics
                    </h4>
                    
                    {!perf && !thisError && !isChecking && repoUrl && (
                      <button
                        onClick={() => handleCheckPerformance(gId)}
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0f172a, #334155)', color: '#fff', cursor: 'pointer', fontWeight: 700, boxShadow: '0 4px 10px rgba(15,23,42,0.2)' }}
                      >
                        🔍 Fetch Analytics
                      </button>
                    )}
                    {perf && !isChecking && (
                      <button
                        onClick={() => handleCheckPerformance(gId)}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        🔄 Refresh Data
                      </button>
                    )}
                  </div>
                  
                  {!repoUrl && (
                    <div style={{ textAlign: 'center', padding: '1.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔗</div>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0' }}>No GitHub repository linked to this group.</p>
                    </div>
                  )}

                  {/* Repo URL pill */}
                  {repoUrl && (
                    <p style={{ fontSize: '0.73rem', color: '#7c3aed', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '1.25rem', background: '#f5f3ff', padding: '7px 12px', borderRadius: '9px', border: '1px solid #ede9fe' }}>
                      🔗 {repoUrl}
                    </p>
                  )}

                  {/* Checking animation */}
                  {isChecking && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'linear-gradient(135deg, #f5f3ff, #ecfdf5)', borderRadius: '12px', border: '1px solid #ddd6fe', marginBottom: '1.25rem' }}>
                      <div className="loading-spinner-lg" style={{ width: '1.75rem', height: '1.75rem', margin: 0 }} />
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7c3aed', margin: 0 }}>Fetching GitHub Performance…</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.76rem', margin: '2px 0 0' }}>Collecting commits, contributor stats & activity trends</p>
                      </div>
                    </div>
                  )}

                  {/* Error box */}
                  {thisError && !isChecking && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                      <p style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ⚠️ GitHub Fetch Failed
                      </p>
                      <p style={{ color: '#b91c1c', fontSize: '0.8rem', margin: '0 0 12px', wordBreak: 'break-word' }}>{thisError}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleCheckPerformance(gId)}
                          style={{ fontSize: '0.8rem', padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                        >
                          🔄 Retry
                        </button>
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 'auto 0' }}>Make sure the repo is public or the PAT has access.</p>
                      </div>
                    </div>
                  )}

                  {/* PERFORMANCE CHARTS */}
                  {perf && !isChecking && (
                    <div>
                      {/* Summary stats */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
                        {[
                          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: 'Total Commits', val: perf.totalCommits, color: '#8b5cf6' },
                          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Contributors', val: perf.contributors?.length || 0, color: '#06b6d4' },
                          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Stars', val: perf.repoInfo?.stargazers_count ?? 0, color: '#f59e0b' },
                          { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 12v3"/></svg>, label: 'Forks', val: perf.repoInfo?.forks_count ?? 0, color: '#10b981' },
                        ].map(stat => (
                          <div key={stat.label} style={{
                            background: '#fff', border: `1px solid ${stat.color}30`,
                            borderRadius: '12px', padding: '1rem', textAlign: 'center',
                            boxShadow: `0 2px 10px ${stat.color}15`,
                          }}>
                            <div style={{ fontSize: '1.6rem', marginBottom: '3px' }}>{stat.icon}</div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.val}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '3px' }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* --- 5 MODERN CHARTS GRID --- */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                        
                        {/* 1. Contribution Distribution (Donut Chart) */}
                        {pieData.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>🍩 Contribution Distribution</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                              <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                    {pieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pieData.map((entry, pi) => {
                                  const pct = perf.totalCommits > 0 ? Math.round((entry.value / perf.totalCommits) * 100) : 0;
                                  return (
                                    <div key={pi}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: entry.fill, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: entry.fill, fontWeight: 900 }}>{pct}%</span>
                                      </div>
                                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: entry.fill, borderRadius: '3px' }} />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. Activity Heatmap (Scatter Chart) */}
                        {heatmapData.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>🔥 Activity Heatmap (8 Weeks)</p>
                            <ResponsiveContainer width="100%" height={220}>
                              <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                <XAxis type="category" dataKey="dateLabel" name="Week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="username" name="User" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                                <ZAxis type="number" dataKey="commits" range={[40, 400]} name="Commits" />
                                <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                <Scatter data={heatmapData} shape="circle">
                                  {heatmapData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                  ))}
                                </Scatter>
                              </ScatterChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* 3. Contribution Trend (Multi-Line Chart) */}
                        {trendData.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', gridColumn: '1 / -1' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>📈 Contribution Trend</p>
                            <ResponsiveContainer width="100%" height={260}>
                              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} iconType="circle" />
                                {perf?.contributors?.map((c, ci) => (
                                  <Line key={c.username} type="monotone" dataKey={c.username} stroke={CHART_COLORS[ci % CHART_COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* 4. Code Impact Analysis (Grouped Bar Chart) */}
                        {impactData.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>⚖️ Code Impact Analysis</p>
                            <ResponsiveContainer width="100%" height={260}>
                              <BarChart data={impactData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} iconType="circle" />
                                <Bar dataKey="Additions" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="Deletions" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* 5. Task Burndown (Area Chart) */}
                        {burndownData.length > 0 ? (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>📉 Task Burndown</p>
                            <ResponsiveContainer width="100%" height={260}>
                              <AreaChart data={burndownData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                <defs>
                                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} iconType="circle" />
                                <Area type="monotone" dataKey="Total Tasks" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                                <Area type="monotone" dataKey="Completed Tasks" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '260px' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '0.5rem', alignSelf: 'flex-start' }}>📉 Task Burndown</p>
                            <div style={{ fontSize: '2.5rem', marginBottom: '10px', opacity: 0.5 }}>📭</div>
                            <h4 style={{ color: '#475569', margin: '0 0 5px' }}>No Issues Found</h4>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>This repository doesn't have any GitHub issues to track task burndown.</p>
                          </div>
                        )}

                        {/* 6. Last 2 Weeks Commits (Bar Chart) */}
                        {twoWeeksData.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>🗓️ Last 2 Weeks Commits</p>
                            <ResponsiveContainer width="100%" height={260}>
                              <BarChart data={twoWeeksData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                <Bar dataKey="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                  {twoWeeksData.map((_, ci) => (
                                    <Cell key={ci} fill={CHART_COLORS[ci % CHART_COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* 7. Last Month Commits (Pie Chart) */}
                        {monthPieData.length > 0 && (
                          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#334155', letterSpacing: '0.5px', marginBottom: '1.25rem' }}>📅 Last Month Commits</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <ResponsiveContainer width={180} height={180}>
                                <PieChart>
                                  <Pie data={monthPieData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" strokeWidth={1} stroke="#fff">
                                    {monthPieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                  </Pie>
                                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem' }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {monthPieData.map((entry, pi) => (
                                  <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '4px', background: entry.fill, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: entry.fill, fontWeight: 900 }}>{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
