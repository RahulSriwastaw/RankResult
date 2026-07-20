import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaRocket } from 'react-icons/fa';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../utils/firebase';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
        <title>{`${mode === 'login' ? 'Login' : 'Register'} — RankResult`}</title>
        <meta name="description" content="Login to RankResult to view your exam result, rank and AI solution." />
      </Head>

      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-800">
        {/* Animated Background Elements */}
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 150, repeat: Infinity, ease: "linear" }} className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-[100px]" />
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 120, repeat: Infinity, ease: "linear" }} className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-400/20 rounded-full blur-[100px]" />
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-400/10 rounded-full blur-[80px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-4xl z-10 flex flex-col md:flex-row bg-white/70 backdrop-blur-xl border border-white rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-slate-200/50"
        >
          {/* Left Side (Marketing/Copy) */}
          <div className="hidden md:flex flex-col justify-between w-1/2 p-10 bg-gradient-to-br from-indigo-50 to-white border-r border-slate-100">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 mb-10">
                <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  RankResult
                </span>
              </Link>
              <h2 className="text-3xl font-black text-indigo-950 leading-tight mb-4 tracking-tight">
                Accelerate your <br/><span className="text-indigo-600">exam success.</span>
              </h2>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                Join thousands of aspirants analyzing their performance, predicting ranks, and identifying weaknesses with our advanced AI-driven exam intelligence platform.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs shadow-inner">🎯</div>
                  <span className="text-sm font-bold text-slate-700">Real-time Rank Prediction</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs shadow-inner">🧠</div>
                  <span className="text-sm font-bold text-slate-700">AI-Powered Solutions</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs shadow-inner">📊</div>
                  <span className="text-sm font-bold text-slate-700">Detailed Analytics</span>
                </div>
              </div>
            </div>
            
            <div className="mt-12 pt-6 border-t border-indigo-100/50">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-purple-200 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-pink-200 border-2 border-white"></div>
                </div>
                <span className="text-xs font-bold text-slate-500">Trusted by 10,000+ students</span>
              </div>
            </div>
          </div>

          {/* Right Side (Form) */}
          <div className="w-full md:w-1/2 p-8 md:p-10 bg-white">
            <div className="md:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  RankResult
                </span>
              </Link>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Exam Intelligence</p>
            </div>

            <div className="flex mb-8 bg-slate-100 p-1 rounded-xl">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2 text-sm font-extrabold transition-all duration-300 rounded-lg ${
                    mode === m
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {m === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div key="name"
                    initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                    <label className="text-xs font-extrabold text-slate-500 mb-1.5 block uppercase tracking-wider">Your Name</label>
                    <div className="relative">
                      <FaUser className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Full Name"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="text-xs font-extrabold text-slate-500 mb-1.5 block uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-500 mb-1.5 block uppercase tracking-wider">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-3.5 text-slate-400 text-sm" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all duration-200"
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors">
                    {showPass ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
                    <span>❌</span> {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm">
                    <span>✅</span> {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>{mode === 'login' ? 'Sign In Securely' : 'Create Account'} <FaRocket className="ml-1" /></>
                )}
              </button>
            </form>

            <div className="mt-8 space-y-4">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] tracking-widest uppercase font-extrabold">Or continue with</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Sign in with Google
              </button>
            </div>
            
            <p className="text-center text-slate-500 font-semibold text-xs mt-8">
              <Link href="/" className="hover:text-indigo-600 transition flex items-center justify-center gap-1">← Back to Home</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
