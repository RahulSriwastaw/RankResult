import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaLock, FaUnlock, FaSearch, FaCoins, FaBookOpen,
  FaCalendar, FaFilter, FaCheck, FaTimes, FaShoppingCart, FaUser, FaChartLine
} from 'react-icons/fa';

const API = 'http://localhost:5000';

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
  const [pointsPacks, setPointsPacks] = useState([]);
  const [pointsPacksLoading, setPointsPacksLoading] = useState(true);

  useEffect(() => {
    fetchExams();
    fetchPacks();
    fetchPointsPacks();
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

  const fetchPointsPacks = async () => {
    setPointsPacksLoading(true);
    try {
      const res = await fetch(`${API}/api/marketplace/points-packs`);
      const data = await res.json();
      setPointsPacks(Array.isArray(data.packs) ? data.packs : []);
    } catch (e) {
      console.error(e);
    } finally {
      setPointsPacksLoading(false);
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
        url += `&shift_date=${encodeURIComponent(shift.test_date)}`;
        url += `&shift_time=${encodeURIComponent(shift.test_time)}`;
        url += `&shift_subject=${encodeURIComponent(shift.subject)}`;
      }
      const res = await fetch(url, { headers: authHeaders });
      const data = await res.json();
      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setTotalPages(data.pages || 1);
      setSelectedExam(prev => ({ ...prev, is_purchased: data.is_purchased }));
    } catch (e) { console.error(e); }
    finally { setQLoading(false); }
  };

  const applyFilters = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
    setSelectedIds([]);
    loadQuestions(selectedExam.id, 1, search, selectedShift);
  };

  const handleDownload = async () => {
    if (!selectedExam || !selectedShift) return;
    const query = new URLSearchParams({ 
      export: 'csv', 
      page: 1, 
      per_page: 500, 
      search,
      shift_date: selectedShift.test_date,
      shift_time: selectedShift.test_time,
      shift_subject: selectedShift.subject,
    });
    const url = `${API}/api/marketplace/exams/${selectedExam.id}/questions?${query.toString()}`;
    window.open(url, '_blank');
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const buyItem = async (item, kind = 'exam') => {
    if (!user) {
      router.push(`/login?redirect=/marketplace`);
      return;
    }
    setBuyModal({ ...item, kind });
    setBuyMsg('');
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const confirmBuy = async () => {
    setBuying(true);
    setBuyMsg('');
    try {
      if (buyModal.kind === 'pointspack') {
        const res = await fetch(`${API}/api/marketplace/points-packs/purchase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ pack_id: buyModal.id }),
        });
        const data = await res.json();
        if (data.success) {
          setBuyMsg('✅ ' + data.message);
          fetchUserPoints();
          setTimeout(() => setBuyModal(null), 1200);
        } else {
          setBuyMsg('❌ ' + (data.error || 'Purchase failed'));
        }
      } else if (buyModal.kind === 'pack') {
        // Razorpay flow for B2B packs
        const resOrder = await fetch(`${API}/api/marketplace/packs/${buyModal.id}/razorpay/order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders }
        });
        const orderData = await resOrder.json();
        if (!orderData.success) {
          setBuyMsg('❌ ' + (orderData.error || 'Failed to initialize order'));
          setBuying(false);
          return;
        }

        if (orderData.is_mock) {
          const confirmMock = window.confirm(`[RAZORPAY SANDBOX] Pay ₹${buyModal.price} for pack "${buyModal.name}"?`);
          if (!confirmMock) {
            setBuyMsg('❌ Payment cancelled');
            setBuying(false);
            return;
          }
          // Call verify with mock flag
          const resVerify = await fetch(`${API}/api/marketplace/packs/${buyModal.id}/razorpay/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({ is_mock: true })
          });
          const verifyData = await resVerify.json();
          if (verifyData.success) {
            setBuyMsg('✅ ' + verifyData.message);
            fetchPacks();
            fetchExams();
            setTimeout(() => setBuyModal(null), 1200);
          } else {
            setBuyMsg('❌ ' + (verifyData.error || 'Verification failed'));
          }
        } else {
          // Real Razorpay checkout
          const scriptLoaded = await loadRazorpay();
          if (!scriptLoaded) {
            setBuyMsg('❌ Failed to load Razorpay SDK');
            setBuying(false);
            return;
          }
          const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'RankVeda B2B',
            description: orderData.pack.name,
            order_id: orderData.order_id,
            handler: async function (response) {
              setBuying(true);
              setBuyMsg('Verifying payment...');
              try {
                const resVerify = await fetch(`${API}/api/marketplace/packs/${buyModal.id}/razorpay/verify`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeaders },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    is_mock: false
                  })
                });
                const verifyData = await resVerify.json();
                if (verifyData.success) {
                  setBuyMsg('✅ ' + verifyData.message);
                  fetchPacks();
                  fetchExams();
                  setTimeout(() => setBuyModal(null), 1200);
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
        // Original Points purchase flow for standard exams
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
  const OPTION_COLORS = { A: '#60a5fa', B: '#c084fc', C: '#fbbf24', D: '#f87171' };

  // ── Shift Selection View ─────────────────────────────────────────────────
  if (selectedExam && !selectedShift) {
    return (
      <>
        <Head>
          <title>{selectedExam.name} — Shifts | RankVeda</title>
        </Head>
        <div className="min-h-screen bg-gray-950 text-white">
          <NavBar user={user} />
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => { setSelectedExam(null); setSelectedShift(null); }}
                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                ← Back to Exams
              </button>
              <div>
                <h1 className="text-2xl font-bold">{selectedExam.name}</h1>
                <p className="text-gray-400 text-sm mt-0.5">Select a shift to view questions</p>
              </div>
              {!selectedExam.is_purchased && (
                <button onClick={() => buyItem(selectedExam, 'exam')}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold text-sm">
                  <FaShoppingCart /> Unlock — {selectedExam.price} Points
                </button>
              )}
              {selectedExam.is_purchased && (
                <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-green-900/40 border border-green-700 text-green-400 text-sm font-medium">
                  <FaUnlock /> Purchased ✅
                </div>
              )}
            </div>

            {shiftsLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-gray-900/50 border border-gray-800 rounded-2xl">
                <FaCalendar className="text-4xl mx-auto mb-4 opacity-40" />
                <p>No shifts available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shifts.map((shift) => (
                  <motion.button key={`${shift.test_date}-${shift.test_time}-${shift.subject}`}
                    onClick={() => openShift(shift)}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left hover:border-indigo-600 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{shift.subject}</h3>
                        <p className="text-sm text-gray-400 mt-1">{shift.test_date} · {shift.test_time}</p>
                      </div>
                      <span className="bg-indigo-900/50 text-indigo-400 text-sm font-bold px-3 py-1 rounded-full">
                        {shift.question_count} Qs
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium group">
                      View Questions <FaChartLine className="group-hover:translate-x-1 transition" />
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
          <title>{selectedExam.name} — Question Bank | RankVeda</title>
        </Head>
        <div className="min-h-screen bg-gray-950 text-white">
          <NavBar user={user} />
          <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setSelectedShift(null)}
                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1">
                ← Back to Shifts
              </button>
              <div>
                <h1 className="text-2xl font-bold">{selectedExam.name}</h1>
                <p className="text-gray-400 text-sm mt-0.5">{selectedShift.subject} · {selectedShift.test_date} {selectedShift.test_time}</p>
              </div>
              {!selectedExam.is_purchased && (
                <button onClick={() => buyItem(selectedExam, 'exam')}
                  className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-semibold text-sm">
                  <FaShoppingCart /> Unlock — {selectedExam.price} Points
                </button>
              )}
              {selectedExam.is_purchased && (
                <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-green-900/40 border border-green-700 text-green-400 text-sm font-medium">
                  <FaUnlock /> Purchased ✅
                </div>
              )}
            </div>

            {/* Search + Download */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <FaSearch className="absolute left-4 top-3.5 text-gray-500" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); loadQuestions(selectedExam.id, 1, e.target.value, selectedShift); }}
                  placeholder="Search questions in this shift..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button onClick={handleDownload} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white flex items-center gap-2">
                ⬇ Download {selectedShift.subject} Shift ({selectedShift.question_count} Qs)
              </button>
            </div>

            {/* Questions List */}
            {qLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, i) => (
                  <motion.div key={q.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-indigo-800 transition">
                    <div className="flex items-start gap-3 mb-4">
                      <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => toggleSelect(q.id)} className="mt-1 accent-indigo-500" />
                      <span className="bg-indigo-900/50 text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 mt-0.5">
                        Q{i + 1 + (page - 1) * 20}
                      </span>
                      <p className="text-gray-200 leading-relaxed text-sm flex-1">{q.question_text}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {['a', 'b', 'c', 'd'].map((opt, idx) => {
                        const label = OPTION_LABELS[idx];
                        const text = q[`option_${opt}_text`];
                        const isCorrect = !q.is_locked && q.correct_answer === label;
                        const isLocked = q.is_locked;

                        return (
                          <div key={opt} className={`relative px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2 overflow-hidden
                            ${isCorrect ? 'border-green-500 bg-green-900/20 text-green-300' :
                              isLocked ? 'border-gray-700 bg-gray-800/50' : 'border-gray-700 bg-gray-800/40 text-gray-300'}`}>
                            <span style={{ color: OPTION_COLORS[label] }} className="font-bold text-xs shrink-0">{label}.</span>
                            {isLocked ? (
                              <span className="flex items-center gap-1.5 text-gray-600 blur-sm select-none">
                                ••••••••••••••
                              </span>
                            ) : (
                              <span>{text}</span>
                            )}
                            {isCorrect && <FaCheck className="ml-auto text-green-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.is_locked && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <FaLock /> Unlock to view answer
                      </div>
                    )}

                    <div className="mt-3 flex gap-2 flex-wrap">
                      {q.shift_info?.subject && (
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {q.shift_info.subject}
                        </span>
                      )}
                      {q.shift_info?.test_date && (
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {q.shift_info.test_date}
                        </span>
                      )}
                      {q.shift_info?.test_time && (
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                          {q.shift_info.test_time}
                        </span>
                      )}
                      {q.shift_count > 1 && (
                        <span className="text-xs bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded-full">
                          +{q.shift_count - 1} shifts
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-gray-400">
                {selectedIds.length > 0 ? `${selectedIds.length} selected for quick export` : 'Select questions for bulk actions'}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 flex-wrap">
                  <button onClick={() => { setPage(p => Math.max(1, p - 1)); loadQuestions(selectedExam.id, Math.max(1, page - 1), search, filters); }}
                    disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm">‹</button>
                  {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => { setPage(p); loadQuestions(selectedExam.id, p, search, filters); }}
                      className={`px-3 py-1.5 rounded-lg text-sm ${page === p ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}>{p}</button>
                  ))}
                  <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); loadQuestions(selectedExam.id, Math.min(totalPages, page + 1), search, filters); }}
                    disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm">›</button>
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
        <title>Question Bank Marketplace — RankVeda</title>
        <meta name="description" content="Question Bank for all competitive exams. RRB NTPC, SSC, Banking — all shifts questions at one place." />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        <NavBar user={currentUser} />

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-transparent" />
          <div className="max-w-5xl mx-auto px-4 py-16 text-center relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/50 text-indigo-400 text-sm px-4 py-1.5 rounded-full mb-4">
                <FaBookOpen className="text-xs" /> Premium Question Bank
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                Exam Question Bank{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Marketplace
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                All shifts questions, correct answers and AI solutions — at one place.
                Spend points, get unlimited access.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Points Packs Section */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">💎 Buy Points Packs</h2>
              <p className="text-gray-400 text-sm">Purchase points to unlock detailed AI explanations</p>
            </div>
            {currentUser && (
              <span className="text-sm bg-yellow-950/40 border border-yellow-700/50 text-yellow-400 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
                <FaCoins /> {currentUser.balance || 0} Points
              </span>
            )}
          </div>
          {pointsPacksLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : pointsPacks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-900/40 border border-gray-800 rounded-2xl">
              <p>No points packs configured yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {pointsPacks.map((pack) => (
                <motion.div key={pack.id} whileHover={{ y: -3 }} className="bg-gray-900 border border-gray-800 hover:border-yellow-600/30 rounded-2xl p-5 flex flex-col justify-between transition duration-200">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{pack.name}</h3>
                    <div className="flex items-baseline gap-1.5 my-3">
                      <span className="text-3xl font-black text-yellow-400">{pack.points}</span>
                      <span className="text-xs text-gray-500 font-medium">Points</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button onClick={() => buyItem(pack, 'pointspack')} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-gray-950 font-extrabold text-sm shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all">
                      Buy for ₹{pack.price}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Pack Cards */}
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">📦 Question Bank Packs</h2>
            <p className="text-gray-400 text-sm">Buy a bundle of exams at once and unlock every exam inside the pack.</p>
          </div>
          {packsLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-900/50 border border-gray-800 rounded-2xl">
              <p>No pack offers available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {packs.map((pack, i) => (
                <motion.div key={pack.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{pack.name}</h3>
                      <p className="text-sm text-gray-400 mt-2">{pack.description || 'Bundle multiple exams into one unlock.'}</p>
                    </div>
                    {pack.purchased ? (
                      <span className="text-xs px-3 py-1.5 rounded-full bg-green-900/40 border border-green-700 text-green-400">Purchased</span>
                    ) : (
                      <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700 text-emerald-400">₹{pack.price || 0}</span>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-gray-400">Includes {(pack.exam_ids || []).length} exams</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 text-sm text-gray-200">
                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3">
                      <div className="text-[10px] text-gray-400">Students</div>
                      <div className="text-lg font-semibold mt-1">{maskMetric(pack.student_count, pack.purchased)}</div>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3">
                      <div className="text-[10px] text-gray-400">Questions</div>
                      <div className="text-lg font-semibold mt-1">{maskMetric(pack.question_count, pack.purchased)}</div>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-3">
                      <div className="text-[10px] text-gray-400">Sets</div>
                      <div className="text-lg font-semibold mt-1">{maskMetric(pack.set_count, pack.purchased)}</div>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    {pack.purchased ? (
                      <Link href={`/marketplace/packs/${pack.id}/analysis`} className="w-full">
                        <button className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm">
                          View Access & Marks Analysis
                        </button>
                      </Link>
                    ) : (
                      <button onClick={() => buyItem(pack, 'pack')} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm">
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
                <div className="animate-spin w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <FaBookOpen className="text-5xl mx-auto mb-4 opacity-30" />
                <p>No exams available yet. Coming soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exams.map((exam, i) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-indigo-700 transition group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold group-hover:text-indigo-300 transition">{exam.name}</h2>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><FaCalendar className="text-xs" /> {exam.date}</span>
                            <span>·</span>
                            <span>{exam.shifts || 1} Shifts</span>
                          </div>
                        </div>
                        {exam.purchased ? (
                          <span className="flex items-center gap-1 bg-green-900/40 border border-green-700/50 text-green-400 text-xs px-3 py-1.5 rounded-full shrink-0 font-medium">
                            <FaUnlock className="text-xs" /> Purchased
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-amber-900/30 border border-amber-700/40 text-amber-400 text-xs px-3 py-1.5 rounded-full shrink-0 font-semibold">
                            <FaCoins className="text-xs" /> {exam.price} pts
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { label: 'Questions', value: exam.total_questions || '—' },
                          { label: 'Subjects', value: exam.subjects?.length || '—' },
                          { label: 'Shifts', value: exam.shifts || 1 },
                        ].map(s => (
                          <div key={s.label} className="bg-gray-800/60 rounded-xl px-3 py-2 text-center">
                            <div className="text-lg font-bold text-white">{s.value}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {exam.subjects && exam.subjects.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {exam.subjects.slice(0, 4).map(s => (
                            <span key={s} className="text-xs bg-indigo-900/30 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-6 pb-5 flex gap-3">
                      <button
                        onClick={() => openExam(exam)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-700 hover:border-indigo-600 text-sm font-medium text-gray-300 hover:text-indigo-300 transition"
                      >
                        View Questions
                      </button>
                      {!exam.purchased ? (
                        <button
                          onClick={() => buyItem(exam, 'exam')}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                        >
                          <FaShoppingCart className="text-xs" /> Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => openExam(exam)}
                          className="flex-1 py-2.5 rounded-xl bg-green-800/40 border border-green-700 text-green-400 font-semibold text-sm flex items-center justify-center gap-2"
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
          <motion.div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <h3 className="text-xl font-bold mb-2">🛒 Confirm Purchase</h3>
              <p className="text-gray-400 text-sm mb-4">Unlock {buyModal.name} {buyModal.kind === 'pointspack' ? 'Points Bundle' : 'Question Bank'}.</p>
              <div className="bg-gray-800 rounded-xl p-4 mb-5 flex justify-between items-center">
                <span className="text-gray-300">Price</span>
                <span className="text-amber-400 font-bold text-lg flex items-center gap-1">
                  {buyModal.kind === 'pointspack' ? `₹${buyModal.price}` : <><FaCoins /> {buyModal.price} Points</>}
                </span>
              </div>
              {buyMsg && (
                <div className={`mb-4 text-sm px-4 py-3 rounded-xl ${buyMsg.startsWith('✅') ? 'bg-green-900/40 text-green-300 border border-green-700' : 'bg-red-900/40 text-red-300 border border-red-700'}`}>
                  {buyMsg}
                </div>
              )}
              {!buyMsg.startsWith('✅') && (
                <div className="flex gap-3">
                  <button onClick={() => setBuyModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:border-gray-600 text-sm">
                    Cancel
                  </button>
                  <button onClick={confirmBuy} disabled={buying}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
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
  const router = useRouter();
  const logout = () => {
    localStorage.removeItem('rv_token');
    localStorage.removeItem('rv_user');
    router.push('/');
  };
  return (
    <nav className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          RankVeda
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="text-sm text-indigo-400 font-medium">🏪 Marketplace</Link>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-amber-900/40 border border-amber-700/50 text-amber-400 px-3 py-1.5 rounded-full flex items-center gap-1">
                <FaCoins className="text-xs" /> {user.balance || 0}
              </span>
              <button onClick={logout} className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600">
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg font-medium transition">
              <FaUser className="text-xs" /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
