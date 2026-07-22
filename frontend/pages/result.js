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
  FaClock, FaTrophy, FaPercent, FaBullseye, FaThumbsUp, FaChevronLeft, FaChevronRight,
  FaRobot, FaCheckSquare, FaSquare, FaTimes, FaSpinner, FaExpand
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

const renderFormattedText = (text) => {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded-md font-mono text-xs text-rose-600 dark:text-rose-400 font-semibold">$1</code>');
  return escaped;
};

const QuestionItem = ({ q, resultId, onUnlock, authUser, balance, isSelected, onToggleSelect, externalSolution, testDate, testTime }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(q.is_unlocked || false);
  const [solutions, setSolutions] = useState(q.solutions || []);
  const [solIndex, setSolIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (externalSolution) {
      setSolutions(prev => {
        const already = prev.some(s => s.id === externalSolution.id);
        return already ? prev : [externalSolution, ...prev];
      });
      setIsUnlocked(true);
      setExpanded(true);
    }
  }, [externalSolution]);

  const isCorrect = q.student_answer && q.student_answer === q.correct_answer;
  const isWrong = q.student_answer && q.student_answer !== q.correct_answer;
  const status = isCorrect ? 'correct' : isWrong ? 'wrong' : 'unattempted';
  const borderMap = { correct: 'border-l-emerald-500', wrong: 'border-l-rose-500', unattempted: 'border-l-slate-400' };
  const badge = { correct: 'bg-emerald-600', wrong: 'bg-rose-600', unattempted: 'bg-slate-600 dark:bg-slate-700' };

  const handleUnlock = async () => {
    if (!authUser || !authUser.id) {
      toast.error('Please log in or create an account to view AI solutions!');
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
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
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/questions/${resultId}/questions/${q.id}/generate`, { 
        user_id: authUser.id 
      });
      const tempSol = res.data.solution;
      setSolutions(prev => [...prev, tempSol]);
      setSolIndex(solutions.length);
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
    <>
      <div className={`border-l-4 ${borderMap[status]} rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-hidden transition`}>
        <div className="flex items-center justify-between p-3.5 cursor-pointer select-none bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition" onClick={(e) => { if (e.target.closest('[data-checkbox]')) return; setExpanded(!expanded); }}>
          <div className="flex items-center gap-3 min-w-0">
            {onToggleSelect && (
              <button data-checkbox onClick={(e) => { e.stopPropagation(); onToggleSelect(q.id); }}
                className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 bg-white dark:bg-slate-800'
                }`}>
                {isSelected && <span className="text-[10px] font-black">✓</span>}
              </button>
            )}
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-2 py-1 rounded-md w-9 text-center shrink-0">Q{q.question_no}</span>
            <span className={`text-sm font-semibold text-slate-900 dark:text-white ${expanded ? 'whitespace-normal break-words' : 'truncate'}`} dangerouslySetInnerHTML={{ __html: q.question_text || `Question ${q.question_no}` }}></span>
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
              <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-sm space-y-3.5">
                {/* Options rendering */}
                <div className="space-y-2 mt-2">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const optText = q.parsed_payload?.[`option_${opt}_text`];
                    if (!optText) return null;
                    const isOptCorrect = q.parsed_payload?.correct_option_text === optText;
                    const isOptSelected = q.student_option_text === optText;
                    let optStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200';
                    if (isOptCorrect) optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs';
                    else if (isOptSelected && !isOptCorrect) optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300';
                    
                    return (
                      <div key={opt} className={`p-2.5 border rounded-xl ${optStyle} flex gap-2.5 items-start text-xs sm:text-sm`}>
                        <span className="font-extrabold shrink-0 uppercase w-5 text-center">{opt}.</span>
                        <span dangerouslySetInnerHTML={{ __html: optText }} className="flex-1"></span>
                        {isOptSelected && <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md">(Your Answer)</span>}
                        {isOptCorrect && <span className="ml-auto text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">(Correct Answer)</span>}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-2.5 items-center">
                   <span className="text-xs text-slate-400 font-extrabold mr-1">Stats:</span>
                   {(() => {
                     const total = (q.correct_count || 0) + (q.wrong_count || 0) + (q.unattempted_count || 0);
                     const corrPct = total > 0 ? ((q.correct_count || 0) / total * 100).toFixed(1) : '0.0';
                     const wrgPct = total > 0 ? ((q.wrong_count || 0) / total * 100).toFixed(1) : '0.0';
                     const skpPct = total > 0 ? ((q.unattempted_count || 0) / total * 100).toFixed(1) : '0.0';
                     return (
                       <>
                         <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-[11px]">
                           {corrPct}% correct ({q.correct_count})
                         </span>
                         <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold text-[11px]">
                           {wrgPct}% wrong ({q.wrong_count})
                         </span>
                         <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-bold text-[11px]">
                           {skpPct}% skipped ({q.unattempted_count})
                         </span>
                       </>
                     );
                   })()}
                </div>

                {/* AI Solution Section */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  {isUnlocked ? (
                    <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
                      <div className="flex justify-between items-center mb-2.5">
                        <p className="font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-2 text-sm">
                          🤖 AI Detailed Solution {solutions.length > 0 && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md">({solIndex + 1}/{solutions.length})</span>}
                        </p>
                        
                        {solutions.filter(s => !s.is_temporary).length < 5 && (
                          <button onClick={handleGenerate} disabled={loading} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl shadow-xs transition disabled:opacity-50">
                            {loading ? 'Generating...' : '+ Generate New Solution (5 pts)'}
                          </button>
                        )}
                      </div>
                      
                      {solutions.length > 0 ? (
                        <div className="relative mt-3">
                          {solutions.length > 1 && (
                            <>
                              <button onClick={() => setSolIndex(prev => Math.max(0, prev - 1))} disabled={solIndex === 0} className="absolute left-[-10px] top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-full disabled:opacity-0 hover:bg-indigo-900 dark:hover:bg-indigo-800 transition shadow-md z-10">
                                <FaChevronLeft className="text-xs" />
                              </button>
                              <button onClick={() => setSolIndex(prev => Math.min(solutions.length - 1, prev + 1))} disabled={solIndex === solutions.length - 1} className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-full disabled:opacity-0 hover:bg-indigo-900 dark:hover:bg-indigo-800 transition shadow-md z-10">
                                <FaChevronRight className="text-xs" />
                              </button>
                            </>
                          )}
                          
                          <div className="px-4 py-2 min-h-[60px]">
                            <div className="mb-2.5 flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 dark:border-slate-700/60 pb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                {solutions[solIndex].is_temporary && (
                                  <span className="inline-block bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] px-2.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800 uppercase font-extrabold tracking-wider">Temporary AI Preview</span>
                                )}
                                {solutions[solIndex].detected_language && (
                                  <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold border ${solutions[solIndex].detected_language === 'hi' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-900/50' : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-900/50'}`}>
                                    {solutions[solIndex].detected_language === 'hi' ? '🇮🇳 Hindi Solution' : '🇬🇧 English Solution'}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowPopup(true); }}
                                className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-xl font-bold border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition shadow-xs"
                              >
                                <FaExpand className="text-[9px]" /> Fullscreen / Step-by-Step
                              </button>
                            </div>
                            
                            {(() => {
                              const sol = solutions[solIndex];
                              const lang = sol.detected_language || 'en';
                              const primaryText = lang === 'hi' ? (sol.solution_hin || sol.explanation) : (sol.solution_eng || sol.explanation);
                              const insightsLabel = lang === 'hi' ? 'परीक्षा अंतर्दृष्टि:' : 'Exam Insights:';
                              return (
                                <>
                                  <p className="text-slate-700 dark:text-slate-350 text-sm whitespace-pre-wrap leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: renderFormattedText(primaryText) }}></p>
                                  {sol.why_wrong && (
                                    <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/30 text-amber-900 dark:text-amber-300 text-xs font-medium">
                                      <span className="font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">{insightsLabel}</span> <span dangerouslySetInnerHTML={{ __html: renderFormattedText(sol.why_wrong) }}></span>
                                    </div>
                                  )}
                                  {sol.key_takeaways?.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{lang === 'hi' ? 'मुख्य बातें:' : 'Key Takeaways:'}</p>
                                      {sol.key_takeaways.map((t, i) => (
                                        <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                          <span className="text-indigo-500 dark:text-indigo-400 font-bold mt-0.5">•</span>
                                          <span>{t}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/50 flex justify-between items-center">
                               <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Author: <strong className="text-indigo-900 dark:text-indigo-300">{solutions[solIndex].user_name || 'RankResult AI Engine'}</strong></div>
                               <div className="flex gap-2 items-center">
                                 {solutions[solIndex].is_temporary ? (
                                    <button onClick={() => handlePublish(solutions[solIndex])} disabled={loading} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl transition font-bold shadow-sm">
                                      {loading ? 'Saving...' : 'Publish to Question Bank'}
                                    </button>
                                 ) : (
                                    <button onClick={() => handleLike(solutions[solIndex].id)} className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 px-3.5 py-1.5 rounded-xl shadow-xs transition">
                                      <FaThumbsUp /> {solutions[solIndex].likes || 0}
                                    </button>
                                  )}
                               </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-sm font-semibold text-slate-400 dark:text-slate-500">
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

      {/* Fullscreen Popup Modal */}
      <AnimatePresence>
        {showPopup && solutions[solIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-850 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-left"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg">Q{q.question_no}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-base">Step-by-Step AI Solution</span>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {/* Question Text Box */}
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-4">
                  <div className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Question:</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question_text || `Question ${q.question_no}` }}></div>
                  
                  {/* Option comparison */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-3 py-1.5 rounded-xl shadow-2xs">
                      <span>Correct Option:</span>
                      <span className="bg-green-600 text-white px-2 py-0.5 rounded-md text-[10px] uppercase font-black">{q.correct_answer}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-3 py-1.5 rounded-xl shadow-2xs">
                      <span>Your Option:</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${
                        status === 'correct' ? 'bg-green-600 text-white' : status === 'wrong' ? 'bg-red-600 text-white' : 'bg-slate-600 dark:bg-slate-500 text-white'
                      }`}>
                        {q.student_answer || 'Skipped'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Solution */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📖</span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">Detailed Explanation</h4>
                    </div>
                  </div>

                  {(() => {
                    const sol = solutions[solIndex];
                    const lang = sol.detected_language || 'en';
                    const primaryText = lang === 'hi' ? (sol.solution_hin || sol.explanation) : (sol.solution_eng || sol.explanation);
                    const insightsLabel = lang === 'hi' ? 'परीक्षा अंतर्दृष्टि (Exam Insights):' : 'Exam Insights:';
                    
                    return (
                      <div className="space-y-5">
                        {/* Step-by-step rendering with clean block formatting */}
                        <div className="text-slate-750 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-medium space-y-4">
                          {primaryText.split('\n\n').map((paragraph, index) => {
                            const trimmed = paragraph.trim();
                            if (!trimmed) return null;
                            
                            // Detect steps
                            const isStep = trimmed.startsWith('Step') || trimmed.startsWith('चरण') || trimmed.startsWith('**Step') || trimmed.startsWith('**चरण') || /^\d+\./.test(trimmed);
                            // Detect math equations / calculations
                            const isFormula = trimmed.includes('=') || trimmed.includes('+') || trimmed.includes('-') || trimmed.includes('*') || trimmed.includes('/') || trimmed.includes('[(N/2');

                            return (
                              <div 
                                key={index} 
                                className={`transition-all duration-200 ${
                                  isStep 
                                    ? 'border-l-4 border-indigo-600 dark:border-l-indigo-400 pl-4 bg-indigo-50/30 dark:bg-indigo-950/10 py-3 pr-3 rounded-r-xl shadow-2xs font-bold text-slate-900 dark:text-slate-200' 
                                    : isFormula 
                                      ? 'bg-slate-50/80 dark:bg-slate-900/60 font-mono text-xs p-4 rounded-xl border border-slate-200/50 dark:border-slate-800 text-indigo-950 dark:text-indigo-300 font-semibold shadow-2xs my-2'
                                      : 'text-slate-600 dark:text-slate-400 leading-relaxed'
                                }`}
                                dangerouslySetInnerHTML={{ __html: renderFormattedText(paragraph) }}
                              />
                            );
                          })}
                        </div>

                        {sol.why_wrong && (
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 text-amber-900 dark:text-amber-300 text-xs font-semibold shadow-2xs">
                            <span className="font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-400 block mb-1.5">{insightsLabel}</span>
                            <p className="leading-relaxed text-amber-800 dark:text-amber-400" dangerouslySetInnerHTML={{ __html: renderFormattedText(sol.why_wrong) }}></p>
                          </div>
                        )}

                        {sol.key_takeaways?.length > 0 && (
                          <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 space-y-2.5 shadow-2xs">
                            <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider">{lang === 'hi' ? 'मुख्य बातें (Key Takeaways):' : 'Key Takeaways:'}</p>
                            <div className="space-y-2">
                              {sol.key_takeaways.map((t, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-350 leading-relaxed">
                                  <span className="text-indigo-600 dark:text-indigo-400 font-black mt-0.5">•</span>
                                  <span>{t}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                  Generated by <span className="text-indigo-600 dark:text-indigo-400 font-bold">{solutions[solIndex].user_name || 'RankResult AI Engine'}</span>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md"
                >
                  Close Solution
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

function LoadingState() {
  const loadingMessages = [
    "Connecting to RankResult Calculation Engine...",
    "Parsing Candidate Response Sheet...",
    "Applying Negative Marking Rules...",
    "Comparing with Shift Candidates...",
    "Calculating All India Rank & Percentile...",
    "Generating Score Card Certificate..."
  ];
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden relative transition-colors">
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
          className="text-2xl font-black mb-3 text-slate-900 dark:text-white"
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
              className="text-slate-500 dark:text-slate-400 text-sm font-medium absolute"
            >
              {loadingMessages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mb-8 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-md"
            initial={{ width: "10%" }}
            animate={{ width: "95%" }}
            transition={{ duration: 15, ease: "easeOut" }}
          />
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xl rounded-2xl p-4 w-full backdrop-blur-md">
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider mb-2">Did You Know?</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            RankResult's AI engine analyzes candidate response sheets to predict your score and all-India rank with high precision.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const { url, exam, id } = router.query;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [balance, setBalance] = useState(0);
  const [authUser, setAuthUser] = useState(null);
  const [rank, setRank] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('pdf');
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, running: false });
  const [bulkSolutions, setBulkSolutions] = useState({});
  const marksheetRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('rv_user');
      if (u) try { setAuthUser(JSON.parse(u)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!url && !id) return;
    const fetchResult = async () => {
      try {
        let res;
        if (id) {
          res = await axios.get(`${API}/api/results/${id}`);
        } else {
          res = await axios.post(`${API}/api/results/calculate`, { url, exam_id: exam });
        }
        setData(res.data);
        if (res.data.result?.id) {
          try {
            const rankRes = await axios.get(`${API}/api/results/${res.data.result.id}/rank`);
            setRank(rankRes.data);
          } catch (e) {}
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to process answer key response');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [url, exam, id]);

  const handleBulkGenerate = async (qIds) => {
    if (!authUser || !authUser.id) {
      toast.error('Please log in or register to generate AI solutions!');
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!qIds || qIds.length === 0) return;
    setBulkProgress({ done: 0, total: qIds.length, running: true });
    toast(`⚙️ Generating solutions for ${qIds.length} questions...`, { duration: 3000 });

    const BATCH = 5;
    let done = 0;
    for (let i = 0; i < qIds.length; i += BATCH) {
      const batch = qIds.slice(i, i + BATCH);
      try {
        const res = await axios.post(`${API}/api/questions/${data.result.id}/bulk-generate`, {
          user_id: authUser.id,
          question_ids: batch
        });
        const batchResults = res.data.results || [];
        batchResults.forEach(r => {
          if (r.success && r.solution) {
            setBulkSolutions(prev => ({ ...prev, [r.q_id]: r.solution }));
          }
        });
        done += batch.length;
        setBulkProgress(prev => ({ ...prev, done }));
        if (res.data.newBalance !== undefined) setBalance(res.data.newBalance);
      } catch (err) {
        console.error('Bulk batch error:', err);
        done += batch.length;
        setBulkProgress(prev => ({ ...prev, done }));
      }
    }
    setBulkProgress(prev => ({ ...prev, running: false }));
    setBulkSelected([]);
    toast.success(`✅ Solutions generated for ${qIds.length} questions!`);
  };

  const toggleBulkSelect = (qId) => {
    setBulkSelected(prev => prev.includes(qId) ? prev.filter(x => x !== qId) : [...prev, qId]);
  };

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
      if (q.status === 'correct') { groups[sn].right++; }
      else if (q.status === 'wrong') { groups[sn].wrong++; }
      else groups[sn].na++;
    });
    Object.values(groups).forEach(g => {
      const rawMarks = g.right * 1.0 - g.wrong / 3.0;
      const factor = 1000;
      g.marks = rawMarks >= 0 ? Math.floor(rawMarks * factor) / factor : Math.ceil(rawMarks * factor) / factor;
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
        link.download = `RankResult_Scorecard_${rollNo}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('✅ Score card downloaded!');
      } else {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        
        const canvas = await html2canvas(marksheetRef.current, {
          backgroundColor: '#ffffff', scale: 4, useCORS: true, allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = canvas.width / 4;
        const pdfHeight = canvas.height / 4;
        
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [pdfWidth, pdfHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`RankResult_Scorecard_${rollNo}.pdf`);
        toast.success('✅ High-Quality PDF downloaded!');
      }
    } catch (e) { toast.error('Download failed: ' + e.message); }
    finally { setDownloading(false); }
  };

  const handleShare = async () => {
    const message = `I scored ${data?.result?.score} marks in ${data?.result?.subject || 'the exam'} on RankResult. Check your score prediction!`;
    const shareUrl = 'https://rankresult.in/';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My RankResult Score Card', text: message, url: shareUrl });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${message} ${shareUrl}`);
      toast.success('Result link copied to clipboard!');
    }
  };

  if (loading || !data) return <LoadingState />;

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
    ? `${result.candidate_name} — ${result.subject || 'Score Card'} | RankResult`
    : `Score Card — ${result.subject || 'Competitive Exam'} | RankResult`;
  const pageDesc = `Check ${result.candidate_name || 'your'}'s score: ${result.score} marks, Rank #${rank?.rank || result.rank}, Percentile ${(rank?.percentile || result.percentile || 0).toFixed ? (rank?.percentile || result.percentile || 0).toFixed(1) : '—'}% in ${result.subject || 'the exam'}.`;

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
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between transition-colors">
        <div>
          <Navbar user={authUser ? { ...authUser, balance } : null} setUser={setAuthUser} />

          {/* Breadcrumb & Header */}
          <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <nav className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Home</Link> / <Link href="/exams" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Exams</Link> / <span className="text-slate-600 dark:text-slate-300">Official Score &amp; Rank</span>
                </nav>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>📊 Exam Result Analysis &amp; Rank Prediction</span>
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <FaChevronLeft className="text-[10px] text-slate-400" /> Back
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
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { icon: FaTrophy, label: 'Score', value: Number(result.score || 0).toFixed(2), color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
                  { icon: FaTrophy, label: 'Rank', value: `#${rank?.rank ?? result.rank ?? '—'}`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
                  { icon: FaPercent, label: 'Percentile', value: `${Number(rank?.percentile ?? result.percentile ?? 0).toFixed(1)}%`, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800' },
                  { icon: FaCheckCircle, label: 'Correct', value: correctCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
                  { icon: FaTimesCircle, label: 'Wrong', value: wrongCount, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' },
                  { icon: FaBullseye, label: 'Accuracy', value: `${accuracy}%`, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800' },
                ].map(({ icon: Icon, label, value, color, bg }, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 text-center shadow-xs transition-all"
                  >
                    <div className={`w-9 h-9 rounded-xl ${bg} border flex items-center justify-center mx-auto mb-2`}>
                      <Icon className={`${color} text-sm`} />
                    </div>
                    <div className={`text-lg sm:text-xl font-black ${color} tracking-tight`}>{value}</div>
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">{label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Marksheet Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-black">🎫</span>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">Official Score Card</h2>
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">High-resolution verified certificate</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={downloadFormat}
                      onChange={e => setDownloadFormat(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 outline-none"
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
                <div className="w-full shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl overflow-hidden bg-white text-slate-900 print-marksheet">
                  <MarksheetCard ref={marksheetRef} candidate={candidateForCard} score={scoreForCard} rank={rankForCard} />
                </div>
              </motion.div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">📊</span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-[13px]">{sections.length > 1 ? 'Section-wise Performance' : 'Overall Performance'}</h3>
                  </div>
                  <div className="h-[200px] w-full">
                    <Bar
                      data={sectionBarData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: theme === 'dark' ? '#cbd5e1' : '#475569', font: { size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 6 } } },
                        scales: {
                          y: { beginAtZero: true, ticks: { color: theme === 'dark' ? '#94a3b8' : '#64748b', font: { size: 9 } }, grid: { color: theme === 'dark' ? '#334155' : '#f1f5f9' }, border: { display: false } },
                          x: { ticks: { color: theme === 'dark' ? '#cbd5e1' : '#475569', font: { weight: 'bold', size: 9 } }, grid: { display: false }, border: { display: false } }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs flex flex-col items-center justify-between">
                  <div className="flex items-center gap-2 self-start mb-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">🎯</span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-[13px]">Attempt Distribution</h3>
                  </div>
                  <div className="w-full h-[200px] relative flex justify-center">
                    <Doughnut
                      data={donutData}
                      options={{
                        cutout: '76%',
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { color: theme === 'dark' ? '#cbd5e1' : '#475569', font: { size: 10, weight: 'bold' }, padding: 15, usePointStyle: true, boxWidth: 6 } } }
                      }}
                    />
                    <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none w-full">
                      <div className="text-[22px] leading-none font-black text-slate-900 dark:text-white mb-0.5">{accuracy}%</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Questions Analysis */}
              <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">📝</span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Detailed Question Analysis <span className="text-slate-400 font-bold text-xs ml-1">({filteredQs.length} questions)</span></h3>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { key: 'all', label: 'All Questions', active: 'bg-indigo-600 text-white shadow-xs', inactive: 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium' },
                      { key: 'correct', label: '✅ Correct', active: 'bg-emerald-600 text-white shadow-xs', inactive: 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium' },
                      { key: 'wrong', label: '❌ Wrong', active: 'bg-rose-600 text-white shadow-xs', inactive: 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium' },
                      { key: 'unattempted', label: '⏳ Skipped', active: 'bg-slate-700 text-white shadow-xs', inactive: 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium' },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => { setFilter(f.key); setBulkSelected([]); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs transition font-bold ${filter === f.key ? f.active : f.inactive}`}
                      >
                        {f.label}
                      </button>
                    ))}
                    {/* Generate All button for filtered view */}
                    {filter !== 'all' && filteredQs.length > 0 && (
                      <button
                        onClick={() => handleBulkGenerate(filteredQs.map(q => q.id))}
                        disabled={bulkProgress.running}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-60 flex items-center gap-1.5 transition shadow-sm"
                      >
                        {bulkProgress.running ? (
                          <><span className="animate-spin">⚙️</span> Generating...</>
                        ) : (
                          <><FaRobot className="text-[10px]" /> Generate All ({filteredQs.length})</>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk Progress Bar */}
                {bulkProgress.running && (
                  <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300">⚙️ Generating AI Solutions...</span>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200">{bulkProgress.done}/{bulkProgress.total}</span>
                    </div>
                    <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Select All / Deselect controls */}
                {filteredQs.length > 0 && (
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setBulkSelected(prev => prev.length === filteredQs.length ? [] : filteredQs.map(q => q.id))}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                    >
                      {bulkSelected.length === filteredQs.length && filteredQs.length > 0 ? '☑ Deselect All' : '☐ Select All'}
                    </button>
                    {bulkSelected.length > 0 && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{bulkSelected.length} selected</span>
                    )}
                  </div>
                )}

                <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2 scrollbar-thin">
                  {Array.from(new Set(filteredQs.map(q => q.parsed_payload?.section_name || 'Overall'))).map((sectionName) => {
                    const sectionQs = filteredQs.filter(q => (q.parsed_payload?.section_name || 'Overall') === sectionName);
                    if (sectionQs.length === 0) return null;
                    return (
                      <div key={sectionName} className="space-y-2.5">
                        <h4 className="text-indigo-900 dark:text-indigo-300 font-extrabold text-xs uppercase tracking-wider bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 rounded-xl">{sectionName}</h4>
                        <div className="space-y-2.5">
                          {sectionQs.map((q, idx) => (
                            <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.008 }}>
                              <QuestionItem
                                q={q}
                                resultId={result.id}
                                onUnlock={(nb) => setBalance(nb)}
                                authUser={authUser}
                                balance={balance}
                                isSelected={bulkSelected.includes(q.id)}
                                onToggleSelect={toggleBulkSelect}
                                externalSolution={bulkSolutions[q.id] || null}
                                testDate={result.test_date}
                                testTime={result.test_time}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {filteredQs.length === 0 && <p className="text-center text-slate-400 font-bold py-12 text-sm">No questions match this filter selection.</p>}
                </div>
              </div>

              {/* Floating Bulk Action Bar */}
              <AnimatePresence>
                {bulkSelected.length > 0 && !bulkProgress.running && (
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 border border-slate-700 dark:border-slate-800"
                  >
                    <span className="text-sm font-bold text-slate-200 dark:text-slate-350">{bulkSelected.length} questions selected</span>
                    <button
                      onClick={() => handleBulkGenerate(bulkSelected)}
                      className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                    >
                      <FaRobot /> Generate Solutions
                    </button>
                    <button
                      onClick={() => setBulkSelected([])}
                      className="text-slate-400 hover:text-white transition text-lg"
                    >
                      <FaTimes />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Points Banner */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-800/80 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
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
                  </div>
                </div>
                <Link
                  href="/marketplace"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-5 py-3 rounded-xl flex items-center gap-2 text-xs sm:text-sm shadow-lg transition shrink-0"
                >
                  <FaShoppingBag className="text-sm" /> Explore Question Bank &amp; Points
                </Link>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 pt-12 pb-8 px-4 mt-16 border-t border-slate-800">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <span className="text-slate-500">| Official Result &amp; Rank Engine</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400 font-medium">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <Link href="/exams" className="hover:text-white transition">Exams</Link>
              <Link href="/marketplace" className="hover:text-white transition">Question Bank</Link>
            </div>
            <div className="text-slate-500 text-[11px]">
              © {new Date().getFullYear()} RankResult. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
