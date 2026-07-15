import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaUsers, FaRobot, FaChartLine, FaBookOpen,
  FaUser, FaChevronRight, FaTrophy, FaDownload, FaCheckCircle,
  FaCalendarAlt, FaAward, FaClock, FaArrowRight
} from 'react-icons/fa';
import axios from 'axios';

const SITE_URL = 'https://rankveda.in';

const EXAMS = [
  {
    slug: 'rrb-ntpc-ug',
    name: 'RRB NTPC UG',
    year: '2025',
    fullName: 'Railway NTPC Under Graduate Level CBT-I',
    desc: '100 questions | 90 min | Math, GK, Reasoning',
    badge: 'Active',
    badgeColor: 'bg-green-900/60 text-green-400 border-green-700/50',
    icon: '🚂',
    color: 'from-red-600/20 to-orange-600/20',
    border: 'border-red-700/30',
    href: '/exams/rrb-ntpc-ug',
    examId: 1,
    pattern: { sections: 3, questions: 100, duration: 90, marking: '+1 / -⅓' },
    topics: ['Mathematics (30)', 'General Awareness (40)', 'Reasoning (30)'],
  },
  {
    slug: 'ntpc-cbt2',
    name: 'NTPC CBT-II',
    year: '2025',
    fullName: 'Railway NTPC Computer Based Test-II',
    desc: '100 questions | 90 min | GA, Math, Reasoning',
    badge: 'Active',
    badgeColor: 'bg-indigo-900/60 text-indigo-400 border-indigo-700/50',
    icon: '🚉',
    color: 'from-indigo-600/20 to-purple-600/20',
    border: 'border-indigo-700/30',
    href: '/exams/ntpc-cbt2',
    examId: 7,
    pattern: { sections: 3, questions: 100, duration: 90, marking: '+1 / -⅓' },
    topics: ['General Awareness (40)', 'Mathematics (30)', 'Reasoning (30)'],
  },
  {
    slug: 'ssc-cgl',
    name: 'SSC CGL',
    year: '2025',
    fullName: 'Staff Selection Commission CGL Tier-I',
    desc: '100 questions | 60 min | GK, English, Math, Reasoning',
    badge: 'Coming Soon',
    badgeColor: 'bg-blue-900/60 text-blue-400 border-blue-700/50',
    icon: '📋',
    color: 'from-blue-600/10 to-indigo-600/10',
    border: 'border-blue-700/30',
    href: null,
    examId: 2,
    pattern: { sections: 4, questions: 100, duration: 60, marking: '+2 / -0.5' },
    topics: ['GK (25)', 'English (25)', 'Quant (25)', 'Reasoning (25)'],
  },
  {
    slug: 'ssc-chsl',
    name: 'SSC CHSL',
    year: '2025',
    fullName: 'Staff Selection Commission CHSL Tier-I',
    desc: '100 questions | 60 min | 4 sections',
    badge: 'Coming Soon',
    badgeColor: 'bg-purple-900/60 text-purple-400 border-purple-700/50',
    icon: '📋',
    color: 'from-purple-600/10 to-pink-600/10',
    border: 'border-purple-700/30',
    href: null,
    examId: 3,
    pattern: { sections: 4, questions: 100, duration: 60, marking: '+2 / -0.5' },
    topics: ['GK (25)', 'English (25)', 'Quant (25)', 'Reasoning (25)'],
  },
  {
    slug: 'rrb-alp',
    name: 'RRB ALP',
    year: '2025',
    fullName: 'Railway Recruitment Board ALP CBT-I',
    desc: '75 questions | 60 min | Math, Science, GK',
    badge: 'Coming Soon',
    badgeColor: 'bg-teal-900/60 text-teal-400 border-teal-700/50',
    icon: '🚆',
    color: 'from-teal-600/10 to-cyan-600/10',
    border: 'border-teal-700/30',
    href: null,
    examId: 4,
    pattern: { sections: 3, questions: 75, duration: 60, marking: '+1 / -⅓' },
    topics: ['Mathematics (20)', 'Science (20)', 'GK (20)', 'Reasoning (15)'],
  },
  {
    slug: 'bank-po',
    name: 'Bank PO',
    year: '2025',
    fullName: 'IBPS / SBI PO Preliminary Exam',
    desc: '100 questions | 60 min | Quant, Reasoning, English',
    badge: 'Coming Soon',
    badgeColor: 'bg-amber-900/60 text-amber-400 border-amber-700/50',
    icon: '🏦',
    color: 'from-amber-600/10 to-orange-600/10',
    border: 'border-amber-700/30',
    href: null,
    examId: 5,
    pattern: { sections: 3, questions: 100, duration: 60, marking: '+1 / -0.25' },
    topics: ['Quant (35)', 'Reasoning (35)', 'English (30)'],
  },
  {
    slug: 'ssc-mts',
    name: 'SSC MTS',
    year: '2025',
    fullName: 'Staff Selection Commission MTS Tier-I',
    desc: '90 questions | 90 min | 4 sections',
    badge: 'Coming Soon',
    badgeColor: 'bg-pink-900/60 text-pink-400 border-pink-700/50',
    icon: '📋',
    color: 'from-pink-600/10 to-rose-600/10',
    border: 'border-pink-700/30',
    href: null,
    examId: 6,
    pattern: { sections: 4, questions: 90, duration: 90, marking: '+1 / -0.25' },
    topics: ['Reasoning (25)', 'Numerical (25)', 'English (25)', 'GK (15)'],
  },
];

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RankVeda — Government Exam Score Calculator',
  alternateName: 'RankVeda Exam Marks Calculator',
  description: 'RankVeda is India\'s free platform to check RRB NTPC, SSC, Bank exam answer keys, calculate marks with negative marking, predict rank and download professional score card.',
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
    name: 'RankVeda',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  },
};

