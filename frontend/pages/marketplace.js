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
      setExams(Array.isArray(data.exams) ? data.exams : []);
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
    setPage(1);
    setSearch('');
    setSelectedIds([]);
    setFilters({ subject: '', shift_date: '', shift_time: '' });
    loadShifts(exam.id);
  };

  const loadShifts = async (examId) => {
    setShiftsLoading(true);
    try {
      const res = await fetch(`${API}/api/marketplace/exams/${examId}/shifts`, { headers: authHeaders });
      const data = await res.json();
      setShifts(Array.isArray(data.shifts) ? data.shifts : []);
    } catch (e) { console.error(e); }
    finally { setShiftsLoading(false); }
  };

  const openShift = (shift) => {
    setSelectedShift(shift);
    setPage(1);
    setSearch('');
    setSelectedIds([]);
    loadQuestions(selectedExam.id, 1, '', shift);
  };

  const loadQuestions = async (examId, pg, sq, shift = null) => {
    setQLoading(true);
    try {
      let url = `${API}/api/marketplace/exams/${examId}/questions?page=${pg}&per_page=20`;
      if (sq) url += `&search=${encodeURIComponent(sq)}`;
      if (shift) {
        if (shift.subject) url += `&subject=${encodeURIComponent(shift.subject)}`;
        if (shift.test_date) url += `&shift_date=${encodeURIComponent(shift.test_date)}`;
        if (shift.test_time) url += `&shift_time=${encodeURIComponent(shift.test_time)}`;
      }
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setTotalPages(data.pages || 1);
    } catch (e) { console.error(e); }
    finally { setQLoading(false); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDownload = () => {
    if (!selectedExam || !selectedShift) return;
    const shift = selectedShift;
    const downloadUrl = `${API}/api/marketplace/exams/${selectedExam.id}/download?subject=${encodeURIComponent(shift.subject)}&shift_date=${encodeURIComponent(shift.test_date)}&shift_time=${encodeURIComponent(shift.test_time)}&token=${token || ''}`;
    window.open(downloadUrl, '_blank');
  };

  const buyItem = (item, kind = 'exam') => {
    if (!user) {
      router.push('/login');
      return;
    }
    setBuyMsg('');
    setBuyModal({ ...item, kind });
  };

  const confirmBuy = async () => {
    if (!buyModal) return;
    setBuying(true);
    setBuyMsg('Processing request...');
    try {
      if (buyModal.kind === 'pack') {
        const res = await fetch(`${API}/api/marketplace/packs/${buyModal.id}/buy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders }
        });
        const data = await res.json();
        if (data.success) {
          setBuyMsg('✅ ' + data.message);
          fetchExams();
          fetchPacks();
          setTimeout(() => setBuyModal(null), 1500);
        } else {
          setBuyMsg('❌ ' + (data.error || 'Failed to purchase pack'));
        }
      } else if (buyModal.kind === 'pointspack') {
        const orderRes = await fetch(`${API}/api/payments/razorpay/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ points_pack_id: buyModal.id }),
        });
        const orderData = await orderRes.json();
        if (!orderData.success) {
          setBuyMsg('❌ ' + (orderData.error || 'Failed to create order'));
          setBuying(false);
          return;
        }

        if (typeof window !== 'undefined' && window.Razorpay) {
          const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'RankResult',
            description: `Points Pack: ${buyModal.name}`,
            order_id: orderData.order_id,
            handler: async function (response) {
              setBuying(true);
              setBuyMsg('Verifying payment details...');
              try {
                const verifyRes = await fetch(`${API}/api/payments/razorpay/verify-payment`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeaders },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    points_pack_id: buyModal.id
                  })
                });
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  setBuyMsg('✅ Points added successfully!');
                  fetchUserPoints();
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
              name: orderData.user.name || '',
              email: orderData.user.email || ''
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
      } else {
        const res = await fetch(`${API}/api/marketplace/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ exam_id: buyModal.id }),
        });
        const data = await res.json();
        if (data.success) {
          setBuyMsg('✅ ' + data.message);
          fetchUserPoints();
          fetchExams();
          fetchPacks();
          setTimeout(() => {
            setBuyModal(null);
            openExam({ ...buyModal, is_purchased: true });
          }, 1500);
        } else {
          setBuyMsg('❌ ' + (data.error || 'Purchase failed'));
        }
      }
    } catch (e) {
      setBuyMsg('❌ Network error');
    } finally {
      if (buyModal?.kind !== 'pack') {
        setBuying(false);
      }
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
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
          <NavBar user={currentUser} />
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <button onClick={() => { setSelectedExam(null); setSelectedShift(null); }}
                  className="text-indigo-600 hover:text-indigo-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                  ← Back to Exams
                </button>
                <h1 className="text-2xl font-extrabold text-indigo-950">{selectedExam.name}</h1>
                <p className="text-slate-500 text-xs mt-0.5">Select a shift to view questions</p>
              </div>
              {!selectedExam.is_purchased ? (
                <button onClick={() => buyItem(selectedExam, 'exam')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white font-bold text-xs shadow-md">
                  <FaShoppingCart /> Unlock — {selectedExam.price} Points
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold">
                  <FaUnlock /> Purchased ✅
                </div>
              )}
            </div>

            {shiftsLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <FaCalendar className="text-4xl mx-auto mb-4 opacity-30 text-indigo-600" />
                <p className="text-sm font-bold text-slate-500">No shifts available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shifts.map((shift) => (
                  <motion.button key={`${shift.test_date}-${shift.test_time}-${shift.subject}`}
                    onClick={() => openShift(shift)}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 text-left hover:border-indigo-600 hover:shadow-sm transition duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-indigo-950">{shift.subject}</h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1">{shift.test_date} · {shift.test_time}</p>
                      </div>
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-150">
                        {shift.question_count} Qs
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600 text-xs font-bold group">
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

  // ── Question Detail View ─────────────────────────────────────────────────
  if (selectedExam && selectedShift) {
    return (
      <>
        <Head>
          <title>{selectedExam.name} — Question Bank | RankResult</title>
        </Head>
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
          <NavBar user={currentUser} />
          <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <button onClick={() => setSelectedShift(null)}
                  className="text-indigo-600 hover:text-indigo-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1 mb-2">
                  ← Back to Shifts
                </button>
                <h1 className="text-2xl font-extrabold text-indigo-950">{selectedExam.name}</h1>
                <p className="text-slate-500 text-xs mt-0.5">{selectedShift.subject} · {selectedShift.test_date} {selectedShift.test_time}</p>
              </div>
              {!selectedExam.is_purchased ? (
                <button onClick={() => buyItem(selectedExam, 'exam')}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white font-bold text-xs shadow-md">
                  <FaShoppingCart /> Unlock — {selectedExam.price} Points
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold">
                  <FaUnlock /> Purchased ✅
                </div>
              )}
            </div>

            {/* Search + Download */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <FaSearch className="absolute left-4 top-3.5 text-slate-400 text-sm" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); loadQuestions(selectedExam.id, 1, e.target.value, selectedShift); }}
                  placeholder="Search questions in this shift..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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
                    className="bg-white border border-slate-100 rounded-3xl p-5 hover:border-slate-200 transition shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => toggleSelect(q.id)} className="mt-1.5 accent-indigo-650 rounded border-slate-300" />
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-100 shrink-0 mt-0.5">
                        Q{i + 1 + (page - 1) * 20}
                      </span>
                      <p className="text-slate-850 font-bold leading-relaxed text-sm flex-1">{q.question_text}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {['a', 'b', 'c', 'd'].map((opt, idx) => {
                        const label = OPTION_LABELS[idx];
                        const text = q[`option_${opt}_text`];
                        const isCorrect = !q.is_locked && q.correct_answer === label;
                        const isLocked = q.is_locked;

                        return (
                          <div key={opt} className={`relative px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 overflow-hidden
                            ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800' :
                              isLocked ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-slate-100 bg-white text-slate-700'}`}>
                            <span style={{ color: OPTION_COLORS[label] }} className="font-extrabold shrink-0">{label}.</span>
                            {isLocked ? (
                              <span className="flex items-center gap-1.5 text-slate-350 blur-[3px] select-none">
                                ••••••••••••••
                              </span>
                            ) : (
                              <span>{text}</span>
                            )}
                            {isCorrect && <FaCheck className="ml-auto text-emerald-600 shrink-0 text-[10px]" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.is_locked && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-500 font-bold">
                        <FaLock className="text-[10px]" /> <span>Unlock to view answer</span>
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 flex-wrap">
                      {q.shift_info?.subject && (
                        <span className="text-[10px] font-extrabold bg-slate-50 text-slate-400 px-2.5 py-1 rounded-full border border-slate-100">
                          {q.shift_info.subject}
                        </span>
                      )}
                      {q.shift_info?.test_date && (
                        <span className="text-[10px] font-extrabold bg-slate-50 text-slate-400 px-2.5 py-1 rounded-full border border-slate-100">
                          {q.shift_info.test_date}
                        </span>
                      )}
                      {q.shift_info?.test_time && (
                        <span className="text-[10px] font-extrabold bg-slate-50 text-slate-400 px-2.5 py-1 rounded-full border border-slate-100">
                          {q.shift_info.test_time}
                        </span>
                      )}
                      {q.shift_count > 1 && (
                        <span className="text-[10px] font-extrabold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full border border-purple-100">
                          +{q.shift_count - 1} shifts
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs font-bold text-slate-400">
                {selectedIds.length > 0 ? `${selectedIds.length} selected for quick export` : 'Select questions for bulk actions'}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  <button onClick={() => { setPage(p => Math.max(1, p - 1)); loadQuestions(selectedExam.id, Math.max(1, page - 1), search, filters); }}
                    disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 text-xs font-bold">‹</button>
                  {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => { setPage(p); loadQuestions(selectedExam.id, p, search, filters); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${page === p ? 'bg-indigo-650 text-white' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}>{p}</button>
                  ))}
                  <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); loadQuestions(selectedExam.id, Math.min(totalPages, page + 1), search, filters); }}
                    disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 text-xs font-bold">›</button>
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
        <title>Question Bank Marketplace — RankResult</title>
        <meta name="description" content="Question Bank for all competitive exams. RRB NTPC, SSC, Banking — all shifts questions at one place." />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <NavBar user={currentUser} />

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/30" />
          <div className="max-w-5xl mx-auto px-4 py-16 text-center relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold px-4 py-1.5 rounded-full mb-4">
                <FaBookOpen className="text-xs" /> Premium Question Bank
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-950 tracking-tight mb-4">
                Exam Question Bank{' '}
                <span className="text-indigo-600">
                  Marketplace
                </span>
              </h1>
              <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                All shifts questions, correct answers and AI solutions — at one place.
                Spend points, get unlimited access.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Packs Section */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-indigo-950 mb-1">📦 Question Bank Packs</h2>
              <p className="text-slate-500 text-xs">Buy a bundle of exams at once and unlock every exam inside the pack.</p>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 select-none shadow-sm shadow-amber-100">
                  <FaCoins /> {currentUser.balance || 0} Points
                </span>
              )}
              <Link href="/pricing" className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition">
                💎 Get Points
              </Link>
            </div>
          </div>
          {packsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <p className="text-sm font-bold text-slate-500">No pack offers available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {packs.map((pack, i) => (
                <motion.div key={pack.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-extrabold text-indigo-950">{pack.name}</h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">{pack.description || 'Bundle multiple exams into one unlock.'}</p>
                      </div>
                      {pack.purchased ? (
                        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">Purchased</span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600">₹{pack.price || 0}</span>
                      )}
                    </div>
                    <div className="mt-4 text-xs font-bold text-slate-400">Includes {(pack.exam_ids || []).length} exams</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-sm text-gray-200">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Students</div>
                        <div className="text-base font-extrabold text-indigo-950 mt-1">{maskMetric(pack.student_count, pack.purchased)}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Questions</div>
                        <div className="text-base font-extrabold text-indigo-950 mt-1">{maskMetric(pack.question_count, pack.purchased)}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sets</div>
                        <div className="text-base font-extrabold text-indigo-950 mt-1">{maskMetric(pack.set_count, pack.purchased)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    {pack.purchased ? (
                      <Link href={`/marketplace/packs/${pack.id}/analysis`} className="w-full">
                        <button className="w-full py-2.5 rounded-xl bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-sm">
                          View Access &amp; Marks Analysis
                        </button>
                      </Link>
                    ) : (
                      <button onClick={() => buyItem(pack, 'pack')} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm">
                        Unlock Pack — ₹{pack.price || 0}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Exam Cards */}
        {packs.length === 0 && (
          <div className="max-w-5xl mx-auto px-4 pb-16">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-3xl shadow-sm">
                <FaBookOpen className="text-5xl mx-auto mb-4 opacity-30 text-indigo-600" />
                <p className="text-sm font-bold text-slate-500">No exams available yet. Coming soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exams.map((exam, i) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden hover:border-indigo-100 hover:shadow-sm transition duration-200 group flex flex-col justify-between"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-base font-extrabold text-indigo-950 group-hover:text-indigo-600 transition">{exam.name}</h2>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="flex items-center gap-1 font-semibold"><FaCalendar className="text-[10px]" /> {exam.date}</span>
                            <span>·</span>
                            <span className="font-bold text-slate-500">{exam.shifts || 1} Shifts</span>
                          </div>
                        </div>
                        {exam.purchased ? (
                          <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-extrabold px-3 py-1 rounded-full shrink-0">
                            <FaUnlock className="text-[10px]" /> Purchased
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-extrabold px-3 py-1 rounded-full shrink-0 select-none shadow-sm shadow-amber-100">
                            <FaCoins className="text-[10px]" /> {exam.price} pts
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { label: 'Questions', value: exam.total_questions || '—' },
                          { label: 'Subjects', value: exam.subjects?.length || '—' },
                          { label: 'Shifts', value: exam.shifts || 1 },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-2xl px-3 py-2 text-center">
                            <div className="text-base font-extrabold text-indigo-950">{s.value}</div>
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {exam.subjects && exam.subjects.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {exam.subjects.slice(0, 4).map(s => (
                            <span key={s} className="text-[10px] font-extrabold bg-indigo-50/50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-6 pb-5 flex gap-3">
                      <button
                        onClick={() => openExam(exam)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-650 hover:bg-slate-50/30 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
                      >
                        View Questions
                      </button>
                      {!exam.purchased ? (
                        <button
                          onClick={() => buyItem(exam, 'exam')}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-sm"
                        >
                          <FaShoppingCart className="text-xs" /> Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => openExam(exam)}
                          className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-250 text-emerald-600 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm"
                        >
                          <FaUnlock className="text-xs" /> Full Access
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buy Modal */}
      <AnimatePresence>
        {buyModal && (
          <motion.div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-lg"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-lg font-extrabold text-indigo-950 mb-2">🛒 Confirm Purchase</h3>
              <p className="text-slate-500 text-xs mb-4 leading-relaxed">Unlock {buyModal.name} {buyModal.kind === 'pointspack' ? 'Points Bundle' : 'Question Bank'}.</p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 flex justify-between items-center shadow-sm">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Price</span>
                <span className="text-amber-500 font-extrabold text-base flex items-center gap-1">
                  {buyModal.kind === 'pointspack' ? `₹${buyModal.price}` : <><FaCoins className="text-xs" /> {buyModal.price} Points</>}
                </span>
              </div>
              {buyMsg && (
                <div className={`mb-4 text-xs font-semibold px-4 py-3 rounded-xl ${buyMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {buyMsg}
                </div>
              )}
              {!buyMsg.startsWith('✅') && (
                <div className="flex gap-3">
                  <button onClick={() => setBuyModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs font-bold transition">
                    Cancel
                  </button>
                  <button onClick={confirmBuy} disabled={buying}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white font-extrabold text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    {buying ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : '✅ Confirm'}
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

function NavBar({ user }) {
  return <Navbar user={user} />;
}
