import { forwardRef } from 'react';

/**
 * MarksheetCard — Professional Score Card designed to match RRB official marksheet style.
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

  return (
    <div
      ref={ref}
      style={{
        width: '860px',
        background: '#ffffff',
        fontFamily: "'Segoe UI', Arial, sans-serif",
        color: '#1a1a2e',
        borderRadius: '0',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '2px solid #cc0000',
      }}
    >
      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #cc0000 0%, #9b0000 100%)',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '22px', fontWeight: '900',
            color: '#cc0000', flexShrink: 0,
          }}>R</div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>
              ⚡ RankVeda
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', marginTop: '1px' }}>
              Official Score Card • rankveda.in
            </div>
          </div>
        </div>

        <div style={{ flex: 1, textAlign: 'center', padding: '0 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', lineHeight: 1.5 }}>
            {candidate?.exam_name || 'Railway Recruitment Board'}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
            {candidate?.subject || ''}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>Generated On</div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>
            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── CANDIDATE INFO + PHOTO ─────────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '2px solid #cc0000' }}>
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
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
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{
                    padding: '8px 12px', fontWeight: '700', color: '#333',
                    borderBottom: '1px solid #e5e7eb', width: '200px',
                    borderRight: '1px solid #e5e7eb', fontSize: '12px',
                  }}>{label}</td>
                  <td style={{
                    padding: '8px 12px', color: '#1a1a2e',
                    borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace',
                    fontSize: '13px', fontWeight: '600',
                  }}>{value || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          width: '120px', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          borderLeft: '2px solid #cc0000', padding: '12px',
          background: '#fef2f2',
        }}>
          {candidate?.photo_url ? (
            <img
              src={candidate.photo_url}
              alt="Candidate Photograph"
              style={{
                width: '96px', height: '120px',
                objectFit: 'cover', border: '2px solid #cc0000',
                borderRadius: '4px',
              }}
              crossOrigin="anonymous"
            />
          ) : (
            <div style={{
              width: '96px', height: '120px',
              background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
              border: '2px solid #cc0000', borderRadius: '4px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '40px', color: '#9ca3af',
            }}>
              👤
              <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px', textAlign: 'center' }}>No Photo</div>
            </div>
          )}
          <div style={{
            marginTop: '6px', fontSize: '9px', color: '#6b7280',
            textAlign: 'center', lineHeight: 1.3,
          }}>Application<br />Photograph</div>
        </div>
      </div>

      {/* ── SECTION-WISE SCORE TABLE ─────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#cc0000' }}>
            {['Section', 'Total Qs', 'Not Attempted', 'Right ✓', 'Wrong ✗', 'Marks Scored'].map((h, i) => (
              <th key={i} style={{
                padding: '10px 12px', color: '#fff', fontWeight: '700',
                textAlign: i === 0 ? 'left' : 'center', fontSize: '12px',
                borderRight: i < 5 ? '1px solid rgba(255,255,255,0.3)' : 'none',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.length > 0 ? sections.map((sec, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fef2f2' }}>
              <td style={{ padding: '9px 12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', color: '#1a1a2e' }}>
                {sec.name || `Section ${i + 1}`}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: '600' }}>
                {sec.total ?? '—'}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', color: '#6b7280' }}>
                {sec.na ?? '—'}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', color: '#16a34a', fontWeight: '700' }}>
                {sec.right ?? sec.correct ?? '—'}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', color: '#dc2626', fontWeight: '700' }}>
                {sec.wrong ?? '—'}
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#1d4ed8' }}>
                {sec.marks != null ? Number(sec.marks).toFixed(2) : '—'}
              </td>
            </tr>
          )) : (
            <tr style={{ background: '#fef2f2' }}>
              <td style={{ padding: '9px 12px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>Overall</td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{maxMarks}</td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', color: '#6b7280' }}>{unattempted}</td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', color: '#16a34a', fontWeight: '700' }}>{correct}</td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', color: '#dc2626', fontWeight: '700' }}>{wrong}</td>
              <td style={{ padding: '9px 12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: '700', color: '#1d4ed8' }}>{totalMarks}</td>
            </tr>
          )}

          {/* Total Row */}
          <tr style={{ background: '#fef08a', fontWeight: '800' }}>
            <td style={{ padding: '10px 12px', borderTop: '2px solid #ca8a04', borderRight: '1px solid #ca8a04', color: '#78350f' }}>Total</td>
            <td style={{ padding: '10px 12px', textAlign: 'center', borderTop: '2px solid #ca8a04', borderRight: '1px solid #ca8a04', color: '#78350f' }}>
              {sections.length > 0 ? sections.reduce((s, r) => s + (r.total || 0), 0) : maxMarks}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'center', borderTop: '2px solid #ca8a04', borderRight: '1px solid #ca8a04', color: '#78350f' }}>
              {sections.length > 0 ? sections.reduce((s, r) => s + (r.na || 0), 0) : unattempted}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'center', borderTop: '2px solid #ca8a04', borderRight: '1px solid #ca8a04', color: '#15803d' }}>
              {sections.length > 0 ? sections.reduce((s, r) => s + (r.right || r.correct || 0), 0) : correct}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'center', borderTop: '2px solid #ca8a04', borderRight: '1px solid #ca8a04', color: '#b91c1c' }}>
              {sections.length > 0 ? sections.reduce((s, r) => s + (r.wrong || 0), 0) : wrong}
            </td>
            <td style={{ padding: '10px 12px', textAlign: 'center', borderTop: '2px solid #ca8a04', color: '#1d4ed8', fontSize: '15px' }}>
              {totalMarks}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── RANK / PERCENTILE / ACCURACY SUMMARY ────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '0', borderTop: '2px solid #cc0000',
      }}>
        {[
          {
            label: 'LIVE RANK', value: rank?.rank ? `#${rank.rank}` : '—',
            sub: rank?.total_appeared ? `of ${Number(rank.total_appeared).toLocaleString()} students` : 'Real-time rank',
            bg: '#fef2f2', accent: '#cc0000', valueColor: '#9b0000',
          },
          {
            label: 'PERCENTILE', value: rank?.percentile ? `${Number(rank.percentile).toFixed(1)}%` : '—',
            sub: rank?.percentile ? `Top ${(100 - rank.percentile).toFixed(1)}%` : 'Based on live data',
            bg: '#f0fdf4', accent: '#16a34a', valueColor: '#15803d',
          },
          {
            label: 'TOTAL SCORE', value: totalMarks,
            sub: `out of ${maxMarks} marks`,
            bg: '#eff6ff', accent: '#2563eb', valueColor: '#1d4ed8',
          },
          {
            label: 'ACCURACY', value: `${accuracy}%`,
            sub: `${correct} correct of ${totalAttempted} attempted`,
            bg: '#fdf4ff', accent: '#9333ea', valueColor: '#7e22ce',
          },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '16px 12px', textAlign: 'center', background: card.bg,
            borderRight: i < 3 ? `1px solid ${card.accent}55` : 'none',
          }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: card.accent, letterSpacing: '1.5px', marginBottom: '4px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: card.valueColor, lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1e293b', padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: '24px',
        fontSize: '11px', color: '#94a3b8',
      }}>
        <span style={{ fontWeight: '700', color: '#e2e8f0' }}>Marking Scheme:</span>
        <span>✅ Correct: <strong style={{ color: '#4ade80' }}>+1</strong></span>
        <span>❌ Wrong: <strong style={{ color: '#f87171' }}>-1/3</strong></span>
        <span>⏳ Unattempted: <strong>0</strong></span>
        <span style={{ marginLeft: 'auto' }}>
          🔒 Powered by <strong style={{ color: '#818cf8' }}>RankVeda.in</strong> — Score may vary from official result
        </span>
      </div>
    </div>
  );
});

export default MarksheetCard;

