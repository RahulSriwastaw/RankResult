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
        borderRadius: '08px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid #cbd5e1',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
      }}
    >
      {/* ── TOP ACCENT HEADER GRADIENT ─────────────────────────────────── */}
      <div style={{
        background: headerGrad,
        padding: 'clamp(6px, 1.5vw, 10px) clamp(8px, 2vw, 12px)',
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 'clamp(4px, 1vw, 8px)',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#ffffff',
        position: 'relative',
      }}>
        {/* Left Side: Shield + Verified Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 14px)' }}>
          <div style={{
            width: 'clamp(28px, 7vw, 48px)', height: 'clamp(28px, 7vw, 48px)', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}>
            <svg style={{ width: 'clamp(14px, 4vw, 24px)', height: 'clamp(14px, 4vw, 24px)' }} viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 11 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(5.5px, 1.6vw, 10px)', fontWeight: '800', letterSpacing: '0.5px', color: '#cbd5e1', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              VERIFIED SCORE & RANK
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '1px' }}>
              <span style={{ color: '#4ade80', fontSize: 'clamp(7px, 2vw, 12px)' }}>●</span>
              <span style={{ fontSize: 'clamp(7px, 2vw, 12px)', fontWeight: '700', color: '#4ade80', whiteSpace: 'nowrap' }}>Digital Verified</span>
            </div>
          </div>
        </div>

        {/* Center: Exam Name */}
        <div style={{ textAlign: 'center', flex: 1, padding: '0 clamp(4px, 1vw, 20px)', minWidth: 0 }}>
          <h2 style={{ fontSize: 'clamp(7.5px, 2.2vw, 16px)', fontWeight: '900', margin: 0, letterSpacing: '0.2px', color: '#ffffff', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {candidate?.exam_name || 'RRB NTPC UNDERGRADUATE CBT I'}
          </h2>
          <div style={{ fontSize: 'clamp(6px, 1.8vw, 11px)', color: '#cbd5e1', marginTop: '3px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {candidate?.subject || 'RRB NTPC UnderGraduate CBT I'}
          </div>
        </div>

        {/* Right Side: Calendar & Verified Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 10px)', background: 'rgba(255, 255, 255, 0.08)', padding: 'clamp(4px, 1vw, 8px) clamp(6px, 1.5vw, 12px)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', flexShrink: 0 }}>
          <svg style={{ width: 'clamp(12px, 3vw, 18px)', height: 'clamp(12px, 3vw, 18px)' }} viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 'clamp(5px, 1.4vw, 7.5px)', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>VERIFIED ON</div>
            <div style={{ fontSize: 'clamp(7px, 1.8vw, 11px)', fontWeight: '800', color: '#ffffff', marginTop: '1px', whiteSpace: 'nowrap' }}>
              {candidate?.test_date ? candidate.test_date : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* ── CANDIDATE DETAILS TABLE ─────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(9px, 2.5vw, 12px)', borderBottom: '1px solid #cbd5e1' }}>
        <tbody>
          {[
            ['Candidate Name', candidate?.name || 'RAHUL KUMAR'],
            ['Registration Number', candidate?.registration_no || '072501113424'],
            ['Roll Number', candidate?.roll_number || '247252191871283'],
            ['Community / Category', candidate?.community || 'UR'],
            ['Test Centre', candidate?.test_centre_name || 'Dewa Mahila Mahavidyalaya'],
            ['Exam Date', candidate?.test_date || '18/06/2026'],
            ['Exam Time / Shift', candidate?.test_time || '12:45 PM - 2:15 PM'],
          ].map(([label, value], idx) => (
            <tr key={idx} style={{ borderBottom: idx < 6 ? '1px solid #e2e8f0' : 'none' }}>
              <td style={{ padding: '6px 12px', fontWeight: '700', color: '#475569', background: '#f8fafc', borderRight: '1px solid #e2e8f0', width: '40%' }}>{label}</td>
              <td style={{ padding: '6px 12px', fontWeight: '800', color: '#0f172a', fontFamily: label.includes('Number') ? 'monospace' : 'inherit' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── SECTION TABLE ──────────────────────────────────────────────── */}
      <table style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse', fontSize: 'clamp(9px, 2.5vw, 12px)' }}>
            <thead>
              <tr style={{ background: '#1e1b4b', color: '#ffffff' }}>
                {['SECTION', 'TOTAL', 'SKIP', 'RIGHT', 'WRONG', 'SCORE'].map((h, i) => (
                  <th key={i} style={{
                    padding: '8px 4px',
                    fontWeight: '800',
                    textAlign: i === 0 ? 'left' : 'center',
                    fontSize: 'clamp(7.5px, 2vw, 10px)',
                    letterSpacing: '0.2px',
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
                    <td style={{ padding: '8px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                        background: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{iconSvg}</div>
                      <span style={{ fontWeight: '700', color: TEXT_DARK, fontSize: 'clamp(8.5px, 2.5vw, 12px)', whiteSpace: 'normal', wordBreak: 'break-word' }}>{sec.name || `Section ${i + 1}`}</span>
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '700', color: TEXT_MAIN }}>
                      {sec.total ?? '—'}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '700', color: TEXT_MUTED }}>
                      {sec.na ?? '—'}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#16a34a', fontWeight: '800' }}>
                      {sec.right ?? sec.correct ?? '—'}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#dc2626', fontWeight: '800' }}>
                      {sec.wrong ?? '—'}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center', color: '#4f46e5', fontWeight: '800' }}>
                      {sec.marks != null ? Number(sec.marks).toFixed(2) : '—'}
                    </td>
                  </tr>
                );
              }) : (
                <tr style={{ background: '#ffffff' }}>
                  <td style={{ padding: '8px 4px', fontWeight: '700', color: TEXT_DARK, fontSize: 'clamp(8.5px, 2.5vw, 12px)' }}>Overall Performance</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '700' }}>{maxMarks}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center', fontWeight: '700', color: TEXT_MUTED }}>{unattempted}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center', color: '#16a34a', fontWeight: '800' }}>{correct}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center', color: '#dc2626', fontWeight: '800' }}>{wrong}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'center', color: '#4f46e5', fontWeight: '800' }}>{totalMarks}</td>
                </tr>
              )}

              {/* Lavender OVERALL TOTAL Row */}
              <tr style={{
                background: '#f3e8ff',
                borderTop: '2px solid #c084fc',
                fontWeight: '900',
              }}>
                <td style={{ padding: '10px 4px', color: '#581c87', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '900', fontSize: 'clamp(8px, 2.2vw, 11px)' }}>OVERALL TOTAL</td>
                <td style={{ padding: '10px 4px', textAlign: 'center', color: '#1e1b4b', fontSize: 'clamp(10px, 2.8vw, 13px)' }}>{totalQs}</td>
                <td style={{ padding: '10px 4px', textAlign: 'center', color: '#1e1b4b', fontSize: 'clamp(10px, 2.8vw, 13px)' }}>{totalNA}</td>
                <td style={{ padding: '10px 4px', textAlign: 'center', color: '#16a34a', fontSize: 'clamp(10px, 2.8vw, 13px)' }}>{totalRight}</td>
                <td style={{ padding: '10px 4px', textAlign: 'center', color: '#dc2626', fontSize: 'clamp(10px, 2.8vw, 13px)' }}>{totalWrong}</td>
                <td style={{ padding: '10px 4px', textAlign: 'center', color: '#4f46e5', fontSize: 'clamp(10px, 2.8vw, 13.5px)' }}>{totalMarks}</td>
              </tr>
            </tbody>
          </table>

      {/* ── OVERALL STATS TABLE ────────────────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(10px, 2.5vw, 13px)' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: 'clamp(7.5px, 2vw, 10px)' }}>
            <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', width: '25%' }}>LIVE RANK</th>
            <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', width: '25%' }}>PERCENTILE</th>
            <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', width: '25%' }}>OFFICIAL SCORE</th>
            <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', width: '25%' }}>ACCURACY RATE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '12px 4px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
              <div style={{ fontWeight: '900', color: '#16a34a', fontSize: 'clamp(14px, 3.5vw, 18px)' }}>{rank?.rank ? `#${rank.rank}` : '#1'}</div>
              <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>Out of {rank?.total_appeared ? Number(rank.total_appeared).toLocaleString() : '2'}</div>
            </td>
            <td style={{ padding: '12px 4px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
              <div style={{ fontWeight: '900', color: '#0284c7', fontSize: 'clamp(14px, 3.5vw, 18px)' }}>{rank?.percentile ? `${Number(rank.percentile).toFixed(1)}%` : '100.0%'}</div>
              <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>Top {rank?.percentile ? (100 - rank.percentile).toFixed(1) : '0.0'}%</div>
            </td>
            <td style={{ padding: '12px 4px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
              <div style={{ fontWeight: '900', color: '#d97706', fontSize: 'clamp(14px, 3.5vw, 18px)' }}>{totalMarks}</div>
              <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>Max: {maxMarks}</div>
            </td>
            <td style={{ padding: '12px 4px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
              <div style={{ fontWeight: '900', color: '#9333ea', fontSize: 'clamp(14px, 3.5vw, 18px)' }}>{accuracy}%</div>
              <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: '700', marginTop: '2px' }}>{correct} / {totalAttempted} Correct</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── FOOTER TABLE ────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(8px, 2.2vw, 11px)' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', width: '60%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 11 2 2 4-4" />
                </svg>
                <div>
                  <div style={{ fontWeight: '800', color: '#0f172a' }}>Digitally Verified Official Score Card</div>
                  <div style={{ fontSize: '7.5px', color: '#64748b', marginTop: '1px' }}>Marking Scheme: +1.0 Correct, -0.33 Wrong, 0.0 Skipped</div>
                </div>
              </div>
            </td>
            <td style={{ padding: '8px 12px', background: '#ffffff', textAlign: 'right', border: '1px solid #cbd5e1', width: '40%' }}>
              <div style={{ fontWeight: '800', color: '#0f172a' }}>Certificate ID: RV1710726</div>
              <a href="https://RankVeda.in/verify" target="_blank" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>Verify on RankVeda.in</a>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ background: '#0f172a', padding: '6px 12px', color: 'rgba(255,255,255,0.7)', fontSize: '8px', textAlign: 'center' }}>
              This certificate is system generated and does not require a physical signature. © RankVeda
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export default MarksheetCard;
