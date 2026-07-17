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

  // Theme colours matching RankVeda's cohesive official light-slate & navy website design (inline for html2canvas)
  const BG_WHITE = '#ffffff';
  const BG_ROW_ALT = '#f8fafc';
  const BORDER = '#e2e8f0';
  const BORDER_DARK = '#cbd5e1';
  const INDIGO = '#6366f1';
  const INDIGO_DARK = '#4338ca';
  const GREEN = '#059669';
  const RED = '#e11d48';
  const GRAY = '#475569';
  const TEXT_MAIN = '#0f172a';
  const TEXT_MUTED = '#64748b';
  const TEXT_DIM = '#475569';
  const YELLOW_TEXT = '#854d0e';

  const headerGrad = 'linear-gradient(135deg, #080b24 0%, #1e1b4b 60%, #312e81 100%)';
  const accentGrad = 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)';

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
        border: `1px solid ${BORDER_DARK}`,
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
      }}
    >
      {/* ── TOP GRADIENT ACCENT LINE ─────────────────────────────────────── */}
      <div style={{ height: '4px', background: accentGrad }} />

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div style={{
        background: headerGrad,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        borderBottom: `1px solid rgba(99,102,241,0.25)`,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '900', color: '#fff',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}>⚡</div>
          <div>
            <div style={{
              fontSize: '16px', fontWeight: '900', color: '#fff', letterSpacing: '-0.3px',
              background: 'linear-gradient(90deg, #ffffff, #a5b4fc, #e0e7ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              RankVeda
            </div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: '#a5b4fc', marginTop: '1px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              Official Score & Rank Certificate
            </div>
          </div>
        </div>

        {/* Exam Name Centre */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 12px' }}>
          <div style={{
            fontSize: '13px', fontWeight: '800', color: '#ffffff', lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.3px'
          }}>
            {candidate?.exam_name || 'Railway Recruitment Board / Official Exam'}
          </div>
          {candidate?.subject && (
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#c4b5fd', marginTop: '2px' }}>
              {candidate.subject}
            </div>
          )}
        </div>

        {/* Date right */}
        <div style={{
          textAlign: 'right', flexShrink: 0,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '8px', padding: '6px 10px',
        }}>
          <div style={{ fontSize: '8px', fontWeight: '700', color: '#cbd5e1', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Verified On</div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── CANDIDATE INFO TABLE ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${BORDER}`,
        background: BG_WHITE,
      }}>
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <tbody>
              {[
                ['Candidate Name', candidate?.name],
                ['Registration Number', candidate?.registration_no],
                ['Roll Number', candidate?.roll_number],
                ['Community / Category', candidate?.community],
                ['Test Centre', candidate?.test_centre_name],
                ['Exam Date', candidate?.test_date],
                ['Exam Time / Shift', candidate?.test_time],
              ].map(([label, value], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : BG_ROW_ALT }}>
                  <td style={{
                    padding: '7px 12px',
                    fontWeight: '700',
                    color: TEXT_DIM,
                    borderBottom: `1px solid ${BORDER}`,
                    width: '140px',
                    borderRight: `1px solid ${BORDER}`,
                    fontSize: '10.5px',
                    letterSpacing: '0.2px',
                  }}>{label}</td>
                  <td style={{
                    padding: '7px 12px',
                    color: TEXT_MAIN,
                    borderBottom: `1px solid ${BORDER}`,
                    fontFamily: i >= 1 && i <= 2 ? 'monospace' : 'inherit',
                    fontSize: '11.5px',
                    fontWeight: i === 0 ? '800' : '600',
                  }}>{value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION-WISE SCORE TABLE ─────────────────────────────────────── */}
      <div style={{ background: BG_WHITE }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(90deg, #e0e7ff 0%, #f3e8ff 100%)',
              borderBottom: `2px solid ${INDIGO}`,
            }}>
              {['Section', 'Total Qs', 'Skipped', 'Correct', 'Wrong', 'Net Marks'].map((h, i) => (
                <th key={i} style={{
                  padding: '8px 10px',
                  color: '#1e1b4b',
                  fontWeight: '800',
                  textAlign: i === 0 ? 'left' : 'center',
                  fontSize: '10px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  borderRight: i < 5 ? `1px solid rgba(99,102,241,0.18)` : 'none',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.length > 0 ? sections.map((sec, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : BG_ROW_ALT }}>
                <td style={{ padding: '7px 10px', fontWeight: '700', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MAIN, fontSize: '11.5px' }}>
                  {sec.name || `Section ${i + 1}`}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MUTED, fontWeight: '700', fontSize: '11.5px' }}>
                  {sec.total ?? '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GRAY, fontWeight: '600', fontSize: '11.5px' }}>
                  {sec.na ?? '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GREEN, fontWeight: '800', fontSize: '11.5px' }}>
                  {sec.right ?? sec.correct ?? '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: RED, fontWeight: '800', fontSize: '11.5px' }}>
                  {sec.wrong ?? '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, fontWeight: '800', color: INDIGO_DARK, fontSize: '11.5px' }}>
                  {sec.marks != null ? Number(sec.marks).toFixed(2) : '—'}
                </td>
              </tr>
            )) : (
              <tr style={{ background: BG_ROW_ALT }}>
                <td style={{ padding: '8px 10px', fontWeight: '700', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MAIN, fontSize: '12px' }}>Overall Performance</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MUTED, fontWeight: '700', fontSize: '12px' }}>{maxMarks}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GRAY, fontWeight: '600', fontSize: '12px' }}>{unattempted}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GREEN, fontWeight: '800', fontSize: '12px' }}>{correct}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: RED, fontWeight: '800', fontSize: '12px' }}>{wrong}</td>
                <td style={{ padding: '8px 10px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, fontWeight: '800', color: INDIGO_DARK, fontSize: '12px' }}>{totalMarks}</td>
              </tr>
            )}

            {/* Total Row */}
            <tr style={{
              background: 'linear-gradient(90deg, #fefce8 0%, #fef9c3 100%)',
              borderTop: `2px solid #eab308`,
              borderBottom: `1px solid #cbd5e1`,
              fontWeight: '800',
            }}>
              <td style={{ padding: '8px 10px', borderRight: `1px solid #fde047`, color: YELLOW_TEXT, letterSpacing: '0.5px', fontSize: '10px', textTransform: 'uppercase' }}>Overall Total</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: `1px solid #fde047`, color: YELLOW_TEXT, fontSize: '12px' }}>{totalQs}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: `1px solid #fde047`, color: YELLOW_TEXT, fontSize: '12px' }}>{totalNA}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: `1px solid #fde047`, color: GREEN, fontSize: '12.5px' }}>{totalRight}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: `1px solid #fde047`, color: RED, fontSize: '12.5px' }}>{totalWrong}</td>
              <td style={{ padding: '8px 10px', textAlign: 'center', color: INDIGO_DARK, fontSize: '13px', fontWeight: '900' }}>{totalMarks}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── RANK / PERCENTILE / SCORE / ACCURACY STATS GRID ──────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '0',
        borderBottom: `1px solid ${BORDER_DARK}`,
        background: BG_WHITE,
      }}>
        {[
          {
            label: 'LIVE RANK',
            value: rank?.rank ? `#${rank.rank}` : '—',
            sub: rank?.total_appeared ? `of ${Number(rank.total_appeared).toLocaleString()} candidates` : 'Verified Live Rank',
            icon: '🏆',
            gradStart: '#fff1f2',
            gradEnd: '#ffe4e6',
            valueColor: '#be123c',
            borderColor: '#fecdd3',
            labelColor: '#9f1239',
          },
          {
            label: 'PERCENTILE',
            value: rank?.percentile ? `${Number(rank.percentile).toFixed(1)}%` : '—',
            sub: rank?.percentile ? `Top ${(100 - rank.percentile).toFixed(1)}%` : 'Percentile Score',
            icon: '📊',
            gradStart: '#ecfdf5',
            gradEnd: '#d1fae5',
            valueColor: '#047857',
            borderColor: '#a7f3d0',
            labelColor: '#065f46',
          },
          {
            label: 'OFFICIAL SCORE',
            value: totalMarks,
            sub: `Out of ${maxMarks} Max Marks`,
            icon: '⭐',
            gradStart: '#eef2ff',
            gradEnd: '#e0e7ff',
            valueColor: '#4338ca',
            borderColor: '#c7d2fe',
            labelColor: '#312e81',
          },
          {
            label: 'ACCURACY RATE',
            value: `${accuracy}%`,
            sub: `${correct} Correct / ${totalAttempted} Att.`,
            icon: '🎯',
            gradStart: '#faf5ff',
            gradEnd: '#f3e8ff',
            valueColor: '#7e22ce',
            borderColor: '#e9d5ff',
            labelColor: '#581c87',
          },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '12px 10px',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${card.gradStart} 0%, ${card.gradEnd} 100%)`,
            borderRight: i < 3 ? `1px solid ${card.borderColor}` : 'none',
            position: 'relative',
          }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{card.icon}</div>
            <div style={{
              fontSize: '9px', fontWeight: '800', color: card.labelColor,
              letterSpacing: '1px', marginBottom: '3px', textTransform: 'uppercase',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '22px', fontWeight: '900', color: card.valueColor,
              lineHeight: 1.05, letterSpacing: '-0.5px',
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: '9px', fontWeight: '600', color: TEXT_MUTED, marginTop: '4px', lineHeight: 1.2,
            }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#080b24',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '10px',
        color: '#94a3b8',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: '700', color: '#f1f5f9' }}>Marking Scheme:</span>
        <span>Correct: <strong style={{ color: '#4ade80', fontWeight: '800' }}>+1.0</strong></span>
        <span>Wrong: <strong style={{ color: '#f87171', fontWeight: '800' }}>-0.33</strong></span>
        <span>Skipped: <strong style={{ color: '#cbd5e1', fontWeight: '800' }}>0.0</strong></span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'rgba(99,102,241,0.25)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: '20px', padding: '3px 10px',
            color: '#ffffff', fontSize: '9.5px', fontWeight: '800', letterSpacing: '0.3px'
          }}>
            ⚡ RankVeda.in Official Certificate
          </span>
          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: '600' }}>Digital Verified</span>
        </span>
      </div>

      {/* ── BOTTOM GRADIENT LINE ─────────────────────────────────────── */}
      <div style={{ height: '4px', background: accentGrad }} />
    </div>
  );
});

export default MarksheetCard;
