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

  // Theme colours (inline for html2canvas)
  const BG_DARK = '#0a0a1a';
  const BG_CARD = '#111128';
  const BG_ROW_ALT = '#0f0f22';
  const BORDER = '#2a2a4a';
  const INDIGO = '#6366f1';
  const INDIGO_DARK = '#4338ca';
  const PURPLE = '#a855f7';
  const PINK = '#ec4899';
  const GREEN = '#22c55e';
  const RED = '#ef4444';
  const GRAY = '#4b5563';
  const TEXT_MAIN = '#f1f5f9';
  const TEXT_MUTED = '#94a3b8';
  const TEXT_DIM = '#64748b';
  const YELLOW = '#eab308';

  const headerGrad = 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)';
  const accentGrad = 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)';

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        background: BG_DARK,
        fontFamily: "'Segoe UI', Inter, Arial, sans-serif",
        color: TEXT_MAIN,
        borderRadius: '16px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: `1px solid ${BORDER}`,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
      }}
    >
      {/* ── TOP GRADIENT ACCENT LINE ─────────────────────────────────────── */}
      <div style={{ height: '3px', background: accentGrad }} />

      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div style={{
        background: headerGrad,
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        borderBottom: `1px solid rgba(99,102,241,0.25)`,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: '900', color: '#fff',
            boxShadow: '0 4px 15px rgba(99,102,241,0.5)',
          }}>⚡</div>
          <div>
            <div style={{
              fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px',
              background: 'linear-gradient(90deg, #a5b4fc, #c4b5fd, #f9a8d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              RankVeda
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(165,180,252,0.7)', marginTop: '1px', letterSpacing: '0.5px' }}>
              OFFICIAL SCORE CARD
            </div>
          </div>
        </div>

        {/* Exam Name Centre */}
        <div style={{ flex: 1, textAlign: 'center', padding: '0 20px' }}>
          <div style={{
            fontSize: '14px', fontWeight: '700', color: '#e2e8f0', lineHeight: 1.4,
          }}>
            {candidate?.exam_name || 'Railway Recruitment Board'}
          </div>
          {candidate?.subject && (
            <div style={{ fontSize: '11px', color: 'rgba(165,180,252,0.65)', marginTop: '3px' }}>
              {candidate.subject}
            </div>
          )}
        </div>

        {/* Date right */}
        <div style={{
          textAlign: 'right', flexShrink: 0,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '10px', padding: '8px 14px',
        }}>
          <div style={{ fontSize: '9px', color: 'rgba(165,180,252,0.6)', letterSpacing: '1px', textTransform: 'uppercase' }}>Generated</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#a5b4fc', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── CANDIDATE INFO + PHOTO ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${BORDER}`,
        background: BG_CARD,
      }}>
        {/* Info table */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
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
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : BG_ROW_ALT }}>
                  <td style={{
                    padding: '9px 16px',
                    fontWeight: '600',
                    color: TEXT_DIM,
                    borderBottom: `1px solid ${BORDER}`,
                    width: '195px',
                    borderRight: `1px solid ${BORDER}`,
                    fontSize: '11px',
                    letterSpacing: '0.2px',
                  }}>{label}</td>
                  <td style={{
                    padding: '9px 16px',
                    color: TEXT_MAIN,
                    borderBottom: `1px solid ${BORDER}`,
                    fontFamily: i >= 1 && i <= 2 ? 'monospace' : 'inherit',
                    fontSize: '12.5px',
                    fontWeight: i === 0 ? '700' : '500',
                  }}>{value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Photo box */}
        <div style={{
          width: '126px', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          borderLeft: `1px solid ${BORDER}`,
          padding: '16px 12px',
          background: 'rgba(99,102,241,0.05)',
        }}>
          {candidate?.photo_url ? (
            <img
              src={candidate.photo_url}
              alt="Candidate Photograph"
              style={{
                width: '96px', height: '118px',
                objectFit: 'cover',
                border: `2px solid ${INDIGO}`,
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}
              crossOrigin="anonymous"
            />
          ) : (
            <div style={{
              width: '96px', height: '118px',
              background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
              border: `2px solid ${INDIGO}`,
              borderRadius: '8px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            }}>
              <div style={{ fontSize: '36px', opacity: 0.5 }}>👤</div>
              <div style={{ fontSize: '9px', color: TEXT_DIM, marginTop: '4px', textAlign: 'center' }}>No Photo</div>
            </div>
          )}
          <div style={{
            marginTop: '8px', fontSize: '9px', color: TEXT_DIM,
            textAlign: 'center', lineHeight: 1.4, letterSpacing: '0.3px',
          }}>Application<br />Photograph</div>
        </div>
      </div>

      {/* ── SECTION-WISE SCORE TABLE ─────────────────────────────────────── */}
      <div style={{ background: BG_CARD }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(90deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.20) 100%)',
              borderBottom: `1px solid rgba(99,102,241,0.4)`,
            }}>
              {['Section', 'Total Qs', 'Not Attempted', 'Right ✓', 'Wrong ✗', 'Marks Scored'].map((h, i) => (
                <th key={i} style={{
                  padding: '11px 14px',
                  color: '#a5b4fc',
                  fontWeight: '700',
                  textAlign: i === 0 ? 'left' : 'center',
                  fontSize: '11px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  borderRight: i < 5 ? `1px solid rgba(99,102,241,0.2)` : 'none',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.length > 0 ? sections.map((sec, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : BG_ROW_ALT }}>
                <td style={{ padding: '9px 14px', fontWeight: '600', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MAIN }}>
                  {sec.name || `Section ${i + 1}`}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MUTED, fontWeight: '600' }}>
                  {sec.total ?? '—'}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GRAY }}>
                  {sec.na ?? '—'}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GREEN, fontWeight: '700' }}>
                  {sec.right ?? sec.correct ?? '—'}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: RED, fontWeight: '700' }}>
                  {sec.wrong ?? '—'}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, fontWeight: '700', color: '#818cf8' }}>
                  {sec.marks != null ? Number(sec.marks).toFixed(2) : '—'}
                </td>
              </tr>
            )) : (
              <tr style={{ background: BG_ROW_ALT }}>
                <td style={{ padding: '9px 14px', fontWeight: '600', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MAIN }}>Overall</td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: TEXT_MUTED }}>{maxMarks}</td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GRAY }}>{unattempted}</td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: GREEN, fontWeight: '700' }}>{correct}</td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, color: RED, fontWeight: '700' }}>{wrong}</td>
                <td style={{ padding: '9px 14px', textAlign: 'center', borderBottom: `1px solid ${BORDER}`, fontWeight: '700', color: '#818cf8' }}>{totalMarks}</td>
              </tr>
            )}

            {/* Total Row */}
            <tr style={{
              background: 'linear-gradient(90deg, rgba(234,179,8,0.12) 0%, rgba(234,179,8,0.06) 100%)',
              borderTop: `1px solid rgba(234,179,8,0.3)`,
              fontWeight: '800',
            }}>
              <td style={{ padding: '10px 14px', borderRight: `1px solid rgba(234,179,8,0.2)`, color: YELLOW, letterSpacing: '0.5px', fontSize: '11px', textTransform: 'uppercase' }}>Total</td>
              <td style={{ padding: '10px 14px', textAlign: 'center', borderRight: `1px solid rgba(234,179,8,0.2)`, color: YELLOW }}>{totalQs}</td>
              <td style={{ padding: '10px 14px', textAlign: 'center', borderRight: `1px solid rgba(234,179,8,0.2)`, color: YELLOW }}>{totalNA}</td>
              <td style={{ padding: '10px 14px', textAlign: 'center', borderRight: `1px solid rgba(234,179,8,0.2)`, color: '#4ade80', fontSize: '14px' }}>{totalRight}</td>
              <td style={{ padding: '10px 14px', textAlign: 'center', borderRight: `1px solid rgba(234,179,8,0.2)`, color: '#f87171', fontSize: '14px' }}>{totalWrong}</td>
              <td style={{ padding: '10px 14px', textAlign: 'center', color: '#818cf8', fontSize: '16px' }}>{totalMarks}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── RANK / PERCENTILE / SCORE / ACCURACY ─────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '0',
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
        background: BG_DARK,
      }}>
        {[
          {
            label: 'LIVE RANK',
            value: rank?.rank ? `#${rank.rank}` : '—',
            sub: rank?.total_appeared ? `of ${Number(rank.total_appeared).toLocaleString()} students` : 'Real-time rank',
            icon: '🏆',
            gradStart: 'rgba(239,68,68,0.12)',
            gradEnd: 'rgba(239,68,68,0.05)',
            valueColor: '#f87171',
            borderColor: 'rgba(239,68,68,0.25)',
            labelColor: '#fca5a5',
          },
          {
            label: 'PERCENTILE',
            value: rank?.percentile ? `${Number(rank.percentile).toFixed(1)}%` : '—',
            sub: rank?.percentile ? `Top ${(100 - rank.percentile).toFixed(1)}%` : 'Based on live data',
            icon: '📊',
            gradStart: 'rgba(34,197,94,0.12)',
            gradEnd: 'rgba(34,197,94,0.05)',
            valueColor: '#4ade80',
            borderColor: 'rgba(34,197,94,0.25)',
            labelColor: '#86efac',
          },
          {
            label: 'TOTAL SCORE',
            value: totalMarks,
            sub: `out of ${maxMarks} marks`,
            icon: '⭐',
            gradStart: 'rgba(99,102,241,0.15)',
            gradEnd: 'rgba(99,102,241,0.06)',
            valueColor: '#818cf8',
            borderColor: 'rgba(99,102,241,0.3)',
            labelColor: '#a5b4fc',
          },
          {
            label: 'ACCURACY',
            value: `${accuracy}%`,
            sub: `${correct} correct of ${totalAttempted} attempted`,
            icon: '🎯',
            gradStart: 'rgba(168,85,247,0.12)',
            gradEnd: 'rgba(168,85,247,0.05)',
            valueColor: '#c084fc',
            borderColor: 'rgba(168,85,247,0.25)',
            labelColor: '#d8b4fe',
          },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '18px 14px',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${card.gradStart} 0%, ${card.gradEnd} 100%)`,
            borderRight: i < 3 ? `1px solid ${card.borderColor}` : 'none',
            position: 'relative',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{card.icon}</div>
            <div style={{
              fontSize: '9px', fontWeight: '800', color: card.labelColor,
              letterSpacing: '2px', marginBottom: '5px', textTransform: 'uppercase',
            }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '28px', fontWeight: '900', color: card.valueColor,
              lineHeight: 1, letterSpacing: '-1px',
              textShadow: `0 0 20px ${card.valueColor}60`,
            }}>
              {card.value}
            </div>
            <div style={{
              fontSize: '10px', color: TEXT_DIM, marginTop: '5px', lineHeight: 1.3,
            }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#07071a',
        padding: '12px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        fontSize: '11px',
        color: TEXT_DIM,
        borderTop: `1px solid ${BORDER}`,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: '700', color: TEXT_MUTED }}>Marking Scheme:</span>
        <span>
          Correct: <strong style={{ color: GREEN }}>+1</strong>
        </span>
        <span>
          Wrong: <strong style={{ color: RED }}>-1/3</strong>
        </span>
        <span>
          Unattempted: <strong style={{ color: GRAY }}>0</strong>
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '20px', padding: '3px 10px',
            color: '#a5b4fc', fontSize: '10px', fontWeight: '700',
          }}>
            ⚡ RankVeda.in
          </span>
          <span style={{ color: TEXT_DIM, fontSize: '10px' }}>Score may vary from official result</span>
        </span>
      </div>

      {/* ── BOTTOM GRADIENT LINE ─────────────────────────────────────── */}
      <div style={{ height: '3px', background: accentGrad }} />
    </div>
  );
});

export default MarksheetCard;
