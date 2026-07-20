import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaUsers, FaRobot, FaChartLine, FaBookOpen,
  FaUser, FaChevronRight, FaTrophy, FaDownload, FaCheckCircle,
  FaCalendar, FaAward, FaClock, FaArrowRight, FaLock,
  FaShieldAlt, FaBolt, FaLink, FaLaptop, FaChevronDown,
  FaTelegram, FaYoutube, FaTwitter, FaInstagram, FaFileAlt
} from 'react-icons/fa';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

const SITE_URL = 'https://rankresult.in';

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RankResult — Government Exam Score Calculator',
  alternateName: 'RankResult Exam Marks Calculator',
  description: 'RankResult is India\'s free platform to check RRB NTPC, SSC, Bank exam answer keys, calculate marks with negative marking, predict rank and download professional score card.',
  url: SITE_URL,
  inLanguage: 'en-IN',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/result?url={search_term_string}&exam={exam_id}`,
    'query-input': 'required name=search_term_string',
    'exam-input': 'required name=exam_id',
  },
  publisher: {
    '@type': 'Organization',
    name: 'RankResult',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RankResult',
  url: SITE_URL,
  description: 'Free government exam answer key calculator and rank predictor for RRB NTPC, SSC, Bank PO and other competitive exams.',
  sameAs: [
    'https://twitter.com/RankResultIn',
    'https://linkedin.com/company/rankresult',
    'https://github.com/rankresult',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-XXXXXXXXXX',
    contactType: 'customer support',
    availableLanguage: ['English'],
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
  ],
};

export default function Home({ exams = [] }) {
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Government Exam Answer Key Calculators',
    description: 'List of all supported government exam answer key calculators on RankResult',
    itemListElement: exams.map((exam, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: `${exam.name} ${exam.year || '2025'} Answer Key Calculator`,
      url: `${SITE_URL}/exams/${exam.slug}`,
      description: `${exam.full_name} - ${exam.desc_card || exam.description}. Check answer key, calculate score with negative marking, predict rank and download score card.`,
    })),
  };

  const [liveCount, setLiveCount] = useState(0);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('rv_user');
      if (u) {
        try { setUser(JSON.parse(u)); } catch { }
      }
    }
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/live-stats?exam=1`);
        setLiveCount(res.data.totalViews || 0);
      } catch {
        setLiveCount(prev => prev || 24580);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  return (
    <>
      <Head>
        <title>RankResult — Government Exam Answer Key Calculator 2025 | RRB NTPC, SSC, Bank PO Score, Rank & Score Card</title>
        <meta name="description" content="RankResult — India's #1 free exam score calculator. Check RRB NTPC UG, SSC CGL, CHSL, Bank PO, RRB ALP answer keys 2025. Calculate exact marks with negative marking, predict live rank & percentile, download professional score card. No login required." />
        <meta name="keywords" content="RRB NTPC UG answer key 2025, SSC CGL answer key 2025, SSC CHSL answer key 2025, RRB ALP answer key 2025, Bank PO answer key 2025, exam score calculator, marks calculator with negative marking, rank predictor, government exam score card download, digialm answer key checker" />
        <link rel="canonical" href={SITE_URL} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="RankResult" />
        <meta name="language" content="en-IN" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta name="geo.region" content="IN" />
        <meta name="geo.country" content="India" />
        <meta name="geo.placename" content="India" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="RankResult — Government Exam Score Calculator 2025 | RRB NTPC, SSC, Bank" />
        <meta property="og:description" content="Free answer key calculator for RRB NTPC UG, SSC CGL, CHSL, Bank PO, RRB ALP. Calculate exact marks with negative marking, predict live rank & percentile, download score card." />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="RankResult" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="RankResult - Government Exam Answer Key Calculator" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RankResult — Government Exam Answer Key & Rank Calculator 2025" />
        <meta name="twitter:description" content="Check RRB NTPC UG, SSC, Bank answer keys. Instant score, rank & score card. Free!" />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
        <meta name="twitter:site" content="@RankResultIn" />
        <meta name="twitter:creator" content="@RankResultIn" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

        <link rel="sitemap" href={`${SITE_URL}/sitemap.xml`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://rrb.digialm.com" />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden font-sans">

        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <Navbar user={user} setUser={setUser} />

        {/* ── Hero Section ───────────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-b from-indigo-50/50 via-white to-slate-50/30 pt-16 pb-20 overflow-hidden">
          {/* Decorative ambient glowing circles */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-[300px] h-[300px] bg-sky-100/30 rounded-full blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative">

            {/* Left copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm">
                <span className="text-amber-500">★</span> India's #1 Free Exam Score Calculator
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-indigo-950 leading-[1.1] tracking-tight">
                Select Your Exam <br />
                Get Instant <span className="text-orange-500">Score</span> &amp; <span className="text-indigo-600">Rank</span>
              </h1>

              <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                RRB NTPC UG, SSC CGL, CHSL, Bank PO, RRB ALP — choose your exam from below and check the answer key. Free, fast with a professional score card.
              </p>

              {/* Stat elements */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center text-lg shrink-0">
                    <FaUsers />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-800" suppressHydrationWarning>{(liveCount || 24580).toLocaleString()}+</div>
                    <div className="text-[10px] font-semibold text-slate-400">Candidates Checked</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                    <FaShieldAlt />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-800">100% Free</div>
                    <div className="text-[10px] font-semibold text-slate-400">No Hidden Charges</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-slate-100 px-4 py-3 rounded-2xl shadow-sm w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-lg shrink-0">
                    <FaBolt />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-slate-800">Instant Result</div>
                    <div className="text-[10px] font-semibold text-slate-400">In Just Seconds</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - 3D CSS / SVG Mockup illustration */}
            <div className="lg:col-span-5 relative flex items-center justify-center pt-8 lg:pt-0">
              <div className="relative w-full max-w-[380px]">

                {/* Main Scorecard container */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/90 relative z-10 flex flex-col"
                >
                  <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                    YOUR SCORE CARD
                  </div>

                  {/* Conic-gradient Score Gauge */}
                  <div
                    className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center rounded-full shadow-md"
                    style={{ background: 'conic-gradient(#6366f1 0% 76%, #f1f5f9 76% 100%)' }}
                  >
                    <div className="w-[116px] h-[116px] rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                      <span className="text-3xl font-black text-slate-800">152</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">/ 200</span>
                    </div>
                  </div>

                  {/* Check list stats */}
                  <div className="space-y-2.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="text-emerald-500"><FaCheckCircle /></span> Correct Answers
                      </span>
                      <span className="font-extrabold text-slate-800">152</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="text-emerald-500"><FaCheckCircle /></span> Incorrect Answers
                      </span>
                      <span className="font-extrabold text-slate-800">28</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className="text-emerald-500"><FaCheckCircle /></span> Total Questions
                      </span>
                      <span className="font-extrabold text-slate-800">200</span>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Badge A: Rank Estimate */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="absolute -left-12 top-10 bg-indigo-600 text-white rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center border border-indigo-500 z-20 w-32"
                >
                  <span className="text-[9px] text-indigo-200 font-extrabold uppercase tracking-wide">Rank Estimate</span>
                  <span className="text-sm font-black mt-1">AIR ~ 4,385</span>
                  <span className="text-[8px] text-indigo-300 font-medium mt-0.5">(Expected)</span>
                </motion.div>

                {/* Floating Badge B: Percentile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute -left-6 bottom-6 bg-sky-500 text-white rounded-2xl p-4 shadow-xl flex flex-col items-center justify-center border border-sky-400 z-20 w-32"
                >
                  <span className="text-[9px] text-sky-100 font-extrabold uppercase tracking-wide">Percentile</span>
                  <span className="text-base font-black mt-0.5">98.76</span>
                  <span className="text-[8px] text-sky-100 font-medium mt-0.5">Percentile</span>
                </motion.div>

                {/* Trophy Graphic */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute -right-8 bottom-6 z-20 flex flex-col items-center"
                >
                  <svg className="w-24 h-24 filter drop-shadow-lg" viewBox="0 0 64 64" fill="none">
                    <path d="M16 12C16 28 48 28 48 12H16Z" fill="url(#goldGrad)" />
                    <ellipse cx="32" cy="12" rx="16" ry="3" fill="#FFE57F" />
                    <path d="M28 26V38H36V26H28Z" fill="url(#goldGrad)" />
                    <path d="M20 38H44V44H20V38Z" fill="#BCAAA4" />
                    <path d="M16 44H48V48H16V44Z" fill="#78909C" />
                    <path d="M16 16H10C8 16 8 22 10 22H16" stroke="#FFD54F" strokeWidth="3" strokeLinecap="round" />
                    <path d="M48 16H54C56 16 56 22 54 22H48" stroke="#FFD54F" strokeWidth="3" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="goldGrad" x1="16" y1="12" x2="48" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FFE082" />
                        <stop offset="50%" stopColor="#FFCA28" />
                        <stop offset="100%" stopColor="#FFB300" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Podium bottom shadow */}
                  <div className="w-16 h-3 bg-slate-900/10 rounded-full blur-[2px]" />
                </motion.div>

              </div>
            </div>

          </div>
        </section>

        {/* ── Choose Your Exam Section ───────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-16">

          {/* Section Header */}
          <div className="text-center mb-12 select-none">
            <div className="flex items-center justify-center gap-3 text-indigo-600 mb-2">
              <span className="h-[1px] w-6 border-t border-dashed border-indigo-400" />
              <span className="text-sm font-extrabold uppercase tracking-widest">Choose Your Exam</span>
              <span className="h-[1px] w-6 border-t border-dashed border-indigo-400" />
            </div>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
              Select your exam and get instant score, rank and detailed analysis
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {exams.map((exam, i) => {
              const isActive = exam.status === 'active';
              const Wrapper = isActive ? Link : 'div';
              const wrapperProps = isActive ? { href: `/exams/${exam.slug}` } : {};

              // Custom default fallbacks
              const badgeText = exam.badge || (isActive ? 'Active' : 'Coming Soon');
              const examIcon = exam.icon || '📋';
              const examYear = exam.year || '2025';
              const descText = exam.desc_card || exam.description || '';

              const totalQuestions = exam.total_questions || 100;
              const duration = exam.highlights?.find(h => h.label === 'Duration')?.value?.split(' ')[0] || '100';
              const marking = exam.highlights?.find(h => h.label === 'Negative Marking')?.value?.includes('1/3') ? '1/3 Negative' : '0.25 Negative';
              const topics = (exam.sections || []).map(s => s.name);

              // Status styles
              const badgeStyle = isActive
                ? 'bg-emerald-50 text-emerald-600 border-emerald-250'
                : 'bg-orange-50 text-orange-500 border-orange-250';

              const iconBg = isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-sky-50 text-sky-500';

              return (
                <motion.div
                  key={exam.slug || exam.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Wrapper {...wrapperProps} className="block group h-full">
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col h-full">

                      {/* Header: Icon + Title + Year */}
                      <div className="flex items-start gap-2.5 mb-3">
                        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center text-lg shrink-0`}>
                          {examIcon}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="font-extrabold text-indigo-950 text-xs group-hover:text-indigo-600 transition truncate">
                              {exam.name}
                            </h3>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border ${badgeStyle} shrink-0`}>
                              {badgeText}
                            </span>
                          </div>
                          <p className="text-[9px] font-semibold text-slate-400 truncate mt-0.5">{exam.full_name}</p>
                        </div>
                      </div>

                      {/* Description */}
                      {descText && (
                        <p className="text-[10px] text-slate-500 leading-relaxed mb-3 line-clamp-2 flex-grow">
                          {descText}
                        </p>
                      )}

                      {/* Pattern details */}
                      <div className="border-t border-slate-100 pt-3 mt-auto">
                        <div className="flex items-center justify-between text-slate-400 text-[9px] font-bold mb-3">
                          <span className="flex items-center gap-1">
                            <FaFileAlt className="text-[10px]" /> {totalQuestions} Qs
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FaClock className="text-[10px]" /> {duration} Min
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate max-w-[80px]" title={marking}>
                            <FaAward className="text-[10px]" /> {marking.replace(' Negative', '')}
                          </span>
                        </div>

                        {/* Topics */}
                        {topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {topics.slice(0, 3).map((t, ti) => (
                              <span key={ti} className="bg-slate-50 text-slate-500 rounded-md px-1.5 py-0.5 text-[9px] font-bold border border-slate-100 truncate max-w-[80px]">
                                {t}
                              </span>
                            ))}
                            {topics.length > 3 && (
                              <span className="text-slate-400 text-[9px] font-bold self-center">
                                +{topics.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        {isActive ? (
                          <div className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center gap-1 transition shadow-sm shadow-indigo-100 group-hover:bg-indigo-700">
                            Check Answer Key <FaArrowRight className="text-[9px] group-hover:translate-x-0.5 transition" />
                          </div>
                        ) : (
                          <div className="w-full py-2 rounded-xl border border-slate-200 text-slate-400 font-bold text-[10px] flex items-center justify-center gap-1 transition bg-slate-50">
                            Notify Me
                          </div>
                        )}
                      </div>

                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── How It Works Section ───────────────────────────────────────── */}
        <section className="bg-white border-y border-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-4">

            {/* Section Header */}
            <div className="text-center mb-12 select-none">
              <div className="flex items-center justify-center gap-3 text-indigo-600 mb-2">
                <span className="h-[1px] w-6 border-t border-dashed border-indigo-400" />
                <span className="text-sm font-extrabold uppercase tracking-widest">How It Works?</span>
                <span className="h-[1px] w-6 border-t border-dashed border-indigo-400" />
              </div>
              <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
                Select your exam and get instant score, rank and detailed analysis
              </p>
            </div>

            {/* Steps Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

              {/* Step 1 */}
              <div className="relative flex flex-col md:flex-row items-center gap-4 bg-slate-50 border border-slate-100/50 rounded-2xl p-5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                  01
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-extrabold text-slate-800 text-sm">Choose Exam</h3>
                  <p className="text-xs text-slate-500 mt-1">Select your exam from the list above.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative flex flex-col md:flex-row items-center gap-4 bg-slate-50 border border-slate-100/50 rounded-2xl p-5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                  02
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-extrabold text-slate-800 text-sm">Paste URL</h3>
                  <p className="text-xs text-slate-500 mt-1">Copy the response sheet URL from digialm.com and paste it.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex flex-col md:flex-row items-center gap-4 bg-slate-50 border border-slate-100/50 rounded-2xl p-5 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                  03
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-extrabold text-slate-800 text-sm">View Score</h3>
                  <p className="text-xs text-slate-500 mt-1">See section-wise score, rank, percentile and download score card.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Why RankResult Section ───────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-16">

          {/* Section Header */}
          <div className="text-center mb-12 select-none">
            <div className="flex items-center justify-center gap-3 text-indigo-600 mb-2">
              <span className="h-[1px] w-6 border-t border-dashed border-indigo-400" />
              <span className="text-sm font-extrabold uppercase tracking-widest">Why RankResult?</span>
              <span className="h-[1px] w-6 border-t border-dashed border-indigo-400" />
            </div>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
              Everything in one place — Free, Fast, Professional
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FaChartLine, title: 'Section-wise Analysis', desc: 'View Right, Wrong, NA and Marks for each section separately.', color: 'text-indigo-500', bg: 'bg-indigo-50/40 border-indigo-100/50' },
              { icon: FaTrophy, title: 'Live Rank & Percentile', desc: 'Real-time rank calculation. Know how many candidates you are ahead of.', color: 'text-amber-500', bg: 'bg-amber-50/40 border-amber-100/50' },
              { icon: FaDownload, title: 'Score Card Download', desc: 'Download official-style score card in PNG and PDF format.', color: 'text-emerald-500', bg: 'bg-emerald-50/40 border-emerald-100/50' },
              { icon: FaRobot, title: 'AI Solution Unlock', desc: 'Unlock detailed AI explanations for incorrect questions.', color: 'text-purple-500', bg: 'bg-purple-50/40 border-purple-100/50' },
              { icon: FaCheckCircle, title: 'Negative Marking', desc: 'Automatic -1/3, -0.5, -0.25 negative marking as per official pattern.', color: 'text-sky-500', bg: 'bg-sky-50/40 border-sky-100/50' },
              { icon: FaBookOpen, title: 'Question Bank', desc: 'All shifts questions in one place. Practice and revise.', color: 'text-orange-500', bg: 'bg-orange-50/40 border-orange-100/50' },
            ].map(({ icon: Icon, title, desc, color, bg }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                className={`${bg} border rounded-2xl p-6 shadow-sm`}
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                  <Icon className={`${color} text-lg`} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Double Card Promo Section ──────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Promo Card 1 */}
            <div className="bg-indigo-950 text-white rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  <FaFileAlt className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight mb-2">RRB NTPC UG Answer Key 2025</h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed max-w-sm">
                    Check the RRB NTPC Under Graduate (UG) answer key instantly on RankResult. Get your exact marks (with negative marking), section-wise score (Mathematics 30, General Awareness 40, Reasoning 30), and live rank from your digialm.com response sheet URL.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-start">
                <Link href="/exams/rrb-ntpc-ug" className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition flex items-center gap-1.5">
                  Check Answer Key <FaArrowRight className="text-[10px]" />
                </Link>
              </div>
            </div>

            {/* Promo Card 2 */}
            <div className="bg-indigo-950 text-white rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[220px]">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                  <FaDownload className="text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight mb-2">Score Card Download Kyun?</h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed max-w-sm">
                    The professional score card from RankResult includes your photo, registration number, roll number, section-wise breakdown, rank and percentile. You can download it as PNG or PDF and share it.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-start">
                <button
                  type="button"
                  onClick={() => alert("Check score card inside your exam prediction results page!")}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 font-bold text-xs text-slate-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  Download Now <FaArrowRight className="text-[10px]" />
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="bg-[#0f172a] text-slate-400 pt-16 pb-8 px-4 mt-16 border-t border-slate-900">
          <div className="max-w-7xl mx-auto">

            {/* Top row: Newsletter + branding */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 border-b border-slate-800 items-center">
              <div className="lg:col-span-5 text-center lg:text-left space-y-2">
                <div className="text-lg font-black text-white flex items-center gap-2 justify-center lg:justify-start">
                  <span>⚡</span> Stay Updated
                </div>
                <p className="text-xs text-slate-500">Get exam updates, tips and free mocks directly in your inbox.</p>
              </div>
              <div className="lg:col-span-7">
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto lg:mr-0">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-grow bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shrink-0 shadow-sm">
                    {subscribed ? 'Subscribed!' : 'Subscribe'}
                  </button>
                </form>
              </div>
            </div>

            {/* Middle row: Columns links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 py-12">
              <div>
                <div className="mb-3.5"><Logo size="sm" /></div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  India's free platform for government exam answer key calculation, rank prediction and question bank.
                </p>

                {/* Social icons */}
                <div className="flex items-center gap-3 mt-4">
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm hover:bg-indigo-600 transition"><FaTelegram /></a>
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm hover:bg-indigo-600 transition"><FaYoutube /></a>
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm hover:bg-indigo-600 transition"><FaTwitter /></a>
                  <a href="#" className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm hover:bg-indigo-600 transition"><FaInstagram /></a>
                </div>
              </div>

              <div>
                <div className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">Exams</div>
                <ul className="space-y-2.5 text-xs">
                  <li><Link href="/exams/rrb-ntpc-ug" className="hover:text-white transition">RRB NTPC UG 2025</Link></li>
                  <li className="text-slate-600">SSC CGL 2025 (Coming Soon)</li>
                  <li className="text-slate-600">SSC CHSL 2025 (Coming Soon)</li>
                  <li className="text-slate-600">RRB ALP 2025 (Coming Soon)</li>
                  <li className="text-slate-600">Bank PO 2025 (Coming Soon)</li>
                  <li className="text-slate-600">SSC MTS 2025 (Coming Soon)</li>
                </ul>
              </div>

              <div>
                <div className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">Links</div>
                <ul className="space-y-2.5 text-xs">
                  <li><Link href="/exams" className="hover:text-white transition">All Exams</Link></li>
                  <li><Link href="/marketplace" className="hover:text-white transition">Question Bank</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                  <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                  <li><Link href="/login" className="hover:text-white transition">Login</Link></li>
                </ul>
              </div>

              <div>
                <div className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">Legal</div>
                <ul className="space-y-2.5 text-xs">
                  <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                  <li><Link href="/disclaimer" className="hover:text-white transition">Disclaimer</Link></li>
                  <li><Link href="/cookie-policy" className="hover:text-white transition">Cookie Policy</Link></li>
                  <li><Link href="/refund-policy" className="hover:text-white transition">Refund Policy</Link></li>
                  <li><Link href="/dmca" className="hover:text-white transition">DMCA / Copyright</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div>© 2025 RankResult — All Rights Reserved</div>
              <div className="text-center md:text-right normal-case tracking-normal">
                Disclaimer: Scores are unofficial. Final result by respective recruitment boards only.
              </div>
            </div>

          </div>
        </footer>

      </div>
    </>
  );
}

export async function getServerSideProps() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/exams`);
    const data = await res.json();
    return {
      props: {
        exams: data.exams || [],
      },
    };
  } catch (e) {
    console.error("Error fetching exams:", e);
    return {
      props: {
        exams: [],
      },
    };
  }
}