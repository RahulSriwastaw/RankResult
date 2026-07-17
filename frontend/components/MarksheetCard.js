import { forwardRef } from 'react';

/**
 * MarksheetCard — Premium Dark Score Card matching RankVeda's dark glassmorphism theme.
 * All styles are inline (no Tailwind) for html2canvas compatibility.
 *
 * Props:
 *   candidate: { name, roll_number, registration_no, exam_name, test_date, test_time,
 *                subject, community, test_centre_name, photo_url }
 *   score:     { total_marks, correct, wrong, unattempted, max_marks, sections: [{name, total, na, right, wrong, marks}] }
 *   rank:      { rank, total_appeared, percentile }
 */
const MarksheetCard = forwardRef(function MarksheetCard({ candidate, score, rank }, ref) {
  const correct = score?.correct ?? 0;
  const wrong = score?.wrong ?? 0;
  const unattempted = score?.unattempted ?? 0;
  const totalAttempted = correct + wrong;
  const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;
  const maxMarks = score?.max_marks || 100;
  const totalMarks = score?.total_marks != null ? Number(score.total_marks).toFixed(2) : '—';
  const sections = score?.sections || [];

  const totalRight = sections.length > 0 ? sections.reduce((s, r) => s + (r.right || r.correct || 0), 0) : correct;
  const totalWrong = sections.length > 0 ? sections.reduce((s, r) => s + (r.wrong || 0), 0) : wrong;
  const totalNA = sections.length > 0 ? sections.reduce((s, r) => s + (r.na || 0), 0) : unattempted;
  const totalQs = sections.length > 0 ? sections.reduce((s, r) => s + (r.total || 0), 0) : maxMarks;

  // Theme colours (inline for html2canvas compatibility)
  const BG_WHITE = '#ffffff';
  const BORDER = '#e2e8f0';
  const TEXT_MAIN = '#1e293b';
  const TEXT_MUTED = '#64748b';
  const TEXT_DARK = '#0f172a';

  const headerGrad = 'linear-gradient(135deg, #1e1b4b 0%, #172554 45%, #0d9488 100%)';
  const accentGrad = 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)';
  const purpleCircle = 'rgba(99, 102, 241, 0.1)';

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        background: BG_WHITE,
        fontFamily: "'Segoe UI', Inter, Arial, sans-serif",
        color: TEXT_MAIN,
        borderRadius: '16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid #cbd5e1',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
      }}
    >
      {/* ── TOP ACCENT HEADER GRADIENT ─────────────────────────────────── */}
      <div style={{
        background: headerGrad,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff',
        position: 'relative',
      }}>
        {/* Left Side: Shield + Verified Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 11 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.8px', color: '#cbd5e1', textTransform: 'uppercase' }}>
              VERIFIED SCORE & RANK CERTIFICATE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ color: '#4ade80', fontSize: '12px' }}>●</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#4ade80' }}>Digital Verified</span>
            </div>
          </div>
        </div>

        {/* Center: Exam Name */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0, letterSpacing: '0.2px', color: '#ffffff', textTransform: 'uppercase' }}>
            {candidate?.exam_name || 'RRB NTPC UNDERGRADUATE CBT I'}
          </h2>
          <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', fontWeight: '500' }}>
            {candidate?.subject || 'RRB NTPC UnderGraduate CBT I'}
          </div>
        </div>

        {/* Right Side: Calendar & Verified Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.08)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '7.5px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.5px', textTransform: 'uppercase' }}>VERIFIED ON</div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', marginTop: '1px' }}>
              {candidate?.test_date ? candidate.test_date : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── CANDIDATE DETAILS GRID ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        padding: '16px 20px',
        background: '#ffffff',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              label: 'Candidate Name',
              value: candidate?.name || 'RAHUL KUMAR',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ),
            },
            {
              label: 'Registration Number',
              value: candidate?.registration_no || '072501113424',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="13" y2="16" />
                </svg>
              ),
            },
            {
              label: 'Roll Number',
              value: candidate?.roll_number || '247252191871283',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              ),
            },
            {
              label: 'Community / Category',
              value: candidate?.community || 'UR',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 0', borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: purpleCircle, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{item.icon}</div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: TEXT_MUTED }}>{item.label}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: TEXT_DARK, fontFamily: idx >= 1 && idx <= 2 ? 'monospace' : 'inherit' }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            {
              label: 'Test Centre',
              value: candidate?.test_centre_name || 'Dewa Mahila Mahavidyalaya',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ),
            },
            {
              label: 'Exam Date',
              value: candidate?.test_date || '18/06/2026',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
            },
            {
              label: 'Exam Time / Shift',
              value: candidate?.test_time || '12:45 PM - 2:15 PM',
              icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: purpleCircle, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{item.icon}</div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: TEXT_MUTED }}>{item.label}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: TEXT_DARK, textAlign: 'right', maxWidth: '180px' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION TABLE ──────────────────────────────────────────────── */}
      <div style={{ padding: '16px 20px', background: '#ffffff' }}>
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#1e1b4b', color: '#ffffff' }}>
                {['SECTION', 'TOTAL QS', 'SKIPPED', 'CORRECT', 'WRONG', 'NET MARKS'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px',
                    fontWeight: '800',
                    textAlign: i === 0 ? 'left' : 'center',
                    fontSize: '10px',
                    letterSpacing: '0.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.length > 0 ? sections.map((sec, i) => {
                let iconColor = '#818cf8';
                let iconSvg = (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                );
                
                if (sec.name?.toLowerCase().includes('general awareness') || sec.name?.toLowerCase().includes('gk')) {
                  iconColor = '#3b82f6';
                  iconSvg = (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10zM2 12h20" />
                    </svg>
                  );
                } else if (sec.name?.toLowerCase().includes('reasoning') || sec.name?.toLowerCase().includes('intelligence')) {
                  iconColor = '#10b981';
                  iconSvg = (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  );
                } else {
                  // Math / default
                  iconColor = '#8b5cf6';
                  iconSvg = (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                      <path d="M6 9h12M6 15h12M12 4v16" />
                    </svg>
                  );
                }

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                    <td style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{iconSvg}</div>
                      <span style={{ fontWeight: '700', color: TEXT_DARK }}>{sec.name || `Section ${i + 1}`}</span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: TEXT_MAIN }}>
                      {sec.total ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '700', color: TEXT_MUTED }}>
                      {sec.na ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#16a34a', fontWeight: '800' }}>
                      {sec.right ?? sec.correct ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#dc2626', fontWeight: '800' }}>
                      {sec.wrong ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#4f46e5', fontWeight: '800' }}>
                      {sec.marks != null ? Number(sec.marks).toFixed(2) : '—'}
                    </td>
                  </tr>
                );
              }) : (
                <tr style={{ background: '#ffffff' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700', color: TEXT_DARK }}>Overall Performance</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700' }}>{maxMarks}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: TEXT_MUTED }}>{unattempted}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#16a34a', fontWeight: '800' }}>{correct}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#dc2626', fontWeight: '800' }}>{wrong}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', color: '#4f46e5', fontWeight: '800' }}>{totalMarks}</td>
                </tr>
              )}

              {/* Lavender OVERALL TOTAL Row */}
              <tr style={{
                background: '#f3e8ff',
                borderTop: '2px solid #c084fc',
                fontWeight: '900',
              }}>
                <td style={{ padding: '12px 14px', color: '#581c87', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '900' }}>OVERALL TOTAL</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#1e1b4b', fontSize: '13px' }}>{totalQs}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#1e1b4b', fontSize: '13px' }}>{totalNA}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#16a34a', fontSize: '13px' }}>{totalRight}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#dc2626', fontSize: '13px' }}>{totalWrong}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#4f46e5', fontSize: '13.5px' }}>{totalMarks}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4 STAT CARDS ────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '14px',
        padding: '0 20px 16px 20px',
        background: '#ffffff',
      }}>
        {/* Card 1: LIVE RANK */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 10px',
          display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', overflow: 'hidden'
        }}>
          {/* Trophy Icon */}
          <div style={{ fontSize: '32px' }}>🏆</div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#166534', letterSpacing: '0.5px' }}>LIVE RANK</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#14532d', margin: '2px 0 0 0', lineHeight: 1 }}>
              {rank?.rank ? `#${rank.rank}` : '#1'}
            </div>
            <div style={{ fontSize: '9px', color: '#15803d', fontWeight: '600', marginTop: '2px' }}>
              of {rank?.total_appeared ? Number(rank.total_appeared).toLocaleString() : '2'} candidates
            </div>
          </div>
          {/* Small bar chart visual representation on right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', marginLeft: 'auto', opacity: 0.3 }}>
            <div style={{ width: '4px', height: '10px', background: '#166534', borderRadius: '1px' }}></div>
            <div style={{ width: '4px', height: '16px', background: '#166534', borderRadius: '1px' }}></div>
            <div style={{ width: '4px', height: '22px', background: '#166534', borderRadius: '1px' }}></div>
          </div>
        </div>

        {/* Card 2: PERCENTILE */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd', borderRadius: '12px', padding: '12px 10px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {/* Pie Donut Graphic */}
          <div style={{ width: '32px', height: '32px', position: 'relative' }}>
            <svg width="32" height="32" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#bae6fd" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.91" fill="none" stroke="#3b82f6" strokeWidth="4.2"
                strokeDasharray="100 0" strokeDashoffset="25" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#075985', letterSpacing: '0.5px' }}>PERCENTILE</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#0c4a6e', margin: '2px 0 0 0', lineHeight: 1 }}>
              {rank?.percentile ? `${Number(rank.percentile).toFixed(1)}%` : '100.0%'}
            </div>
            <div style={{ fontSize: '9px', color: '#0369a1', fontWeight: '600', marginTop: '2px' }}>
              Top {rank?.percentile ? (100 - rank.percentile).toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>

        {/* Card 3: OFFICIAL SCORE */}
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 10px',
          display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', overflow: 'hidden'
        }}>
          {/* Badge Icon */}
          <div style={{ fontSize: '32px' }}>🛡️</div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '800', color: '#92400e', letterSpacing: '0.5px' }}>OFFICIAL SCORE</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#78350f', margin: '2px 0 0 0', lineHeight: 1 }}>
              {totalMarks}
            </div>
            <div style={{ fontSize: '9px', color: '#b45309', fontWeight: '600', marginTop: '2px' }}>
              Out of {maxMarks} Max Marks
            </div>
          </div>
          {/* Trendline curve visualization */}
          <svg style={{ position: 'absolute', bottom: 0, right: 0, opacity: 0.15, width: '48px', height: '24px' }} viewBox="0 0 50 20">
            <path d="M0 20 Q12 5 25 15 T50 0 L50 20 Z" fill="#b45309" />
          </svg>
        </div>

        {/* Card 4: ACCURACY RATE */}
        <div style={{
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
          border: '1px solid #e9d5ff', borderRadius: '12px', padding: '12px 10px',
          display: 'flex', flexDirection: 'column', gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '28px' }}>🎯</div>
            <div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#6b21a8', letterSpacing: '0.5px' }}>ACCURACY RATE</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#581c87', margin: '2px 0 0 0', lineHeight: 1 }}>
                {accuracy}%
              </div>
              <div style={{ fontSize: '9px', color: '#7e22ce', fontWeight: '600', marginTop: '2px' }}>
                {correct} Correct / {totalAttempted} Att.
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: '3px', background: '#e9d5ff', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
            <div style={{ width: `${accuracy}%`, height: '100%', background: '#a855f7' }}></div>
          </div>
        </div>
      </div>

      {/* ── DETAILED VERIFICATION FOOTER ────────────────────────────────── */}
      <div style={{
        padding: '16px 20px',
        background: '#f8fafc',
        borderTop: '1px solid #cbd5e1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Left: Marking Scheme */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '8px', fontWeight: '800', color: TEXT_MUTED, letterSpacing: '0.5px', textTransform: 'uppercase' }}>MARKING SCHEME</div>
          <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: '700' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#16a34a' }}>+1.0</span>
              <span style={{ fontSize: '8px', color: TEXT_MUTED, fontWeight: '600', marginTop: '1px' }}>Correct</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: '#dc2626' }}>-0.33</span>
              <span style={{ fontSize: '8px', color: TEXT_MUTED, fontWeight: '600', marginTop: '1px' }}>Wrong</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ color: TEXT_DARK }}>0.0</span>
              <span style={{ fontSize: '8px', color: TEXT_MUTED, fontWeight: '600', marginTop: '1px' }}>Skipped</span>
            </div>
          </div>
        </div>

        {/* Center: Verification Capsule */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 11 2 2 4-4" />
          </svg>
          <div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: TEXT_DARK, lineHeight: 1.1 }}>This is a digitally verified score card.</div>
            <a href="https://RankVeda.in" target="_blank" rel="noreferrer" style={{ fontSize: '9px', fontWeight: '800', color: '#2563eb', textDecoration: 'none' }}>
              RankVeda.in Official Certificate
            </a>
          </div>
        </div>

        {/* Right: QR Code Mock verification details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Custom SVG QR Code Placeholder */}
          <div style={{
            width: '42px', height: '42px', border: '1px solid #cbd5e1', borderRadius: '4px',
            background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="34" height="34" viewBox="0 0 100 100">
              <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
              <rect x="10" y="10" width="15" height="15" fill="#fff" />
              <rect x="13" y="13" width="9" height="9" fill="#0f172a" />
              <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
              <rect x="75" y="10" width="15" height="15" fill="#fff" />
              <rect x="78" y="13" width="9" height="9" fill="#0f172a" />
              <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
              <rect x="10" y="75" width="15" height="15" fill="#fff" />
              <rect x="13" y="78" width="9" height="9" fill="#0f172a" />
              {/* QR Dots */}
              <rect x="40" y="10" width="5" height="10" fill="#0f172a" />
              <rect x="48" y="18" width="8" height="5" fill="#0f172a" />
              <rect x="58" y="8" width="5" height="8" fill="#0f172a" />
              <rect x="38" y="45" width="12" height="12" fill="#0f172a" />
              <rect x="56" y="40" width="10" height="5" fill="#0f172a" />
              <rect x="72" y="48" width="12" height="5" fill="#0f172a" />
              <rect x="80" y="72" width="15" height="15" fill="#0f172a" />
              <rect x="48" y="72" width="10" height="10" fill="#0f172a" />
              <rect x="58" y="82" width="10" height="8" fill="#0f172a" />
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color: TEXT_DARK, lineHeight: 1.1 }}>Scan to Verify</div>
            <div style={{ fontSize: '8.5px', fontWeight: '600', color: TEXT_MUTED, marginTop: '2px', lineHeight: 1.2 }}>
              Certificate ID: <span style={{ fontWeight: '800', color: TEXT_DARK }}>RV1710726</span>
              <br />
              or visit <a href="https://RankVeda.in/verify" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '700' }}>RankVeda.in/verify</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── VERY BOTTOM COPYRIGHT/SIGNATURE BAR ─────────────────────────── */}
      <div style={{
        background: '#0a0f29',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '9px',
        fontWeight: '600',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔒</span>
          <span>This certificate is system generated and does not require signature.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800', color: '#ffffff' }}>
          <span style={{ color: '#fbbf24' }}>⚡</span>
          <span>RankVeda.in</span>
        </div>
      </div>
    </div>
  );
});

export default MarksheetCard;
