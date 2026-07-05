import { AlertTriangle, Users, CheckCircle, XCircle, BarChart2, Scale, GraduationCap, Tag, User, Search, RefreshCw, PieChart as PieChartIcon, Calendar, CalendarDays, Target, ChevronUp, ExternalLink } from "lucide-react";
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
      <h2 className="section-title"><Scale className="inline-icon" size={18} /> Evaluation Committee Groups</h2>

      {evalGroupsLoading ? (
        <div className="center-state">
          <div className="loading-spinner-lg" />
          <p>Loading allocated groups…</p>
        </div>
      ) : evalGroupsError ? (
        <div className="center-state">
          <div className="state-icon"><AlertTriangle className="inline-icon" size={18} /></div>
          <h3>Error</h3>
          <p>{evalGroupsError}</p>
          <button className="retry-btn" onClick={fetchEvalGroups}>Retry</button>
        </div>
      ) : evalGroups.length === 0 ? (
        <div className="center-state">
          <div className="state-icon"><Users className="inline-icon" size={18} /></div>
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
              <div key={gId} className="group-card">
                <div className="group-card-header">
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                      <GraduationCap className="inline-icon" size={18} /> {g.proposal?.title || g.name || `Group #${gId}`}
                    </h3>
                    {g.proposal?.domain && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700,
                        background: '#eff6ff', color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '1px 7px', borderRadius: '10px',
                        display: 'inline-block', marginTop: '3px',
                      }}><Tag className="inline-icon" size={18} /> {g.proposal.domain}</span>
                    )}
                  </div>
                  <button className="btn-primary" onClick={() => handleOpenEvaluate(gId, 'committee')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                    <CheckCircle className="inline-icon" size={18} /> Evaluate
                  </button>
                </div>

                {/* Team Members block */}
                <div style={{ padding: '0.75rem 1rem' }}>
                  <p className="students-section-title">Team Members</p>
                  <div className="students-list">
                    {g.teamMembers && g.teamMembers.length > 0 ? (
                      g.teamMembers.map((member, idx) => (
                        <div key={idx} className="student-chip">
                          <div className="avatar-mini"><User className="inline-icon" size={18} /></div>
                          <div>
                            <span className="reg-text" style={{ fontWeight: 600 }}>{member.name || `Member ${idx + 1}`}</span>
                            {member.regNo && <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '5px' }}>({member.regNo})</span>}
                          </div>
                        </div>
                      ))
                    ) : g.studentRegs && g.studentRegs.length > 0 ? (
                      g.studentRegs.map((reg, idx) => (
                        <div key={idx} className="student-chip">
                          <div className="avatar-mini"><User className="inline-icon" size={18} /></div>
                          <span className="reg-text">{reg}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No students info</p>
                    )}
                  </div>
                </div>

                {/* --- Read-Only GitHub Section --- */}
                <div className="github-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 className="github-section-title">
                      <GitHubIcon /> GitHub Integration
                    </h4>
                    {perf && !isChecking && (
                      <button
                        onClick={() => handleCheckPerformance(gId)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw className="inline-icon" size={18} /> Refresh Data
                      </button>
                    )}
                  </div>

                  {!repoUrl ? (
                    <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 10px' }}>No GitHub repository linked to this group.</p>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {repoUrl}
                        </span>
                        <a href={repoUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: '#3b82f6', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                          Open <ExternalLink className="inline-icon" size={18} />
                        </a>
                      </div>
                    </div>
                  )}

                  {!perf && repoUrl && !thisError && !isChecking && (
                    <button
                      onClick={() => handleCheckPerformance(gId)}
                      style={{ width: '100%', padding: '0.6rem', fontSize: '0.8rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      <Search className="inline-icon" size={18} /> Check Code Performance
                    </button>
                  )}
                  
                  {isChecking && (
                    <div style={{ padding: '1rem', background: '#f5f3ff', borderRadius: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <div className="loading-spinner-lg" style={{ width: '1.25rem', height: '1.25rem', margin: 0 }} />
                      <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#7c3aed', margin: 0 }}>Fetching GitHub data…</p>
                    </div>
                  )}
                  
                  {thisError && !isChecking && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem' }}>
                      <p style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 700, margin: '0 0 6px' }}><AlertTriangle className="inline-icon" size={18} /> Error</p>
                      <p style={{ color: '#b91c1c', fontSize: '0.75rem', margin: '0 0 10px', wordBreak: 'break-word' }}>{thisError}</p>
                      <button
                        onClick={() => handleCheckPerformance(gId)}
                        style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                      >
                        <RefreshCw className="inline-icon" size={18} /> Retry
                      </button>
                    </div>
                  )}

                  {/* CHARTS */}
                  {perf && !isChecking && (
                    <div>
                      {/* Stats pills */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                        {[
                          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>, label: 'Total Commits', val: perf.totalCommits, color: '#8b5cf6' },
                          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Contributors', val: perf.contributors?.length || 0, color: '#06b6d4' },
                          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>, label: 'Stars', val: perf.repoInfo?.stargazers_count ?? 0, color: '#f59e0b' },
                          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, label: 'Open Issues', val: perf.repoInfo?.open_issues_count ?? 0, color: '#ef4444' },
                        ].map(stat => (
                          <div key={stat.label} style={{ background: '#fff', border: `1px solid ${stat.color}25`, borderRadius: '8px', padding: '0.625rem', textAlign: 'center', boxShadow: `0 2px 6px ${stat.color}10` }}>
                            <div style={{ fontSize: '1rem' }}>{stat.icon}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: stat.color }}>{stat.val}</div>
                            <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* CHART 1: Total Commits */}
                      {totalCommitData.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}><BarChart2 className="inline-icon" size={18} /> Total Commits</p>
                          <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                            <ResponsiveContainer width="100%" height={160}>
                              <BarChart data={totalCommitData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <defs>
                                  {totalCommitData.map((_, ci) => (
                                    <linearGradient key={ci} id={`gc-g-${gId}-${ci}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor={CHART_COLORS[ci % CHART_COLORS.length]} stopOpacity={1} />
                                      <stop offset="100%" stopColor={CHART_COLORS[(ci + 2) % CHART_COLORS.length]} stopOpacity={0.55} />
                                    </linearGradient>
                                  ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip
                                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}
                                  cursor={{ fill: 'rgba(139,92,246,0.06)' }}
                                />
                                <Bar dataKey="Commits" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                  {totalCommitData.map((_, ci) => (
                                    <Cell key={ci} fill={`url(#gc-g-${gId}-${ci})`} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* CHART 2: Pie Chart */}
                      {pieData.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}><PieChartIcon className="inline-icon" size={18} /> Commit Share</p>
                          <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <ResponsiveContainer width={150} height={150}>
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                  {pieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} formatter={(val, name) => [`${val} commits`, name]} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '100px' }}>
                              {pieData.map((entry, pi) => {
                                const pct = perf.totalCommits > 0 ? Math.round((entry.value / perf.totalCommits) * 100) : 0;
                                return (
                                  <div key={pi}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                      <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.fill, flexShrink: 0 }} />
                                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                      <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: entry.fill, fontWeight: 800 }}>{pct}%</span>
                                    </div>
                                    <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${pct}%`, background: entry.fill, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CHART 3: Week vs Month */}
                      {weekMonthData.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}><Calendar className="inline-icon" size={18} /> Last Week vs Month</p>
                          <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                            <ResponsiveContainer width="100%" height={160}>
                              <BarChart data={weekMonthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }} barGap={3}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }} cursor={{ fill: 'rgba(6,182,212,0.06)' }} />
                                <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: '4px' }} />
                                <Bar dataKey="Last Month" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="Last Week" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* CHART 4: Consistency */}
                      {consistencyData.length > 0 && (
                        <div>
                          <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}><Target className="inline-icon" size={18} /> Consistency Score</p>
                          <div style={{ background: '#fff', borderRadius: '10px', padding: '0.875rem', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {consistencyData.map((c, ci) => {
                              const color = c.score >= 70 ? '#10b981' : c.score >= 40 ? '#f59e0b' : '#ef4444';
                              const bg = c.score >= 70 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : c.score >= 40 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f97316)';
                              return (
                                <div key={ci}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{c.username}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ fontWeight: 900, fontSize: '0.85rem', color }}>{c.score}%</span>
                                      <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '100px', background: c.score >= 70 ? '#d1fae5' : c.score >= 40 ? '#fef9c3' : '#fee2e2', color, fontWeight: 700 }}>
                                        {c.score >= 70 ? '<CheckCircle className="inline-icon" size={18} /> Consistent' : c.score >= 40 ? '<AlertTriangle className="inline-icon" size={18} /> Moderate' : '<XCircle className="inline-icon" size={18} /> Inconsistent'}
                                      </span>
                                    </div>
                                  </div>
                                  <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${c.score}%`, background: bg, borderRadius: '6px', transition: 'width 1s ease', boxShadow: `0 1px 4px ${color}40` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* CHART 5: Last 2 Weeks */}
                      {twoWeeksData.length > 0 && (
                        <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
                          <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}><CalendarDays className="inline-icon" size={18} /> Last 2 Weeks Commits</p>
                          <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9' }}>
                            <ResponsiveContainer width="100%" height={160}>
                              <BarChart data={twoWeeksData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569', fontWeight: 700 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} />
                                <Bar dataKey="Commits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                  {twoWeeksData.map((_, ci) => (
                                    <Cell key={ci} fill={CHART_COLORS[ci % CHART_COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* CHART 6: Last Month Pie */}
                      {monthPieData.length > 0 && (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.5px', marginBottom: '0.5rem' }}><Calendar className="inline-icon" size={18} /> Last Month Commits</p>
                          <div style={{ background: '#fff', borderRadius: '10px', padding: '0.75rem', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <ResponsiveContainer width={150} height={150}>
                              <PieChart>
                                <Pie data={monthPieData} cx="50%" cy="50%" innerRadius={0} outerRadius={65} dataKey="value" strokeWidth={1} stroke="#fff">
                                  {monthPieData.map((entry, pi) => <Cell key={pi} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.78rem' }} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '100px' }}>
                              {monthPieData.map((entry, pi) => (
                                <div key={pi} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: 10, height: 10, borderRadius: '3px', background: entry.fill, flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{entry.name}</span>
                                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: entry.fill, fontWeight: 800 }}>{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom Action Row for Charts */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.875rem' }}>
                        <button
                          onClick={() => handleCheckPerformance(gId)}
                          disabled={isChecking}
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 700 }}
                        >
                          <RefreshCw className="inline-icon" size={18} /> Re-evaluate
                        </button>
                        <button
                          onClick={() => setPerformanceData(p => { const next = {...p}; delete next[gId]; return next; })}
                          style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 700 }}
                        >
                          <ChevronUp className="inline-icon" size={18} /> Show Less
                        </button>
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
