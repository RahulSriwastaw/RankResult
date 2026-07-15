import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import MarksheetCard from '../components/MarksheetCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShareAlt, FaMoon, FaSun, FaCoins, FaChevronDown, FaChevronUp,
  FaDownload, FaShoppingBag, FaUser, FaCheckCircle, FaTimesCircle,
  FaClock, FaTrophy, FaPercent, FaBullseye, FaThumbsUp, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const QuestionItem = ({ q, resultId, onUnlock, authUser }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [solutions, setSolutions] = useState(q.solutions || []);
  const [solIndex, setSolIndex] = useState(0);

  const isCorrect = q.student_answer && q.student_answer === q.correct_answer;
  const isWrong = q.student_answer && q.student_answer !== q.correct_answer;
  const status = isCorrect ? 'correct' : isWrong ? 'wrong' : 'unattempted';
  const borderMap = { correct: 'border-l-green-500', wrong: 'border-l-red-500', unattempted: 'border-l-gray-600' };
  const badge = { correct: 'bg-green-600', wrong: 'bg-red-600', unattempted: 'bg-gray-700' };

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/questions/${resultId}/questions/${q.id}/unlock`, { 
        user_id: authUser?.id || 1 
      });
      setSolutions(res.data.solutions);
      setIsUnlocked(true);
      if (onUnlock) onUnlock(res.data.newBalance);
      toast.success('Solutions unlocked!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error occurred');
    } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/questions/${resultId}/questions/${q.id}/generate`, { 
        user_id: authUser?.id || 1 
      });
      const tempSol = res.data.solution;
      setSolutions(prev => [...prev, tempSol]);
      setSolIndex(solutions.length); // jump to the new one
      if (onUnlock) onUnlock(res.data.newBalance);
      toast.success('Temporary solution generated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error occurred');
    } finally { setLoading(false); }
  };

  const handlePublish = async (tempSol) => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/questions/${resultId}/questions/${q.id}/publish`, {
        user_id: authUser?.id || 1,
        solution: tempSol
      });
      // Replace temp solution with published one from server
      setSolutions(prev => {
        const arr = [...prev];
        arr[solIndex] = res.data.solution;
        return arr;
      });
      toast.success('Solution published successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error occurred');
    } finally { setLoading(false); }
  };

  const handleLike = async (solId) => {
    // Cannot like temporary solutions
    if (String(solId).startsWith('temp_')) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/questions/solutions/${solId}/like`, { user_id: authUser?.id || 1 });
      setSolutions(prev => {
        const updated = prev.map(s => s.id === solId ? { ...s, likes: res.data.likes } : s);
        return updated.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      });
      setSolIndex(0);
      toast.success('Solution liked!');
    } catch (err) {
      toast.error('Failed to like solution');
    }
  };

  return (
    <div className={`border-l-4 ${borderMap[status]} rounded-xl bg-white/5 dark:bg-black/20 border border-white/10 dark:border-gray-700/30 overflow-hidden transition`}>
      <div className="flex items-center justify-between p-3 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold text-gray-500 w-8 shrink-0">Q{q.question_no}</span>
          <span className="text-sm text-gray-300 truncate" dangerouslySetInnerHTML={{ __html: q.question_text || `Question ${q.question_no}` }}></span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-xs px-2 py-0.5 rounded-full text-white font-bold ${badge[status]}`}>
            {status === 'correct' ? '+1' : status === 'wrong' ? '-0.33' : '0'}
          </span>
          {expanded ? <FaChevronUp className="text-gray-500 text-xs" /> : <FaChevronDown className="text-gray-500 text-xs" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-3 border-t border-white/10 text-sm space-y-3">
              {/* Options rendering */}
              <div className="space-y-2 mt-2">
                {['a', 'b', 'c', 'd'].map(opt => {
                  const optText = q.parsed_payload?.[`option_${opt}_text`];
                  const optId = q.parsed_payload?.[`option_${opt}_id`];
                  if (!optText) return null;
                  const isOptCorrect = q.parsed_payload?.correct_option_text === optText;
                  const isOptSelected = q.student_option_text === optText;
                  let optStyle = 'border-gray-700 bg-gray-800/30 text-gray-300';
                  if (isOptCorrect) optStyle = 'border-green-500 bg-green-900/30 text-green-300 font-bold';
                  else if (isOptSelected && !isOptCorrect) optStyle = 'border-red-500 bg-red-900/30 text-red-300';
                  
                  return (
                    <div key={opt} className={`p-2 border rounded-lg ${optStyle} flex gap-2 items-start`}>
                      <span className="font-medium shrink-0 uppercase">{opt}.</span>
                      <span dangerouslySetInnerHTML={{ __html: optText }}></span>
                      {isOptSelected && <span className="ml-auto text-xs opacity-70">(Your Answer)</span>}
                      {isOptCorrect && <span className="ml-auto text-xs opacity-70">(Correct Answer)</span>}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-gray-700/50 flex flex-wrap gap-4 text-xs text-gray-400">
                 <p><span className="text-gray-500">Marks:</span> <span className="font-bold">{q.marks_awarded}</span></p>
                 <p><span className="text-gray-500">Question ID:</span> <span>{q.question_id_html || 'N/A'}</span></p>
                 <p><span className="text-gray-500">Chosen Option ID:</span> <span>{q.option_id || 'N/A'}</span></p>
              </div>
              
              {/* AI Solution Section */}
              <div className="mt-2 pt-2 border-t border-white/10">
                {isUnlocked ? (
                  <div className="p-3 bg-indigo-900/40 rounded-xl border border-indigo-700/30">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold text-indigo-400 flex items-center gap-2">
                        🤖 AI Solutions {solutions.length > 0 && <span className="text-xs text-indigo-300">({solIndex + 1}/{solutions.length})</span>}
                      </p>
                      
                      {/* Only allow generation if total saved solutions < 5 and we haven't hit the limit of temps */}
                      {solutions.filter(s => !s.is_temporary).length < 5 && (
                        <button onClick={handleGenerate} disabled={loading} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded text-white disabled:opacity-50">
                          {loading ? '...' : '+ Generate Your Own (5 pts)'}
                        </button>
                      )}
                    </div>
                    
                    {solutions.length > 0 ? (
                      <div className="relative mt-3">
                        {solutions.length > 1 && (
                          <>
                            <button onClick={() => setSolIndex(prev => Math.max(0, prev - 1))} disabled={solIndex === 0} className="absolute left-[-10px] top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full disabled:opacity-0 hover:bg-black/80 transition z-10">
                              <FaChevronLeft className="text-xs" />
                            </button>
                            <button onClick={() => setSolIndex(prev => Math.min(solutions.length - 1, prev + 1))} disabled={solIndex === solutions.length - 1} className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full disabled:opacity-0 hover:bg-black/80 transition z-10">
                              <FaChevronRight className="text-xs" />
                            </button>
                          </>
                        )}
                        
                        <div className="px-6 min-h-[60px]">
                          {solutions[solIndex].is_temporary && (
                            <div className="mb-2 inline-block bg-yellow-600/30 text-yellow-300 text-[10px] px-2 py-0.5 rounded border border-yellow-600/50 uppercase font-bold">
                              Temporary Preview
                            </div>
                          )}
                          <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{solutions[solIndex].explanation}</p>
                          {solutions[solIndex].why_wrong && (
                            <p className="mt-2 text-orange-300 text-xs"><span className="font-medium">Insights:</span> {solutions[solIndex].why_wrong}</p>
                          )}
                          <div className="mt-3 flex justify-between items-center">
                             <div className="text-xs text-gray-500">By: {solutions[solIndex].user_name || 'AI'}</div>
                             <div className="flex gap-2 items-center">
                               {solutions[solIndex].is_temporary ? (
                                  <button onClick={() => handlePublish(solutions[solIndex])} disabled={loading} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition font-medium">
                                    {loading ? 'Saving...' : 'Save to Public'}
                                  </button>
                               ) : (
                                  <button onClick={() => handleLike(solutions[solIndex].id)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-indigo-200 bg-indigo-900/50 hover:bg-indigo-800/50 border border-indigo-700/50 px-3 py-1.5 rounded-full transition">
                                    <FaThumbsUp /> {solutions[solIndex].likes || 0}
                                  </button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-400">
                         No public solutions yet. Be the first to generate one!
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleUnlock} disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs transition disabled:opacity-50 flex items-center gap-2">
                    <FaCoins /> {loading ? 'Unlocking...' : 'Show Solutions (5 pts)'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function ResultPage() {
  const router = useRouter();
  const { url, exam } = router.query;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [balance, setBalance] = useState(0);
  const [authUser, setAuthUser] = useState(null);
  const [rank, setRank] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const marksheetRef = useRef(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('rv_user');
      if (u) try { setAuthUser(JSON.parse(u)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    const fetchResult = async () => {
      try {
        const res = await axios.post('http://localhost:5000/api/results/', {
          url: decodeURIComponent(url),
          exam_id: exam || 1
        });
        setData(res.data);
        try {
          const score = res.data?.result?.score;
          if (score !== undefined && score !== null) {
            const rankRes = await axios.get(`http://localhost:5000/api/results/rank?exam_id=${exam || 1}&score=${score}`);
            setRank(rankRes.data);
          }
        } catch {}
        try {
          const uid = authUser?.id || 1;
          const pRes = await axios.get(`http://localhost:5000/api/user/${uid}/points`);
          setBalance(pRes.data.balance);
        } catch {}
      } catch (err) {
        toast.error(err.response?.data?.error || 'Result not found');
      } finally { setLoading(false); }
    };
    fetchResult();
  }, [url, exam, authUser]);

  const buildSections = (result, questions) => {
    const sw = result?.section_wise;
    if (Array.isArray(sw) && sw.length > 0) return sw;
    if (sw && typeof sw === 'object' && !Array.isArray(sw) && Object.keys(sw).length > 0) {
      return Object.entries(sw).map(([name, marks]) => ({ name, marks, total: null, na: null, right: null, wrong: null }));
    }
    if (!questions?.length) return [];
    const groups = {};
    questions.forEach(q => {
      const sn = q.parsed_payload?.section_name || 'Overall';
      if (!groups[sn]) groups[sn] = { name: sn, total: 0, na: 0, right: 0, wrong: 0, marks: 0 };
      groups[sn].total++;
      if (q.status === 'correct') { groups[sn].right++; groups[sn].marks = +(groups[sn].marks + 1).toFixed(2); }
      else if (q.status === 'wrong') { groups[sn].wrong++; groups[sn].marks = +(groups[sn].marks - 1/3).toFixed(2); }
      else groups[sn].na++;
    });
    return Object.values(groups);
  };

  const handleDownload = async (format = 'image') => {
    if (!marksheetRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(marksheetRef.current, {
        backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true
      });
      const rollNo = data?.result?.roll_number || 'result';
      if (format === 'image') {
        const link = document.createElement('a');
        link.download = `RankVeda_Scorecard_${rollNo}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('✅ Score card downloaded!');
      } else {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`RankVeda_Scorecard_${rollNo}.pdf`);
        toast.success('✅ PDF downloaded!');
      }
    } catch (e) { toast.error('Download failed: ' + e.message); }
    finally { setDownloading(false); }
  };

  const handleShare = () => {
    const text = `I scored ${data?.result?.score} marks in ${data?.result?.subject || 'the exam'}! Check your score at RankVeda.`;
    if (navigator.share) navigator.share({ title: 'My RankVeda Score Card', text, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm animate-pulse">Fetching your result...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <p className="text-red-400 text-xl mb-4">Result not found</p>
        <button onClick={() => router.push('/')} className="text-indigo-400 underline">Go back</button>
      </div>
    </div>
  );

  const { result, questions } = data;
  const sections = buildSections(result, questions);
  const filteredQs = questions.filter(q => {
    if (filter === 'correct') return q.student_answer && q.student_answer === q.correct_answer;
    if (filter === 'wrong') return q.student_answer && q.student_answer !== q.correct_answer;
    if (filter === 'unattempted') return !q.student_answer;
    return true;
  });
  const correctCount = result.total_correct || questions.filter(q => q.status === 'correct').length;
  const wrongCount = result.total_wrong || questions.filter(q => q.status === 'wrong').length;
  const naCount = result.total_unattempted || questions.filter(q => q.status === 'unattempted').length;
  const totalQs = questions.length || 100;
  const accuracy = (correctCount + wrongCount) > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 100) : 0;

  const candidateForCard = {
    name: result.candidate_name,
    roll_number: result.roll_number,
    registration_no: result.registration_number,
    exam_name: result.exam_name || result.subject || 'Competitive Exam',
    test_date: result.test_date,
    test_time: result.test_time,
    subject: result.subject,
    community: result.community,
    test_centre_name: result.test_centre_name,
    photo_url: result.application_photograph || result.photo_url,
  };
  const scoreForCard = {
    total_marks: result.score,
    correct: correctCount,
    wrong: wrongCount,
    unattempted: naCount,
    max_marks: totalQs,
    sections,
  };
  const rankForCard = {
    rank: rank?.rank || result.rank,
    total_appeared: rank?.total_appeared,
    percentile: rank?.percentile || result.percentile,
  };

  const pageTitle = result.candidate_name
    ? `${result.candidate_name} — ${result.subject || 'Score Card'} | RankVeda`
    : `Score Card — ${result.subject || 'Competitive Exam'} | RankVeda`;
  const pageDesc = `Check ${result.candidate_name || 'your'}'s score: ${result.score} marks, Rank #${rank?.rank || result.rank}, Percentile ${(rank?.percentile || result.percentile || 0).toFixed ? (rank?.percentile || result.percentile || 0).toFixed(1) : '—'}% in ${result.subject || 'the exam'}. Download score card from RankVeda.`;

  const sectionBarData = {
    labels: sections.length > 0 ? sections.map(s => (s.name || '').split(' ').slice(0, 2).join(' ')) : ['Correct', 'Wrong', 'Skipped'],
    datasets: sections.length > 0 ? [
      { label: 'Right', data: sections.map(s => s.right ?? 0), backgroundColor: '#22c55e', borderRadius: 4 },
      { label: 'Wrong', data: sections.map(s => s.wrong ?? 0), backgroundColor: '#ef4444', borderRadius: 4 },
      { label: 'NA', data: sections.map(s => s.na ?? 0), backgroundColor: '#6b7280', borderRadius: 4 },
    ] : [{ label: 'Count', data: [correctCount, wrongCount, naCount], backgroundColor: ['#22c55e', '#ef4444', '#6b7280'], borderRadius: 4 }]
  };

  const donutData = {
    labels: ['Correct', 'Wrong', 'Skipped'],
    datasets: [{ data: [correctCount, wrongCount, naCount], backgroundColor: ['#22c55e', '#ef4444', '#6b7280'], borderWidth: 0 }]
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* NAV */}
        <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-black gradient-text">⚡ RankVeda</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            {authUser && <span className="text-xs text-gray-400 hidden sm:block">👤 {authUser.name}</span>}
            <button onClick={handleShare}
              className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition">
              <FaShareAlt className="text-xs" /> Share
            </button>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition">
              {theme === 'dark' ? <FaSun className="text-yellow-400 text-sm" /> : <FaMoon className="text-indigo-400 text-sm" />}
            </button>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: FaTrophy, label: 'Score', value: Number(result.score || 0).toFixed(2), color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
              { icon: FaTrophy, label: 'Rank', value: `#${rank?.rank ?? result.rank ?? '—'}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
              { icon: FaPercent, label: 'Percentile', value: `${Number(rank?.percentile ?? result.percentile ?? 0).toFixed(1)}%`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
              { icon: FaCheckCircle, label: 'Correct', value: correctCount, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
              { icon: FaTimesCircle, label: 'Wrong', value: wrongCount, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
              { icon: FaBullseye, label: 'Accuracy', value: `${accuracy}%`, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
            ].map(({ icon: Icon, label, value, color, bg }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`${bg} border rounded-xl p-3 text-center`}>
                <Icon className={`${color} text-xl mx-auto mb-1`} />
                <div className={`text-xl font-black ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </motion.div>
            ))}
          </div>

          {/* MARKSHEET CARD — full width */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-lg font-bold">🎫 Official Score Card</h2>
              <div className="flex gap-2">
                <button onClick={() => handleDownload('image')} disabled={downloading}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
                  <FaDownload /> {downloading ? 'Downloading...' : 'Download PNG'}
                </button>
                <button onClick={() => handleDownload('pdf')} disabled={downloading}
                  className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
                  <FaDownload /> PDF
                </button>
              </div>
            </div>
            <div className="w-full shadow-2xl ring-1 ring-white/10 rounded-2xl overflow-hidden">
              <MarksheetCard ref={marksheetRef} candidate={candidateForCard} score={scoreForCard} rank={rankForCard} />
            </div>
          </motion.div>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-bold mb-4 text-gray-200">{sections.length > 1 ? '📊 Section-wise Breakdown' : '📊 Overall Breakdown'}</h3>
              <Bar data={sectionBarData} options={{
                responsive: true,
                plugins: { legend: { labels: { color: '#9ca3af', font: { size: 11 } } } },
                scales: {
                  y: { beginAtZero: true, ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
                  x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                }
              }} height={120} />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col items-center">
              <h3 className="font-bold mb-4 text-gray-200 self-start">🎯 Attempt Distribution</h3>
              <div className="w-48 relative">
                <Doughnut data={donutData} options={{
                  cutout: '72%',
                  plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', font: { size: 10 }, padding: 8 } } }
                }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-black text-white">{accuracy}%</div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION TABLE */}
          {sections.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-bold text-gray-200">📋 Section-wise Score Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-800/70 text-gray-400 text-xs uppercase tracking-wider">
                      {['Section', 'Total Qs', 'Not Attempted', 'Right ✓', 'Wrong ✗', 'Marks'].map((h, i) => (
                        <th key={i} className={`px-4 py-3 font-semibold ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((sec, i) => (
                      <tr key={i} className="border-t border-gray-800 hover:bg-gray-800/40 transition">
                        <td className="px-4 py-3 font-medium text-gray-200">{sec.name}</td>
                        <td className="px-4 py-3 text-center text-gray-400">{sec.total ?? '—'}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{sec.na ?? '—'}</td>
                        <td className="px-4 py-3 text-center font-bold text-green-400">{sec.right ?? '—'}</td>
                        <td className="px-4 py-3 text-center font-bold text-red-400">{sec.wrong ?? '—'}</td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-400">{sec.marks != null ? Number(sec.marks).toFixed(2) : '—'}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-yellow-600 bg-yellow-900/20 font-bold">
                      <td className="px-4 py-3 text-yellow-300">Total</td>
                      <td className="px-4 py-3 text-center text-yellow-300">{sections.reduce((s, r) => s + (r.total || 0), 0) || totalQs}</td>
                      <td className="px-4 py-3 text-center text-yellow-300">{sections.reduce((s, r) => s + (r.na || 0), 0) || naCount}</td>
                      <td className="px-4 py-3 text-center text-green-400">{sections.reduce((s, r) => s + (r.right || 0), 0) || correctCount}</td>
                      <td className="px-4 py-3 text-center text-red-400">{sections.reduce((s, r) => s + (r.wrong || 0), 0) || wrongCount}</td>
                      <td className="px-4 py-3 text-center text-indigo-300 text-base">{Number(result.score || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* QUESTION ANALYSIS */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-gray-200">📝 Question Analysis <span className="text-gray-500 font-normal text-sm">({filteredQs.length} questions)</span></h3>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'All', active: 'bg-gray-600', inactive: 'bg-gray-800 text-gray-400' },
                  { key: 'correct', label: '✅ Correct', active: 'bg-green-700 text-white', inactive: 'bg-gray-800 text-gray-400' },
                  { key: 'wrong', label: '❌ Wrong', active: 'bg-red-700 text-white', inactive: 'bg-gray-800 text-gray-400' },
                  { key: 'unattempted', label: '⏳ Skipped', active: 'bg-gray-700 text-white', inactive: 'bg-gray-800 text-gray-400' },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition hover:opacity-90 ${filter === f.key ? f.active : f.inactive}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700">
              {Array.from(new Set(filteredQs.map(q => q.parsed_payload?.section_name || 'Overall'))).map((sectionName) => {
                const sectionQs = filteredQs.filter(q => (q.parsed_payload?.section_name || 'Overall') === sectionName);
                if (sectionQs.length === 0) return null;
                return (
                  <div key={sectionName} className="space-y-2">
                    <h4 className="text-indigo-300 font-semibold text-sm bg-gray-800/50 p-2 rounded-lg">{sectionName}</h4>
                    <div className="space-y-2">
                      {sectionQs.map((q, idx) => (
                        <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.008 }}>
                          <QuestionItem q={q} resultId={result.id} onUnlock={(nb) => setBalance(nb)} authUser={authUser} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredQs.length === 0 && <p className="text-center text-gray-600 py-10 text-sm">No questions in this filter</p>}
            </div>
          </div>

          {/* POINTS SECTION */}
          <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-700/30 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FaCoins className="text-yellow-400" />
                <span className="font-bold text-gray-200">Your Points Balance</span>
              </div>
              <div className="text-4xl font-black text-yellow-400">{balance}</div>
              <div className="text-xs text-gray-500 mt-1">5 pts per AI solution unlock</div>
            </div>
            <Link href="/marketplace" className="bg-purple-700 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition">
              <FaShoppingBag /> Question Bank
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
