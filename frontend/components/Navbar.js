import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaBookOpen, FaUserCircle, FaCoins, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';
import Logo from './Logo';

export default function Navbar({ user: propUser, setUser: propSetUser }) {
  const router = useRouter();
  const [internalUser, setInternalUser] = useState(null);

  const activeUser = propUser !== undefined ? propUser : internalUser;

  useEffect(() => {
    if (propUser === undefined) {
      try {
        const stored = localStorage.getItem('rv_user');
        if (stored) {
          setInternalUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [propUser]);

  const handleLogout = () => {
    localStorage.removeItem('rv_token');
    localStorage.removeItem('rv_user');
    if (propSetUser) {
      propSetUser(null);
    }
    setInternalUser(null);
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#080b24]/95 backdrop-blur-md border-b border-indigo-900/40 px-4 py-3 sm:py-3.5 shadow-xl shadow-black/40 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Logo size="md" />

        {/* Middle navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <Link href="/exams" className="hover:text-white transition-colors">Exams</Link>
          <Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/#blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/marketplace" className="hover:text-amber-400 transition-colors">Question Bank</Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/marketplace"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900 text-amber-400 border border-indigo-800/80 px-3.5 py-2 rounded-xl shadow-sm transition"
          >
            <FaBookOpen className="text-xs text-amber-400" /> Question Bank
          </Link>
          
          {activeUser ? (
            <div className="flex items-center gap-2.5 sm:gap-3 text-sm">
              {activeUser.balance !== undefined && (
                <span className="hidden xs:flex text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl font-black items-center gap-1.5 select-none shadow-sm">
                  <FaCoins className="text-amber-400" /> {activeUser.balance}
                </span>
              )}
              <div className="flex items-center gap-2 cursor-pointer bg-indigo-950/60 border border-indigo-800/60 pl-3 pr-2 py-1.5 rounded-xl hover:bg-indigo-900/60 transition text-white">
                <span className="text-slate-200 font-bold text-xs hidden sm:inline">Hello, {activeUser.name ? activeUser.name.split(' ')[0] : 'User'}</span>
                <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center text-[10px] font-black uppercase shadow-inner">
                  {activeUser.name ? activeUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-xs font-bold text-red-400 hover:text-red-300 transition bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1"
              >
                <FaSignOutAlt className="text-xs" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 transition flex items-center gap-1.5"
            >
              <FaUserCircle className="text-sm" /> Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