const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'RankVeda',
  url: SITE_URL,
  description: 'Free government exam answer key calculator and rank predictor for RRB NTPC, SSC, Bank PO and other competitive exams.',
  sameAs: [
    'https://twitter.com/RankVedaIn',
    'https://linkedin.com/company/rankveda',
    'https://github.com/rankveda',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-XXXXXXXXXX',
    contactType: 'customer support',
    availableLanguage: ['English'],
  },
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Government Exam Answer Key Calculators',
  description: 'List of all supported government exam answer key calculators on RankVeda',
  itemListElement: EXAMS.map((exam, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: `${exam.name} ${exam.year} Answer Key Calculator`,
    url: `${SITE_URL}${exam.href}`,
    description: `${exam.fullName} - ${exam.desc}. Check answer key, calculate score with negative marking, predict rank and download score card.`,
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
  ],
};

export default function Home() {
  const [liveCount, setLiveCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/live-stats?exam=1');
        setLiveCount(res.data.totalViews || 0);
      } catch {
        setLiveCount(prev => prev || 24580);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Head>
        {/* Core Meta Tags */}
        <title>RankVeda — Government Exam Answer Key Calculator 2025 | RRB NTPC, SSC, Bank PO Score, Rank & Score Card</title>
        <meta name="description" content="RankVeda — India's #1 free exam score calculator. Check RRB NTPC UG, SSC CGL, CHSL, Bank PO, RRB ALP answer keys 2025. Calculate exact marks with negative marking, predict live rank & percentile, download professional score card. No login required." />
        <meta name="keywords" content="RRB NTPC UG answer key 2025, SSC CGL answer key 2025, SSC CHSL answer key 2025, RRB ALP answer key 2025, Bank PO answer key 2025, exam score calculator, marks calculator with negative marking, rank predictor, government exam score card download, digialm answer key checker" />
        <link rel="canonical" href={SITE_URL} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="RankVeda" />
        <meta name="language" content="en-IN" />
        <meta name="theme-color" content="#1a1a2e" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Geo & Language */}
        <meta name="geo.region" content="IN" />
        <meta name="geo.country" content="India" />
        <meta name="geo.placename" content="India" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="RankVeda — Government Exam Score Calculator 2025 | RRB NTPC, SSC, Bank" />
        <meta property="og:description" content="Free answer key calculator for RRB NTPC UG, SSC CGL, CHSL, Bank PO, RRB ALP. Calculate exact marks with negative marking, predict live rank & percentile, download score card." />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content="RankVeda" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="RankVeda - Government Exam Answer Key Calculator" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RankVeda — Government Exam Answer Key & Rank Calculator 2025" />
        <meta name="twitter:description" content="Check RRB NTPC UG, SSC, Bank answer keys. Instant score, rank & score card. Free!" />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
        <meta name="twitter:site" content="@RankVedaIn" />
        <meta name="twitter:creator" content="@RankVedaIn" />

        {/* JSON-LD Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

        {/* Additional SEO */}
        <link rel="sitemap" href={`${SITE_URL}/sitemap.xml`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://rrb.digialm.com" />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

        {/* NAVBAR */}
        <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="RankVeda Home">
              <span className="text-xl font-black gradient-text" aria-hidden="true">⚡</span>
              <span className="text-xl font-black gradient-text">RankVeda</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-400">
              <Link href="/exams" className="hover:text-white transition">Exam</Link>
              <Link href="/exams/rrb-ntpc-ug" className="hover:text-white transition">RRB NTPC UG</Link>
              <Link href="/marketplace" className="hover:text-white transition">Question Bank</Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/marketplace" className="hidden sm:flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition">
                <FaBookOpen className="text-xs" /> Question Bank
              </Link>
              <Link href="/login" className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition">
                <FaUser className="text-xs" /> Login
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-12 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              🇮🇳 India's #1 Free Exam Score Calculator
            </div>

              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
              Select Your Exam<br />
              <span className="gradient-text">Get Instant Score & Rank</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-6">
              RRB NTPC UG, SSC CGL, CHSL, Bank PO, RRB ALP — choose your exam from below 
              and check the answer key. Free, fast with a professional score card.
            </p>

            <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-700 text-sm px-4 py-2 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <FaUsers className="text-indigo-400" />
              <span className="font-bold text-white" suppressHydrationWarning>{(liveCount || 24580).toLocaleString()}+</span>
              <span className="text-gray-500">candidates checked their scores</span>
            </div>
          </motion.div>
        </section>

        {/* ALL EXAMS CARDS */}
        <section className="max-w-7xl mx-auto px-4 pb-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black mb-2">📋 Exams</h2>
            <p className="text-gray-500 text-sm">Choose your exam and check the answer key</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXAMS.map((exam, i) => {
              const isActive = !!exam.href;
              const Wrapper = isActive ? Link : 'div';
              const wrapperProps = isActive ? { href: exam.href } : {};

              return (
                <motion.div key={exam.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Wrapper {...wrapperProps}>
                    <div className={`bg-gradient-to-br ${exam.color} border ${exam.border} rounded-2xl p-5 transition ${isActive ? 'hover:border-indigo-500/60 cursor-pointer group' : 'opacity-70'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{exam.icon}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${exam.badgeColor}`}>{exam.badge}</span>
                      </div>
                      <h3 className={`font-black text-lg mb-0.5 ${isActive ? 'group-hover:text-indigo-400' : ''} transition`}>
                        {exam.name} <span className="text-xs font-normal text-gray-500">{exam.year}</span>
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{exam.fullName}</p>
                      <p className="text-xs text-gray-400 mb-3">{exam.desc}</p>

                      <div className="space-y-1.5 mb-3 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <FaCalendarAlt className="text-xs text-indigo-400" />
                          <span>{exam.pattern.questions} Questions</span>
                          <span className="text-gray-600">|</span>
                          <FaClock className="text-xs text-indigo-400" />
                          <span>{exam.pattern.duration} min</span>
                          <span className="text-gray-600">|</span>
                          <FaAward className="text-xs text-indigo-400" />
                          <span>{exam.pattern.marking}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {exam.topics.map((topic, ti) => (
                            <span key={ti} className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-gray-400">{topic}</span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        {isActive ? (
                          <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                            Check Answer Key <FaArrowRight className="text-xs group-hover:translate-x-1 transition" />
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FaClock className="text-xs" /> Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* STEPS */}
        <section className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-800">
          <h2 className="text-2xl font-black mb-2 text-center">How It Works?</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Know your result in 3 simple steps</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: '1', title: 'Choose Exam', desc: 'Select your exam from the list above.', icon: '👆' },
              { num: '2', title: 'Paste URL', desc: 'Copy the response sheet URL from digialm.com and paste it.', icon: '📋' },
              { num: '3', title: 'View Score', desc: 'See section-wise score, rank, percentile and download score card.', icon: '🏆' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-2xl mb-4">{s.icon}</div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-700 text-indigo-400 text-xs font-black mb-2">{s.num}</div>
                <h3 className="font-bold text-gray-200 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-7xl mx-auto px-4 py-10 border-t border-gray-800">
          <h2 className="text-2xl font-black mb-2 text-center">Why RankVeda?</h2>
          <p className="text-gray-500 text-sm text-center mb-8">Everything in one place — Free, Fast, Professional</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: FaChartLine, title: 'Section-wise Analysis', desc: 'View Right, Wrong, NA and Marks for each section separately.', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
              { icon: FaTrophy, title: 'Live Rank & Percentile', desc: 'Real-time rank calculation. Know how many candidates you are ahead of.', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
              { icon: FaDownload, title: 'Score Card Download', desc: 'Download official-style score card in PNG and PDF format.', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
              { icon: FaRobot, title: 'AI Solution Unlock', desc: 'Unlock detailed AI explanations for incorrect questions.', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
              { icon: FaCheckCircle, title: 'Negative Marking', desc: 'Automatic -1/3, -0.5, -0.25 negative marking as per official pattern.', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
              { icon: FaBookOpen, title: 'Question Bank', desc: 'All shifts questions in one place. Practice and revise.', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
            ].map(({ icon: Icon, title, desc, color, bg }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className={`${bg} border rounded-xl p-5`}>
                <Icon className={`${color} text-2xl mb-3`} />
                <h3 className="font-bold text-gray-200 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SEO CONTENT */}
        <section className="max-w-7xl mx-auto px-4 py-10 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <article>
              <h2 className="text-xl font-black mb-3">RRB NTPC UG Answer Key 2025</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Check the <strong className="text-gray-200">RRB NTPC Under Graduate (UG)</strong> answer key instantly on RankVeda. 
                Get your exact marks (with negative marking), 
                section-wise score (Mathematics 30, General Awareness 40, Reasoning 30), 
                and live rank from your digialm.com response sheet URL.
              </p>
            </article>
            <article>
              <h2 className="text-xl font-black mb-3">Score Card Download Kyun?</h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                The <strong className="text-gray-200">professional score card</strong> from RankVeda includes your photo, registration number, 
                roll number, section-wise breakdown, rank and percentile. 
                You can download it as PNG or PDF and share it.
              </p>
            </article>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-gray-800 py-8 px-4 mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-lg font-black gradient-text mb-2">⚡ RankVeda</div>
                <p className="text-xs text-gray-600 leading-relaxed">India's free platform for government exam answer key calculation, rank prediction and score card download.</p>
              </div>
              <div>
                <div className="font-bold text-gray-400 text-sm mb-2">Exams</div>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li><Link href="/exams/rrb-ntpc-ug" className="hover:text-gray-400 transition">RRB NTPC UG 2025</Link></li>
                  <li className="text-gray-500">SSC CGL 2025 (Coming Soon)</li>
                  <li className="text-gray-500">SSC CHSL 2025 (Coming Soon)</li>
                  <li className="text-gray-500">RRB ALP 2025 (Coming Soon)</li>
                  <li className="text-gray-500">Bank PO 2025 (Coming Soon)</li>
                  <li className="text-gray-500">SSC MTS 2025 (Coming Soon)</li>
                </ul>
              </div>
              <div>
                <div className="font-bold text-gray-400 text-sm mb-2">Links</div>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li><Link href="/exams" className="hover:text-gray-400 transition">All Exams</Link></li>
                  <li><Link href="/marketplace" className="hover:text-gray-400 transition">Question Bank</Link></li>
                  <li><Link href="/login" className="hover:text-gray-400 transition">Login</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-gray-700">
              <div>© 2025 RankVeda.in — All Rights Reserved</div>
              <div>Disclaimer: Scores are unofficial. Final result by respective recruitment boards only.</div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}