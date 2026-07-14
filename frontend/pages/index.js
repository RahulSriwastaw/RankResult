import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FaSearch, FaMoon, FaSun, FaUsers, FaRobot, FaChartLine, FaCoins } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import axios from 'axios';

export default function Home() {
  const [url, setUrl] = useState('');
  const [examId, setExamId] = useState('1');
  const [liveCount, setLiveCount] = useState(245000);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/live-stats?exam=1');
        setLiveCount(res.data.totalViews);
      } catch {
        setLiveCount(prev => prev + Math.floor(Math.random() * 5));
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Encode URL and navigate to result page with query param
    router.push(`/result?url=${encodeURIComponent(url)}&exam=${examId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* ... Background blobs, Dark mode toggle (same as before) ... */}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center z-10"
      >
        <h1 className="text-6xl md:text-7xl font-extrabold gradient-text">ResultVeda</h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mt-2">
          अपनी Answer Key URL डालें, मार्क्स और रैंक जानें
        </p>

        {/* Live Counter */}
        <div className="mt-4 inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-5 py-2 rounded-full text-sm font-medium">
          <FaUsers className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold">{liveCount.toLocaleString()}</span>
          <span className="text-gray-600 dark:text-gray-400">छात्र चेक कर चुके हैं</span>
        </div>

        {/* Search Form - now with URL input */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 md:p-8 mt-8 text-left"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Answer Key URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://rrb.digialm.com/.../assessment.html"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">परीक्षा</label>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1">RRB NTPC 2025</option>
                <option value="2">SSC CGL 2025</option>
                <option value="3">Bank PO 2025</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <FaSearch /> रिजल्ट देखें
            </button>
          </form>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            <span className="text-green-500">●</span> आपका डेटा सुरक्षित है
          </p>
        </motion.div>

        {/* Features - same as before */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            { icon: FaRobot, title: 'AI सॉल्यूशन', desc: 'Claude से हर गलती का समाधान' },
            { icon: FaChartLine, title: 'लाइव रैंक', desc: 'तुरंत रैंक और परसेंटाइल' },
            { icon: FaCoins, title: 'पॉइंट्स सिस्टम', desc: 'फ्री पॉइंट्स कमाएँ और सॉल्यूशन खोलें' },
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass rounded-xl p-4 text-center backdrop-blur-sm"
            >
              <feat.icon className="text-3xl text-indigo-500 mx-auto mb-2" />
              <h3 className="font-bold">{feat.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}