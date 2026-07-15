import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaRocket } from 'react-icons/fa';

const API = 'http://localhost:5000';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('rv_token')) {
      router.replace('/');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };

    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      // Save token and user
      localStorage.setItem('rv_token', data.token);
      localStorage.setItem('rv_user', JSON.stringify(data.user));
      setSuccess(mode === 'login' ? 'Login successful! Redirecting...' : 'Account created! Welcome 🎉');
      setTimeout(() => {
        const redirect = router.query.redirect || '/';
        router.push(redirect);
      }, 1000);
    } catch (err) {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{mode === 'login' ? 'Login' : 'Register'} — RankVeda</title>
        <meta name="description" content="Login to RankVeda to view your exam result, rank and AI solution." />
      </Head>

      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                RankVeda
              </span>
            </Link>
            <p className="text-gray-400 text-sm mt-1">Exam Intelligence Platform</p>
          </div>

          {/* Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-gray-800">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-4 text-sm font-semibold transition ${
                    mode === m
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-gray-900'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {m === 'login' ? '🔑 Login' : '✨ Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div key="name"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                    <label className="text-xs text-gray-400 mb-1 block">Your Name</label>
                    <div className="relative">
                      <FaUser className="absolute left-3 top-3.5 text-gray-500 text-sm" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Full Name"
                        className="w-full pl-9 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3.5 text-gray-500 text-sm" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3.5 text-gray-500 text-sm" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300">
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-xl">
                    ❌ {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-green-900/40 border border-green-700 text-green-300 text-sm px-4 py-3 rounded-xl">
                    ✅ {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <><FaRocket /> {mode === 'login' ? 'Login' : 'Create Account'}</>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300">← Back to Home</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
