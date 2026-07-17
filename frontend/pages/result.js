import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import MarksheetCard from '../components/MarksheetCard';
import Logo from '../components/Logo';
import Navbar from '../components/Navbar';
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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const QuestionItem = ({ q, resultId, onUnlock, authUser, balance }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(q.is_unlocked || false);
  const [solutions, setSolutions] = useState(q.solutions || []);
  const [solIndex, setSolIndex] = useState(0);

  const isCorrect = q.student_answer && q.student_answer === q.correct_answer;
  const isWrong = q.student_answer && q.student_answer !== q.correct_answer;
  const status = isCorrect ? 'correct' : isWrong ? 'wrong' : 'unattempted';
  const borderMap = { correct: 'border-l-green-500', wrong: 'border-l-red-500', unattempted: 'border-l-gray-600' };
  const badge = { correct: 'bg-green-600', wrong: 'bg-red-600', unattempted: 'bg-gray-700' };

  const handleUnlock = async () => {
    if (!authUser || !authUser.id) {
      toast.error('Please log in or create an account to view AI solutions!');
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (balance < 5) {
      toast.error('Insufficient points balance. Please buy points packs first.');
      router.push('/marketplace');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/questions/${resultId}/questions/${q.id}/unlock`, { 
        user_id: authUser.id 
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
    if (!authUser || !authUser.id) {
      toast.error('Please log in or create an account to generate AI solutions!');
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (balance < 5) {
      toast.error('Insufficient points balance. Please buy points packs first.');
      router.push('/marketplace');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/questions/${resultId}/questions/${q.id}/generate`, { 
        user_id: authUser.id 
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
    if (!authUser || !authUser.id) {
      toast.error('Please login first to publish solutions');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/questions/${resultId}/questions/${q.id}/publish`, {
        user_id: authUser.id,
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
      const res = await axios.post(`${API}/api/questions/solutions/${solId}/like`, { user_id: authUser?.id || 1 });
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
    <div className={`border-l-4 ${borderMap[status]} rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 shadow-xs overflow-hidden transition`}>
      <div className="flex items-center justify-between p-3.5 cursor-pointer select-none bg-slate-50/50 hover:bg-slate-100/50 transition" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold text-slate-500 bg-slate-200/70 px-2 py-1 rounded-md w-9 text-center shrink-0">Q{q.question_no}</span>
          <span className={`text-sm font-semibold text-slate-800 ${expanded ? 'whitespace-normal break-words' : 'truncate'}`} dangerouslySetInnerHTML={{ __html: q.question_text || `Question ${q.question_no}` }}></span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full text-white font-bold shadow-xs ${badge[status]}`}>
            {status === 'correct' ? '+1.0' : status === 'wrong' ? '-0.33' : '0.0'}
          </span>
          {expanded ? <FaChevronUp className="text-slate-400 text-xs" /> : <FaChevronDown className="text-slate-400 text-xs" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-3 border-t border-slate-100 text-sm space-y-3.5">
              {/* Options rendering */}
              <div className="space-y-2 mt-2">
                {['a', 'b', 'c', 'd'].map(opt => {
                  const optText = q.parsed_payload?.[`option_${opt}_text`];
                  const optId = q.parsed_payload?.[`option_${opt}_id`];
                  if (!optText) return null;
                  const isOptCorrect = q.parsed_payload?.correct_option_text === optText;
                  const isOptSelected = q.student_option_text === optText;
                  let optStyle = 'border-slate-200 bg-slate-50/60 text-slate-700';
                  if (isOptCorrect) optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs';
                  else if (isOptSelected && !isOptCorrect) optStyle = 'border-rose-500 bg-rose-50 text-rose-800';
                  
                  return (
                    <div key={opt} className={`p-2.5 border rounded-xl ${optStyle} flex gap-2.5 items-start text-xs sm:text-sm`}>
                      <span className="font-extrabold shrink-0 uppercase w-5 text-center">{opt}.</span>
                      <span dangerouslySetInnerHTML={{ __html: optText }} className="flex-1"></span>
                      {isOptSelected && <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">(Your Answer)</span>}
                      {isOptCorrect && <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">(Correct Answer)</span>}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                 <p><span className="text-slate-400">Marks:</span> <span className="font-bold text-slate-700">{q.marks_awarded}</span></p>
                 <p><span className="text-slate-400">Question ID:</span> <span className="font-mono text-slate-600">{q.question_id_html || 'N/A'}</span></p>
                 <p><span className="text-slate-400">Chosen Option ID:</span> <span className="font-mono text-slate-600">{q.option_id || 'N/A'}</span></p>
              </div>
              
              {/* AI Solution Section */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                {isUnlocked ? (
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
                    <div className="flex justify-between items-center mb-2.5">
                      <p className="font-extrabold text-indigo-950 flex items-center gap-2 text-sm">
                        🤖 AI Detailed Solution {solutions.length > 0 && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">({solIndex + 1}/{solutions.length})</span>}
                      </p>
                      
                      {solutions.filter(s => !s.is_temporary).length < 5 && (
                        <button onClick={handleGenerate} disabled={loading} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl text-white shadow-sm transition disabled:opacity-50">
                          {loading ? 'Generating...' : '+ Generate New Solution (5 pts)'}
                        </button>
                      )}
                    </div>
                    
                    {solutions.length > 0 ? (
                      <div className="relative mt-3">
                        {solutions.length > 1 && (
                          <>
                            <button onClick={() => setSolIndex(prev => Math.max(0, prev - 1))} disabled={solIndex === 0} className="absolute left-[-10px] top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 text-white rounded-full disabled:opacity-0 hover:bg-indigo-900 transition shadow-md z-10">
                              <FaChevronLeft className="text-xs" />
                            </button>
                            <button onClick={() => setSolIndex(prev => Math.min(solutions.length - 1, prev + 1))} disabled={solIndex === solutions.length - 1} className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 text-white rounded-full disabled:opacity-0 hover:bg-indigo-900 transition shadow-md z-10">
                              <FaChevronRight className="text-xs" />
                            </button>
                          </>
                        )}
                        
                        <div className="px-4 py-2 min-h-[60px]">
                          {solutions[solIndex].is_temporary && (
                            <div className="mb-2 inline-block bg-amber-500/20 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-md border border-amber-300 uppercase font-extrabold tracking-wider">
                              Temporary AI Preview
                            </div>
                          )}
                          <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed font-medium">{solutions[solIndex].explanation}</p>
                          {solutions[solIndex].why_wrong && (
                            <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 text-amber-900 text-xs font-medium">
                              <span className="font-bold uppercase tracking-wide text-amber-700">Exam Insights:</span> {solutions[solIndex].why_wrong}
                            </div>
                          )}
                          <div className="mt-4 pt-3 border-t border-indigo-100 flex justify-between items-center">
                             <div className="text-xs font-semibold text-slate-500">Author: <strong className="text-indigo-900">{solutions[solIndex].user_name || 'RankVeda AI Engine'}</strong></div>
                             <div className="flex gap-2 items-center">
                               {solutions[solIndex].is_temporary ? (
                                  <button onClick={() => handlePublish(solutions[solIndex])} disabled={loading} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl transition font-bold shadow-sm">
                                    {loading ? 'Saving...' : 'Publish to Question Bank'}
                                  </button>
                               ) : (
                                  <button onClick={() => handleLike(solutions[solIndex].id)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-indigo-200 px-3.5 py-1.5 rounded-xl shadow-xs transition">
                                    <FaThumbsUp /> {solutions[solIndex].likes || 0}
                                  </button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm font-semibold text-slate-400">
                         No public solutions yet. Be the first to generate one!
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleUnlock} disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2">
                    <FaCoins className="text-amber-300" /> {loading ? 'Unlocking Solution...' : 'Show Detailed AI Solution (5 pts)'}
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

const loadingMessages = [
  "Analyzing your exam responses...",
  "Running predictive algorithms...",
  "Calculating category percentiles...",
  "Generating official scorecard...",
  "Just a moment, finalizing results..."
];

const LoadingScreen = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-300/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/40 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        <div className="relative w-24 h-24 mb-8">
          <motion.div
            className="absolute inset-0 rounded-full border-t-2 border-indigo-600 border-r-2 border-transparent"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border-b-2 border-purple-600 border-l-2 border-transparent"
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            📊
          </motion.div>
        </div>

        <motion.h2 
          className="text-2xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Preparing Your Result
        </motion.h2>

        <div className="h-6 relative w-full flex justify-center mb-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-slate-500 text-sm font-medium absolute"
            >
              {loadingMessages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-1.5 mb-8 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-md"
            initial={{ width: "10%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 15, ease: "easeOut" }}
          />
        </div>

        <div className="bg-white/80 border border-slate-200 shadow-xl rounded-2xl p-4 w-full backdrop-blur-md">
          <p className="text-xs text-indigo-600 font-extrabold uppercase tracking-wider mb-2">Did You Know?</p>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            RankVeda's AI engine analyzes millions of data points to predict your normalized score and all-India rank with high precision.
          </p>
        </div>
      </div>
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
  const [downloadFormat, setDownloadFormat] = useState('pdf');
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
        const res = await axios.post(`${API}/api/results/`, {
          url: decodeURIComponent(url),
          exam_id: exam || 1
        });
        setData(res.data);
        try {
          const score = res.data?.result?.score;
          if (score !== undefined && score !== null) {
            const rankRes = await axios.get(`${API}/api/results/rank?exam_id=${exam || 1}&score=${score}`);
            setRank(rankRes.data);
          }
        } catch {}
        if (authUser && authUser.id) {
          try {
            const pRes = await axios.get(`${API}/api/user/${authUser.id}/points`);
            setBalance(pRes.data.balance);
          } catch {}
        } else {
          setBalance(0);
        }
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
      const rollNo = data?.result?.roll_number || 'result';
      if (format === 'image') {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(marksheetRef.current, {
          backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true
        });
        const link = document.createElement('a');
        link.download = `RankVeda_Scorecard_${rollNo}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('✅ Score card downloaded!');
      } else {
        // Generate high-resolution PDF perfectly sized to the card
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        
        // Use a very high scale (4) to ensure text remains crisp when zoomed in
        const canvas = await html2canvas(marksheetRef.current, {
          backgroundColor: '#ffffff', 
          scale: 4, 
          useCORS: true, 
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions in points (px is usually fine for jsPDF but pt is standard)
        // Divide by 4 because we scaled by 4
        const pdfWidth = canvas.width / 4;
        const pdfHeight = canvas.height / 4;
        
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [pdfWidth, pdfHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`RankVeda_Scorecard_${rollNo}.pdf`);
        toast.success('✅ High-Quality PDF downloaded!');
      }
    } catch (e) { toast.error('Download failed: ' + e.message); }
    finally { setDownloading(false); }
  };

  const handleShare = async () => {
    const message = `I scored ${data?.result?.score} marks in ${data?.result?.subject || 'the exam'} on RankVeda. Check your own score prediction and compare with the official exam experience.`;
    const shareUrl = 'https://rankveda.in/';
    const shareData = {
      title: 'My RankVeda Score Card',
      text: message,
      url: shareUrl
    };

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(marksheetRef.current, {
        backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true
      });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `RankVeda_Scorecard_${data?.result?.roll_number || 'scorecard'}.png`, { type: 'image/png' });
      const sharePayload = { ...shareData, files: [file] };

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share(sharePayload);
        toast.success('Shared scorecard with image, message, and link!');
        return;
      }
    } catch (err) {
      // ignore image share failure and fall back to text/link share
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared scorecard message and link!');
        return;
      } catch (err) {
        // continue to fallback
      }
    }

    navigator.clipboard.writeText(`${message} ${shareUrl}`);
    toast.success('Share text copied!');
  };

  if (loading) return <LoadingScreen />;

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
  const rawAccuracy = (correctCount + wrongCount) > 0 ? (correctCount / (correctCount + wrongCount)) * 100 : 0;
  const accuracy = Number(rawAccuracy.toFixed(2));

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
      { label: 'Right', data: sections.map(s => s.right ?? 0), backgroundColor: '#22c55e', borderRadius: 4, maxBarThickness: 16 },
      { label: 'Wrong', data: sections.map(s => s.wrong ?? 0), backgroundColor: '#ef4444', borderRadius: 4, maxBarThickness: 16 },
      { label: 'NA', data: sections.map(s => s.na ?? 0), backgroundColor: '#6b7280', borderRadius: 4, maxBarThickness: 16 },
    ] : [{ label: 'Count', data: [correctCount, wrongCount, naCount], backgroundColor: ['#22c55e', '#ef4444', '#6b7280'], borderRadius: 4, maxBarThickness: 16 }]
  };

  const donutData = {
    labels: ['Correct', 'Wrong', 'Skipped'],
    datasets: [{ data: [correctCount, wrongCount, naCount], backgroundColor: ['#22c55e', '#ef4444', '#6b7280'], borderWidth: 0, hoverOffset: 4 }]
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

      {/* Global Print Styles to isolate the scorecard for native PDF generation */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-marksheet, .print-marksheet * {
            visibility: visible;
          }
          .print-marksheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Force background colors to print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
        <div>
          {/* ── UNIFORM NAVBAR ───────────────────────────────────────────── */}
          <Navbar user={authUser ? { ...authUser, balance } : null} setUser={setAuthUser} />

          {/* ── BREADCRUMB & PAGE HEADER ─────────────────────────────────── */}
          <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4 mb-6">
              <div>
                <nav className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  <Link href="/" className="hover:text-indigo-600 transition">Home</Link> / <Link href="/exams" className="hover:text-indigo-600 transition">Exams</Link> / <span className="text-slate-600">Official Score & Rank</span>
                </nav>
                <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
                  <span>📊 Exam Result Analysis & Rank Prediction</span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.history.length > 1) {
                      router.back();
                    } else {
                      router.push('/');
                    }
                  }}
                  className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <FaChevronLeft className="text-[10px] text-slate-400" /> Check Another Exam
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <FaShareAlt className="text-xs" /> Share Result
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* ── 6 STAT CARDS ───────────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { icon: FaTrophy, label: 'Score', value: Number(result.score || 0).toFixed(2), color: 'text-indigo-600', bg: 'bg-indigo-50/80 border-indigo-100' },
                  { icon: FaTrophy, label: 'Rank', value: `#${rank?.rank ?? result.rank ?? '—'}`, color: 'text-amber-600', bg: 'bg-amber-50/80 border-amber-100' },
                  { icon: FaPercent, label: 'Percentile', value: `${Number(rank?.percentile ?? result.percentile ?? 0).toFixed(1)}%`, color: 'text-purple-600', bg: 'bg-purple-50/80 border-purple-100' },
                  { icon: FaCheckCircle, label: 'Correct', value: correctCount, color: 'text-emerald-600', bg: 'bg-emerald-50/80 border-emerald-100' },
                  { icon: FaTimesCircle, label: 'Wrong', value: wrongCount, color: 'text-rose-600', bg: 'bg-rose-50/80 border-rose-100' },
                  { icon: FaBullseye, label: 'Accuracy', value: `${accuracy}%`, color: 'text-sky-600', bg: 'bg-sky-50/80 border-sky-100' },
                ].map(({ icon: Icon, label, value, color, bg }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-3.5 text-center shadow-xs hover:shadow-md transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl ${bg} border flex items-center justify-center mx-auto mb-2`}>
                      <Icon className={`${color} text-sm`} />
                    </div>
                    <div className={`text-lg sm:text-xl font-black ${color} tracking-tight`}>{value}</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{label}</div>
                  </motion.div>
                ))}
              </div>

              {/* ── MARKSHEET CARD SECTION ─────────────────────────────────── */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-xs shadow-indigo-200">🎫</span>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-indigo-950">Official Score Card</h2>
                      <p className="text-[11px] font-bold text-slate-400">High-resolution verified certificate matching your official RRB / Exam format</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={downloadFormat}
                      onChange={e => setDownloadFormat(e.target.value)}
                      className="bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                      <option value="pdf">PDF Format</option>
                      <option value="image">PNG Image</option>
                    </select>
                    <button
                      onClick={() => handleDownload(downloadFormat)}
                      disabled={downloading}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                    >
                      <FaDownload className="text-xs" /> {downloading ? 'Downloading...' : `Download ${downloadFormat.toUpperCase()}`}
                    </button>
                  </div>
                </div>
                <div className="w-full shadow-2xl ring-1 ring-slate-200 rounded-2xl overflow-hidden bg-white print-marksheet">
                  <MarksheetCard ref={marksheetRef} candidate={candidateForCard} score={scoreForCard} rank={rankForCard} />
                </div>
              </motion.div>

              {/* ── CHARTS ─────────────────────────────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">📊</span>
                    <h3 className="font-extrabold text-indigo-950 text-[13px]">{sections.length > 1 ? 'Section-wise Performance' : 'Overall Performance'}</h3>
                  </div>
                  <div className="h-[200px] w-full">
                    <Bar
                      data={sectionBarData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: {
                          duration: 1500,
                          easing: 'easeOutQuart'
                        },
                        plugins: { legend: { labels: { color: '#475569', font: { size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 6 } } },
                        scales: {
                          y: { beginAtZero: true, ticks: { color: '#64748b', font: { size: 9 } }, grid: { color: '#f1f5f9' }, border: { display: false } },
                          x: { ticks: { color: '#475569', font: { weight: 'bold', size: 9 } }, grid: { display: false }, border: { display: false } }
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col items-center justify-between">
                  <div className="flex items-center gap-2 self-start mb-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">🎯</span>
                    <h3 className="font-extrabold text-indigo-950 text-[13px]">Attempt Distribution</h3>
                  </div>
                  <div className="w-36 h-36 relative my-auto">
                    <Doughnut
                      data={donutData}
                      options={{
                        cutout: '76%',
                        maintainAspectRatio: false,
                        animation: {
                          animateScale: true,
                          animateRotate: true,
                          duration: 1500,
                          easing: 'easeOutBounce'
                        },
                        plugins: { legend: { position: 'bottom', labels: { color: '#475569', font: { size: 10, weight: 'bold' }, padding: 10, usePointStyle: true, boxWidth: 6 } } }
                      }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: '-20px' }}>
                      <div className="text-xl font-black text-indigo-950">{accuracy}%</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── QUESTION ANALYSIS ──────────────────────────────────────── */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-black">📝</span>
                    <h3 className="font-extrabold text-indigo-950 text-base">Detailed Question Analysis <span className="text-slate-400 font-bold text-xs ml-1">({filteredQs.length} questions)</span></h3>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: 'all', label: 'All Questions', active: 'bg-indigo-600 text-white shadow-xs', inactive: 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium' },
                      { key: 'correct', label: '✅ Correct', active: 'bg-emerald-600 text-white shadow-xs', inactive: 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium' },
                      { key: 'wrong', label: '❌ Wrong', active: 'bg-rose-600 text-white shadow-xs', inactive: 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium' },
                      { key: 'unattempted', label: '⏳ Skipped', active: 'bg-slate-700 text-white shadow-xs', inactive: 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs transition font-bold ${filter === f.key ? f.active : f.inactive}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {Array.from(new Set(filteredQs.map(q => q.parsed_payload?.section_name || 'Overall'))).map((sectionName) => {
                    const sectionQs = filteredQs.filter(q => (q.parsed_payload?.section_name || 'Overall') === sectionName);
                    if (sectionQs.length === 0) return null;
                    return (
                      <div key={sectionName} className="space-y-2.5">
                        <h4 className="text-indigo-900 font-extrabold text-xs uppercase tracking-wider bg-indigo-50/80 border border-indigo-100 px-3.5 py-2 rounded-xl">{sectionName}</h4>
                        <div className="space-y-2.5">
                          {sectionQs.map((q, idx) => (
                            <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.008 }}>
                              <QuestionItem q={q} resultId={result.id} onUnlock={(nb) => setBalance(nb)} authUser={authUser} balance={balance} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {filteredQs.length === 0 && <p className="text-center text-slate-400 font-bold py-12 text-sm">No questions match this filter selection.</p>}
                </div>
              </div>

              {/* ── POINTS & QUESTION BANK BANNER ──────────────────────────── */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-800/80 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                    🪙
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-200 text-sm">Your AI Solutions Balance</span>
                      <span className="text-xs font-black bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30">Active</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-0.5 flex items-baseline gap-1.5">
                      {balance} <span className="text-sm font-bold text-slate-300">points</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Unlock AI solutions for any question at just 5 points each or earn by contributing.</div>
                  </div>
                </div>
                <Link
                  href="/marketplace"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition shrink-0"
                >
                  <FaShoppingBag className="text-sm" /> Explore Question Bank & Points
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* ── UNIFORM FOOTER ───────────────────────────────────────────── */}
        <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 px-4 mt-16 border-t border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-slate-500">| Official Result & Rank Engine</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 font-medium">
              <Link href="/exams" className="hover:text-white transition">Exams</Link>
              <Link href="/marketplace" className="hover:text-white transition">Question Bank</Link>
              <Link href="/#pricing" className="hover:text-white transition">Pricing</Link>
            </div>
            <div className="text-slate-500 text-[11px]">
              © {new Date().getFullYear()} RankVeda. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
