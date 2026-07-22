import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaLock, FaUnlock, FaSearch, FaCoins, FaBookOpen,
  FaCalendar, FaFilter, FaCheck, FaTimes, FaShoppingCart, FaUser, FaChartLine
} from 'react-icons/fa';
import Navbar from '../components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('rv_token');
      const u = localStorage.getItem('rv_user');
      if (t) setToken(t);
      if (u) try { setUser(JSON.parse(u)); } catch {}
    }
  }, []);
  return { user, token };
}

export default function Marketplace() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [exams, setExams] = useState([]);
  const [packs, setPacks] = useState([]);

  const maskMetric = (value, purchased) => {
    if (purchased || value == null) return value;
    const text = String(value);
    return text.length <= 2 ? text : `${text.slice(0, 2)}**`;
  };
  const [loading, setLoading] = useState(true);
  const [packsLoading, setPacksLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [buyModal, setBuyModal] = useState(null);
  const [buying, setBuying] = useState(false);
  const [buyMsg, setBuyMsg] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ subject: '', shift_date: '', shift_time: '' });
  const [filterOptions, setFilterOptions] = useState({ subjects: [], dates: [], times: [] });
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchExams();
    fetchPacks();
    fetchUserPoints();
  }, [user]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchUserPoints = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/user/${user.id}/points`);
      const data = await res.json();
      setCurrentUser(prev => prev ? { ...prev, balance: data.balance } : { ...user, balance: data.balance });
      
      const localUser = JSON.parse(localStorage.getItem('rv_user') || '{}');
      localUser.balance = data.balance;
      localStorage.setItem('rv_user', JSON.stringify(localUser));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/marketplace/exams`, { headers: authHeaders });
      const data = await res.json();
      const uniqueExams = Array.isArray(data.exams)
        ? data.exams.filter((exam, index, self) => self.findIndex(e => e.id === exam.id) === index)
        : [];
      setExams(uniqueExams);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchPacks = async () => {
    setPacksLoading(true);
    try {
      const res = await fetch(`${API}/api/marketplace/packs`, { headers: authHeaders });
      const data = await res.json();
      const uniquePacks = Array.isArray(data.packs)
        ? data.packs.filter((pack, index, self) => self.findIndex(p => p.id === pack.id) === index)
        : [];
      setPacks(uniquePacks);
    } catch (e) { console.error(e); }
    finally { setPacksLoading(false); }
  };

  const openExam = async (exam) => {
    setSelectedExam(exam);
    setSelectedShift(null);
    setShiftsLoading(true);
    try {
      const res = await fetch(`${API}/api/marketplace/exams/${exam.id}/shifts`, { headers: authHeaders });
      const data = await res.json();
      setShifts(Array.isArray(data.shifts) ? data.shifts : []);
    } catch (e) { console.error(e); }
    finally { setShiftsLoading(false); }
  };

  const openShift = async (shift) => {
    setSelectedShift(shift);
    setPage(1);
    setSearch('');
    setFilters({ subject: shift.subject, shift_date: shift.test_date, shift_time: shift.test_time });
    setSelectedIds([]);
    await loadQuestions(selectedExam.id, 1, '', { subject: shift.subject, shift_date: shift.test_date, shift_time: shift.test_time });
  };

  const loadQuestions = async (examId, p = 1, q = '', f = filters) => {
    setQLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (q) params.append('q', q);
      if (f.subject) params.append('subject', f.subject);
      if (f.shift_date) params.append('shift_date', f.shift_date);
      if (f.shift_time) params.append('shift_time', f.shift_time);

      const res = await fetch(`${API}/api/marketplace/exams/${examId}/questions?${params}`, { headers: authHeaders });
      const data = await res.json();
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setTotalPages(data.total_pages || 1);
      if (data.filters) setFilterOptions(data.filters);
    } catch (e) { console.error(e); }
    finally { setQLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadQuestions(selectedExam.id, 1, search, filters);
  };

  const handleFilterChange = (key, val) => {
    const next = { ...filters, [key]: val };
    setFilters(next);
    setPage(1);
    loadQuestions(selectedExam.id, 1, search, next);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDownload = () => {
    if (!selectedExam || !selectedShift) return;
    const url = `${API}/api/marketplace/shifts/download?exam_id=${selectedExam.id}&subject=${encodeURIComponent(selectedShift.subject)}&test_date=${encodeURIComponent(selectedShift.test_date)}&test_time=${encodeURIComponent(selectedShift.test_time)}`;
    window.open(url, '_blank');
  };

  const buyItem = (item, kind = 'exam') => {
    if (!user) { router.push('/login?redirect=/marketplace'); return; }
    setBuyMsg('');
    if (kind === 'exam') {
      const pack = packs.find(p => p.exam_ids && p.exam_ids.some(x => (typeof x === 'object' ? x.exam_id : x) === item.id));
      if (pack) {
        setBuyModal({ ...pack, kind: 'pack' });
        return;
      }
    }
    setBuyModal({ ...item, kind });
  };

  const confirmBuy = async () => {
    if (!buyModal) return;
    setBuying(true);
    setBuyMsg('Processing...');
    try {
      const orderRes = await fetch(`${API}/api/marketplace/packs/${buyModal.id}/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders }
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        setBuyMsg('❌ ' + (orderData.error || 'Failed to create order'));
        setBuying(false);
        return;
      }

      if (orderData.is_mock) {
        const verifyRes = await fetch(`${API}/api/marketplace/packs/${buyModal.id}/razorpay/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ is_mock: true })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setBuyMsg('✅ ' + verifyData.message);
          fetchExams();
          fetchPacks();
          setTimeout(() => setBuyModal(null), 1500);
        } else {
          setBuyMsg('❌ ' + (verifyData.error || 'Verification failed'));
        }
      } else if (window.Razorpay) {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'RankResult',
          description: `Pack: ${buyModal.name}`,
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              const verifyRes = await fetch(`${API}/api/marketplace/packs/${buyModal.id}/razorpay/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setBuyMsg('✅ ' + verifyData.message);
                fetchExams();
                fetchPacks();
                setTimeout(() => setBuyModal(null), 1500);
              } else {
                setBuyMsg('❌ ' + (verifyData.error || 'Verification failed'));
              }
            } catch (err) {
              setBuyMsg('❌ Verification error');
            } finally {
              setBuying(false);
            }
          },
          prefill: {
            name: orderData.user?.name || '',
            email: orderData.user?.email || ''
          },
          theme: { color: '#6366f1' },
          modal: {
            ondismiss: function () {
              setBuyMsg('❌ Payment cancelled');
              setBuying(false);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (e) {
      setBuyMsg('❌ Network error');
    } finally {
      setBuying(false);
    }
  };

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];
  const OPTION_COLORS = { A: '#3b82f6', B: '#a855f7', C: '#f59e0b', D: '#ef4444' };

  // ── Shift Selection View ─────────────────────────────────────────────────
  if (selectedExam && !selectedShift) {
    return (
      <>
        <Head>
          <title>{selectedExam.name} — Shifts | RankResult</title>
        </Head>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors">
          <Navbar user={currentUser} />
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <button onClick={() => { setSelectedExam(null); setSelectedShift(null); }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                  ← Back to Exams
                </button>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{selectedExam.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Select a shift to view questions</p>
              </div>
              {!selectedExam.is_purchased ? (
                <button onClick={() => buyItem(selectedExam, 'exam')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md">
                  <FaShoppingCart /> Unlock — ₹{selectedExam.price || 0} INR
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <FaUnlock /> Purchased ✅
                </div>
              )}
            </div>

            {shiftsLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-sm">
                <FaCalendar className="text-4xl mx-auto mb-4 opacity-30 text-indigo-600" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No shifts available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shifts.map((shift) => (
                  <motion.button key={`${shift.test_date}-${shift.test_time}-${shift.subject}`}
                    onClick={() => openShift(shift)}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 text-left hover:border-indigo-500 transition duration-200 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{shift.subject}</h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{shift.test_date} · {shift.test_time}</p>
                      </div>
                      <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                        {shift.question_count} Qs
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-bold group">
                      View Questions <FaChartLine className="text-[10px] group-hover:translate-x-0.5 transition" />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Shift Questions View ──────────────────────────────────────────────────
  if (selectedExam && selectedShift) {
    return (
      <>
        <Head>
          <title>{selectedShift.subject} Questions — {selectedExam.name} | RankResult</title>
        </Head>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors">
          <Navbar user={currentUser} />
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <button onClick={() => setSelectedShift(null)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                  ← Back to Shifts
                </button>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{selectedShift.subject}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{selectedExam.name} · {selectedShift.test_date} · {selectedShift.test_time}</p>
              </div>

              <button onClick={handleDownload} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white flex items-center gap-2 shadow-sm">
                ⬇ Download {selectedShift.subject} Shift ({selectedShift.question_count} Qs)
              </button>
            </div>

            {/* Questions List */}
            {qLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <motion.div key={q.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => toggleSelect(q.id)} className="mt-1.5 accent-indigo-600 rounded border-slate-300" />
                      <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 shrink-0 mt-0.5">
                        Q{i + 1 + (page - 1) * 20}
                      </span>
                      <p className="text-slate-900 dark:text-white font-bold leading-relaxed text-sm flex-1">{q.question_text}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {['a', 'b', 'c', 'd'].map((opt, idx) => {
                        const label = OPTION_LABELS[idx];
                        const text = q[`option_${opt}_text`];
                        const isCorrect = !q.is_locked && q.correct_answer === label;
                        const isLocked = q.is_locked;

                        return (
                          <div key={opt} className={`relative px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 overflow-hidden
                            ${isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' :
                              isLocked ? 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/60 text-slate-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200'}`}>
                            <span style={{ color: OPTION_COLORS[label] }} className="font-extrabold shrink-0">{label}.</span>
                            {isLocked ? (
                              <span className="flex items-center gap-1.5 text-slate-400 blur-[3px] select-none">
                                ••••••••••••••
                              </span>
                            ) : (
                              <span>{text}</span>
                            )}
                            {isCorrect && <FaCheck className="ml-auto text-emerald-600 dark:text-emerald-400 shrink-0 text-[10px]" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.is_locked && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
                        <FaLock className="text-[10px]" /> <span>Unlock to view answer</span>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 flex-wrap">
                      {q.shift_info?.subject && (
                        <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                          {q.shift_info.subject}
                        </span>
                      )}
                      {q.shift_info?.test_date && (
                        <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                          {q.shift_info.test_date}
                        </span>
                      )}
                      {q.shift_info?.test_time && (
                        <span className="text-[10px] font-extrabold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                          {q.shift_info.test_time}
                        </span>
                      )}
                      {q.shift_count > 1 && (
                        <span className="text-[10px] font-extrabold bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                          +{q.shift_count - 1} shifts
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {selectedIds.length > 0 ? `${selectedIds.length} selected for quick export` : 'Select questions for bulk actions'}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  <button onClick={() => { setPage(p => Math.max(1, p - 1)); loadQuestions(selectedExam.id, Math.max(1, page - 1), search, filters); }}
                    disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-bold text-slate-800 dark:text-white">‹</button>
                  {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => { setPage(p); loadQuestions(selectedExam.id, p, search, filters); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${page === p ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{p}</button>
                  ))}
                  <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); loadQuestions(selectedExam.id, Math.min(totalPages, page + 1), search, filters); }}
                    disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-bold text-slate-800 dark:text-white">›</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Exam List View ────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Exam Question Bank Marketplace - RankResult.in | Score &amp; Question Solutions</title>
        <meta name="description" content="Explore previous year exam question banks for SSC, Railway, BPSC and Banking exams. All shift questions with correct answer key &amp; AI solutions." />
        <meta name="keywords" content="Exam Question Bank, SSC Question Bank, Railway Question Bank, BPSC Question Bank, Answer Key Solutions, RankResult Marketplace" />
        <link rel="canonical" href="https://rankresult.in/marketplace" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Exam Question Bank Marketplace - RankResult.in" />
        <meta property="og:description" content="All shift questions, answer keys &amp; AI solutions for SSC, Railway, BPSC exams." />
        <meta property="og:url" content="https://rankresult.in/marketplace" />
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors">
        <Navbar user={currentUser} />

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-white dark:from-[#0b0f29] dark:via-[#0f172a] dark:to-slate-950 transition-colors" />
          <div className="max-w-5xl mx-auto px-4 py-16 text-center relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold px-4 py-1.5 rounded-full mb-4">
                <FaBookOpen className="text-xs" /> Premium Question Bank
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                Exam Question Bank{' '}
                <span className="text-indigo-600 dark:text-indigo-400">
                  Marketplace
                </span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                All shifts questions, correct answers and AI solutions — at one place.
                Get full access to individual exam question bank packs or multi-exam bundles.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Packs Section */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">📦 Question Bank Bundles</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Buy a bundle of multiple exams at once to unlock every exam inside the pack.</p>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <span className="text-xs bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 px-3.5 py-1.5 rounded-xl font-black flex items-center gap-1.5 select-none shadow-sm">
                  <FaCoins className="text-amber-500 dark:text-amber-400" /> {currentUser.balance || 0} Points
                </span>
              )}
              <Link href="/pricing" className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition">
                💎 Get Points
              </Link>
            </div>
          </div>
          {packsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-sm">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No pack offers available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {packs.map((pack, i) => (
                <motion.div key={pack.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">{pack.name}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{pack.description || 'Bundle multiple exams into one unlock.'}</p>
                      </div>
                      {pack.purchased ? (
                        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">Purchased</span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">₹{pack.price || 0} INR</span>
                      )}
                    </div>
                    <div className="mt-4 text-xs font-bold text-slate-400">Includes {(pack.exam_ids || []).length} exam{(pack.exam_ids || []).length === 1 ? '' : 's'}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-sm text-slate-800 dark:text-slate-200">
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Students</div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-1">{maskMetric(pack.student_count, pack.purchased)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Questions</div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-1">{maskMetric(pack.question_count, pack.purchased)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-3">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sets</div>
                        <div className="text-base font-black text-slate-900 dark:text-white mt-1">{maskMetric(pack.set_count, pack.purchased)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    {pack.purchased ? (
                      <Link href={`/marketplace/packs/${pack.id}/analysis`} className="w-full">
                        <button className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-sm">
                          View Shift Analysis
                        </button>
                      </Link>
                    ) : (
                      <button onClick={() => buyItem(pack, 'pack')} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm">
                        Unlock Pack (₹{pack.price} INR)
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Exam List Header */}
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">📋 Individual Exam Question Bank Packs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unlock individual exam question bank packs directly with ₹ INR (Razorpay checkout).</p>
          </div>

          {/* Exams Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-3xl shadow-sm">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No exams in marketplace yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam) => (
                <motion.div key={exam.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">{exam.name}</h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{exam.full_name}</p>
                      </div>
                      {exam.is_purchased ? (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shrink-0">Unlocked</span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 shrink-0">₹{exam.price || 0} INR</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-4 text-slate-800 dark:text-slate-200">
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2.5 text-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase">Shifts</div>
                        <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{exam.shift_count || 0}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2.5 text-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase">Questions</div>
                        <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{maskMetric(exam.question_count, exam.is_purchased)}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2.5 text-center">
                        <div className="text-[9px] font-black text-slate-400 uppercase">Students</div>
                        <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{maskMetric(exam.student_count, exam.is_purchased)}</div>
                      </div>
                    </div>
                  </div>

                  {exam.is_purchased ? (
                    <div className="flex flex-col gap-2 mt-4 w-full">
                      <button onClick={() => openExam(exam)} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-sm">
                        Explore Question Bank
                      </button>
                      {exam.pack_id && (
                        <Link href={`/marketplace/packs/${exam.pack_id}/analysis`} className="w-full">
                          <button className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-sm">
                            View Shift Analysis
                          </button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => buyItem(exam, 'exam')} className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-sm mt-4">
                      Unlock Exam Pack (₹{exam.price || 0} INR)
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buy Confirm Modal */}
      <AnimatePresence>
        {buyModal && (
          <motion.div className="fixed inset-0 bg-slate-900/60 dark:bg-indigo-950/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-xl"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">🛒 Confirm Razorpay Checkout</h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mb-4 leading-relaxed">Unlock access to {buyModal.name}.</p>
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 mb-5 flex justify-between items-center shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Price</span>
                <span className="text-amber-600 dark:text-amber-400 font-extrabold text-base flex items-center gap-1">
                  ₹{buyModal.price || 0} INR
                </span>
              </div>
              {buyMsg && (
                <div className={`mb-4 text-xs font-semibold px-4 py-3 rounded-xl ${buyMsg.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
                  {buyMsg}
                </div>
              )}
              {!buyMsg.startsWith('✅') && (
                <div className="flex gap-3">
                  <button onClick={() => setBuyModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition">
                    Cancel
                  </button>
                  <button onClick={confirmBuy} disabled={buying}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    {buying ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : '💳 Proceed to Pay'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
