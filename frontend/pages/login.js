import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaRocket } from 'react-icons/fa';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../utils/firebase';

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // (Backend sync will handle user registration and points)

      const idToken = await user.getIdToken();

      // Sync user with backend and get standard JWT & integer ID
      const syncRes = await fetch(`${API}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name: user.displayName })
      });
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(syncData.error || 'Failed to sync with backend server');
      }
      
      localStorage.setItem('rv_token', syncData.token);
      localStorage.setItem('rv_user', JSON.stringify(syncData.user));
      setSuccess('Logged in with Google successfully! Redirecting...');
      setTimeout(() => {
        const redirect = router.query.redirect || '/';
        router.push(redirect);
      }, 1000);
    } catch (err) {
      if (err.code === 'auth/configuration-not-found' || (err.message && err.message.includes('configuration-not-found'))) {
        setError("Google Provider is disabled. Please enable 'Google' under Firebase Console -> Build -> Authentication -> Sign-in method.");
      } else {
        setError(err.message || 'Google login failed');
      }
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let user;
      let token;
      
      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        user = userCredential.user;
        token = await user.getIdToken();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        user = userCredential.user;
        token = await user.getIdToken();
        
        // Backend sync handles DB record creation.
      }

      // Sync user with backend and get standard JWT & integer ID
      const syncRes = await fetch(`${API}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token, name: form.name })
      });
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(syncData.error || 'Failed to sync with backend server');
      }

      // Save standard backend token and user info
      localStorage.setItem('rv_token', syncData.token);
      localStorage.setItem('rv_user', JSON.stringify(syncData.user));
      
      setSuccess(mode === 'login' ? 'Login successful! Redirecting...' : 'Account created! Welcome 🎉');
      setTimeout(() => {
        const redirect = router.query.redirect || '/';
        router.push(redirect);
      }, 1000);
    } catch (err) {
      if (err.code === 'auth/configuration-not-found' || (err.message && err.message.includes('configuration-not-found'))) {
        setError("Email/Password provider is disabled. Please enable 'Email/Password' in your Firebase Console under Build -> Authentication -> Sign-in method.");
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`${mode === 'login' ? 'Login' : 'Register'} — RankVeda`}</title>
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
          <div className="bg-gray-900/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
            {/* Tab switcher */}
            <div className="flex border-b border-gray-800/80">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-4 text-sm font-semibold transition-all duration-300 ${
                    mode === m
                      ? 'text-indigo-400 border-b-2 border-indigo-500 bg-white/[0.02]'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.01]'
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
                        className="w-full pl-9 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-250"
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
                    className="w-full pl-9 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-250"
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
                    className="w-full pl-9 pr-10 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-250"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Error / Success */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-red-950/50 border border-red-800 text-red-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                    <span>❌</span> {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
                    <span>✅</span> {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.99] duration-150"
              >
                {loading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <><FaRocket /> {mode === 'login' ? 'Login' : 'Create Account'}</>
                )}
              </button>
            </form>

            <div className="px-6 pb-6 space-y-4">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-800/80"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-[10px] tracking-wider uppercase font-semibold">Or continue with</span>
                <div className="flex-grow border-t border-gray-800/80"></div>
              </div>

              <div className="w-full flex justify-center pb-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl border border-gray-800 hover:border-gray-700 bg-gray-950/40 text-gray-200 hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition active:scale-[0.99] duration-150"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-gray-600 text-xs mt-6">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300">← Back to Home</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}
