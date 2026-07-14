import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import MarksheetCard from '../components/MarksheetCard';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShareAlt, FaMoon, FaSun, FaCoins, FaChevronDown, FaChevronUp, FaDownload, FaShoppingBag, FaUser } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Stat Card Component
const StatCard = ({ label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl p-4 text-center"
  >
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
  </motion.div>
);

// Question Item Component
const QuestionItem = ({ q, resultId, onUnlock }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solution, setSolution] = useState(q.solution || null);

  const status = q.student_answer === q.correct_answer ? 'correct' : q.student_answer ? 'wrong' : 'unattempted';
  const statusIcon = status === 'correct' ? '✅' : status === 'wrong' ? '❌' : '⏳';
  const statusColor = status === 'correct' ? 'bg-green-500' : status === 'wrong' ? 'bg-red-500' : 'bg-gray-500';

  const handleUnlock = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/questions/${resultId}/questions/${q.id}/unlock`, {
        user_id: 1,
      });
      setSolution(res.data.solution);
      if (onUnlock) onUnlock(res.data.newBalance);
      toast.success('सॉल्यूशन अनलॉक हो गया!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'कुछ गड़बड़ हो गई');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-xl rounded-xl p-4">
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-bold text-sm w-12">Q{q.question_no}</span>
          <span className="text-sm line-clamp-1">{q.question_text || `प्रश्न ${q.question_no}`}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${statusColor}`}>
            {statusIcon}
          </span>
          {expanded ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3 text-sm space-y-2 overflow-hidden"
          >
            <p><span className="font-medium">आपका उत्तर:</span> {q.student_answer || '—'}</p>
            <p><span className="font-medium">सही उत्तर:</span> {q.correct_answer}</p>
            <p><span className="font-medium">मार्क्स:</span> {q.marks_awarded}</p>

            {status === 'wrong' && (
              <div className="mt-2">
                {solution ? (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <p className="font-medium text-indigo-600 dark:text-indigo-400">🤖 AI सॉल्यूशन</p>
                    <p className="mt-1">{solution.explanation}</p>
                    <p className="mt-1"><span className="font-medium">गलती क्यों:</span> {solution.why_wrong}</p>
                    <ul className="list-disc list-inside text-xs mt-1">
                      {solution.key_takeaways?.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                  </div>
                ) : (
                  <button
                    onClick={handleUnlock}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaCoins /> {loading ? 'Loading...' : 'अनलॉक करें (5 पॉइंट्स)'}
                  </button>
                )}
              </div>
            )}
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

  // Load auth user from localStorage
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
        // Fetch live rank
        try {
          const score = res.data?.result?.score;
          if (score !== undefined && score !== null) {
            const rankRes = await axios.get(`http://localhost:5000/api/results/rank?exam_id=${exam || 1}&score=${score}`);
            setRank(rankRes.data);
          }
        } catch {}
        // Fetch points (auth user or fallback)
        try {
          const uid = authUser?.id || 1;
          const pointsRes = await axios.get(`http://localhost:5000/api/user/${uid}/points`);
          setBalance(pointsRes.data.balance);
        } catch (e) {
          console.error('Points fetch failed:', e);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'रिजल्ट नहीं मिला');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [url, exam, authUser]);

  const handleDownload = async (format = 'image') => {
    if (!marksheetRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(marksheetRef.current, {
        backgroundColor: null, scale: 2, useCORS: true,
      });
      if (format === 'image') {
        const link = document.createElement('a');
        link.download = `RankVeda_Marksheet_${data?.result?.roll_number || 'result'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('✅ Marksheet download हो गया!');
      } else {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`RankVeda_Marksheet_${data?.result?.roll_number || 'result'}.pdf`);
        toast.success('✅ PDF download हो गया!');
      }
    } catch (e) {
      toast.error('Download failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer w-16 h-16 rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl">रिजल्ट नहीं मिला</p>
          <button onClick={() => router.push('/')} className="mt-4 text-indigo-500 underline">वापस जाएँ</button>
        </div>
      </div>
    );
  }

  const { result, questions } = data;
  const filteredQuestions = questions.filter(q => {
    if (filter === 'correct') return q.student_answer === q.correct_answer;
    if (filter === 'wrong') return q.student_answer && q.student_answer !== q.correct_answer;
    if (filter === 'unattempted') return !q.student_answer;
    return true;
  });

  // Chart Data
  const chartData = {
    labels: ['English', 'Maths', 'Reasoning', 'GK'],
    datasets: [{
      label: 'अंक',
      data: [
        result.section_wise?.english || 0,
        result.section_wise?.maths || 0,
        result.section_wise?.reasoning || 0,
        result.section_wise?.gk || 0
      ],
      backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
      borderRadius: 8,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'मेरा ResultVeda रैंक',
        text: `मैंने #${result.rank} रैंक प्राप्त किया!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('लिंक कॉपी हो गया');
    }
  };

  const handleRecharge = async (plan) => {
    try {
      const res = await axios.post('http://localhost:5000/api/user/points/recharge', {
        user_id: 1,
        plan
      });
      if (res.data.url) window.location.href = res.data.url;
    } catch {
      toast.error('Recharge failed');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative bg-gray-50 dark:bg-gray-900">
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-xl hover:scale-110 transition"
      >
        {theme === 'dark' ? <FaSun className="text-yellow-400 text-xl" /> : <FaMoon className="text-indigo-600 text-xl" />}
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              आपका रिजल्ट
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
              URL: {decodeURIComponent(url).slice(0, 60)}...
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {authUser ? (
              <span className="text-xs bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 px-3 py-1.5 rounded-full">
                👤 {authUser.name}
              </span>
            ) : (
              <Link href={`/login?redirect=${encodeURIComponent(router.asPath)}`}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                <FaUser /> Login
              </Link>
            )}
            <Link href="/marketplace"
              className="bg-purple-700 hover:bg-purple-600 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-sm transition">
              <FaShoppingBag /> Question Bank
            </Link>
            <div className="flex gap-1">
              <button onClick={() => handleDownload('image')} disabled={downloading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm transition disabled:opacity-50">
                <FaDownload /> {downloading ? '...' : 'PNG'}
              </button>
              <button onClick={() => handleDownload('pdf')} disabled={downloading}
                className="bg-indigo-800 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm transition disabled:opacity-50">
                <FaDownload /> PDF
              </button>
            </div>
            <button
              onClick={handleShare}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
            >
              <FaShareAlt /> शेयर करें
            </button>
          </div>
        </div>

        {/* Hidden Marksheet (for capture) */}
        <div style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
          <MarksheetCard
            ref={marksheetRef}
            candidate={{
              name: data?.result?.candidate_name,
              roll_number: data?.result?.roll_number,
              registration_no: data?.result?.registration_number,
              exam_name: data?.result?.exam_name || 'Competitive Exam',
              test_date: data?.result?.test_date,
              test_time: data?.result?.test_time,
              subject: data?.result?.subject,
            }}
            score={{
              total_marks: data?.result?.score,
              correct: data?.result?.total_correct,
              wrong: data?.result?.total_wrong,
              unattempted: data?.result?.total_unattempted,
              max_marks: data?.questions?.length || 100,
            }}
            rank={{
              rank: rank?.rank || data?.result?.rank,
              total_appeared: rank?.total_appeared,
              percentile: data?.result?.percentile,
            }}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Score" value={result.score} color="text-indigo-400" delay={0.1} />
          <StatCard label="Rank" value={`#${result.rank}`} color="text-purple-400" delay={0.2} />
          <StatCard label="Percentile" value={`${result.percentile}%`} color="text-pink-400" delay={0.3} />
          <StatCard label="Category Rank" value={result.category_rank} color="text-amber-400" delay={0.4} />
        </div>

        {/* Chart + Points */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3">सेक्शन-वाइज अंक</h3>
            <Bar data={chartData} options={chartOptions} height={150} />
          </div>
          <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <FaCoins className="text-yellow-400" /> आपके पॉइंट्स
              </h3>
              <p className="text-3xl font-bold text-yellow-400">{balance}</p>
            </div>
            <div className="mt-4 space-y-2">
              <button onClick={() => handleRecharge('50pts')} className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition">₹99 – 50 पॉइंट्स</button>
              <button onClick={() => handleRecharge('120pts')} className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition">₹199 – 120 पॉइंट्स</button>
              <button onClick={() => handleRecharge('unlimited')} className="w-full py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white transition">₹999 – 30 दिन अनलिमिटेड</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">हर AI सॉल्यूशन पर 5 पॉइंट्स खर्च</p>
          </div>
        </div>

        {/* Question Analysis */}
        <div className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-xl font-bold">📝 प्रश्न विश्लेषण</h3>
            <div className="flex gap-2 flex-wrap">
              {['all', 'wrong', 'correct', 'unattempted'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1 rounded-full text-sm transition capitalize ${filter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                  {f === 'all' ? 'सभी' : f === 'wrong' ? '❌ गलत' : f === 'correct' ? '✅ सही' : '⏳ नहीं किया'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredQuestions.map((q, idx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <QuestionItem q={q} resultId={result.id} onUnlock={(newBalance) => setBalance(newBalance)} />
              </motion.div>
            ))}
            {filteredQuestions.length === 0 && (
              <p className="text-center text-gray-500 py-8">कोई प्रश्न नहीं मिला</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}