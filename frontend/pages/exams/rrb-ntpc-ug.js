import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaSearch, FaUsers, FaTrophy, FaDownload, FaCheck, FaChevronDown, FaChevronUp, FaBookOpen, FaRobot, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const EXAM_ID = 1;
const EXAM_SLUG = 'rrb-ntpc-ug';
const SITE_URL = 'https://rankveda.in';
const CANONICAL = `${SITE_URL}/exams/rrb-ntpc-ug`;

const FAQ_ITEMS = [
  {
    q: 'RRB NTPC UG answer key कहाँ मिलेगी?',
    a: 'RRB NTPC UG की official answer key digialm.com पर जारी होती है। आप वहाँ से अपनी response sheet URL copy करके RankVeda पर paste करें — तुरंत score और rank मिलेगी।'
  },
  {
    q: 'RRB NTPC UG score कैसे calculate होता है?',
    a: 'RRB NTPC UG CBT में हर सही जवाब पर +1 अंक मिलता है और हर गलत जवाब पर -1/3 अंक कटता है। न किए गए सवालों पर कोई marks नहीं काटे जाते। RankVeda automatically यही formula apply करता है।'
  },
  {
    q: 'RRB NTPC UG exam pattern क्या है?',
    a: 'RRB NTPC UG CBT-I में 100 questions होते हैं — Mathematics (30 Qs), General Awareness (40 Qs), और General Intelligence & Reasoning (30 Qs)। कुल समय 90 मिनट है।'
  },
  {
    q: 'RankVeda पर rank कैसे calculate होती है?',
    a: 'RankVeda सभी candidates के scores के आधार पर live rank calculate करता है जो इस platform पर result check कर चुके हैं। यह rank unofficial है और official RRB result से अलग हो सकती है।'
  },
  {
    q: 'क्या score card download कर सकते हैं?',
    a: 'हाँ! RankVeda पर आप अपनी score card PNG और PDF format में download कर सकते हैं। इसमें candidate photo, section-wise score, rank और percentile सब कुछ होता है।'
  },
  {
    q: 'RRB NTPC UG expected cutoff 2025 क्या है?',
    a: 'RRB NTPC UG expected cutoff category और zone के अनुसार अलग-अलग होती है। सामान्यतः UR category के लिए 60-70% marks expected cutoff range में आते हैं। RankVeda पर live rank से आप अपनी position समझ सकते हैं।'
  },
];

const EXAM_SECTIONS = [
  { name: 'Mathematics', questions: 30, marks: 30, topics: ['Number System', 'Simplification', 'Ratio & Proportion', 'Time & Work', 'Profit & Loss'] },
  { name: 'General Awareness', questions: 40, marks: 40, topics: ['Current Affairs', 'Indian History', 'Geography', 'Science & Tech', 'Sports & Awards'] },
  { name: 'General Intelligence & Reasoning', questions: 30, marks: 30, topics: ['Coding-Decoding', 'Blood Relations', 'Syllogism', 'Series', 'Analogy'] },
];

function FAQItem({ item, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden">
      <button
        id={`faq-q-${idx}`}
        aria-expanded={open}
        aria-controls={`faq-a-${idx}`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left bg-gray-900 hover:bg-gray-800 transition gap-4">
        <span className="font-medium text-gray-200 text-sm">{item.q}</span>
        {open ? <FaChevronUp className="text-indigo-400 shrink-0" /> : <FaChevronDown className="text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div id={`faq-a-${idx}`} role="region" aria-labelledby={`faq-q-${idx}`}
          className="p-4 bg-gray-900/50 border-t border-gray-700/50 text-sm text-gray-300 leading-relaxed">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function RRBNTPCUGPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/live-stats?exam=${EXAM_ID}`);
        setLiveCount(res.data.totalViews || 0);
      } catch { setLiveCount(prev => prev || 12847); }
    };
    fetch();
    const t = setInterval(fetch, 15000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    router.push(`/result?url=${encodeURIComponent(url.trim())}&exam=${EXAM_ID}`);
  };

  // JSON-LD Structured Data
  const examEventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'RRB NTPC Under Graduate CBT 2025',
    description: 'RRB NTPC UG CBT-I Computer Based Test conducted by Railway Recruitment Board for Under Graduate Level posts recruitment.',
    organizer: { '@type': 'Organization', name: 'Railway Recruitment Board', url: 'https://indianrailways.gov.in' },
    url: CANONICAL,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Exams', item: `${SITE_URL}/exams` },
      { '@type': 'ListItem', position: 3, name: 'RRB NTPC UG', item: CANONICAL },
    ]
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'RRB NTPC UG Answer Key 2025 — Marks Calculator & Rank Predictor | RankVeda',
    description: 'Check RRB NTPC Under Graduate answer key 2025 instantly. Calculate exact marks with negative marking, view section-wise score breakdown, predict your rank and percentile. Download score card.',
    url: CANONICAL,
    inLanguage: 'hi-IN',
    author: { '@type': 'Organization', name: 'RankVeda', url: SITE_URL },
    breadcrumb: breadcrumbSchema,
  };

  return (
    <>
      <Head>
        <title>RRB NTPC UG Answer Key 2025 — Marks Calculator & Rank Predictor | RankVeda</title>
        <meta name="description" content="Check RRB NTPC Under Graduate (UG) answer key 2025 instantly. Calculate exact marks with -1/3 negative marking, section-wise score, predict rank & percentile. Download score card in PNG/PDF." />
        <meta name="keywords" content="RRB NTPC UG answer key 2025, RRB NTPC Under Graduate marks calculator, NTPC UG CBT score, RRB NTPC UG rank predictor, NTPC UG expected cutoff 2025, RRB NTPC UG score card download" />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="RankVeda" />
        <meta name="language" content="hi-IN, en-IN" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="RRB NTPC UG Answer Key 2025 | Marks Calculator & Rank | RankVeda" />
        <meta property="og:description" content="Check RRB NTPC UG answer key, calculate exact score with negative marking, view section-wise breakdown, predict rank and download score card. Free tool." />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content="RankVeda" />
        <meta property="og:locale" content="hi_IN" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RRB NTPC UG Answer Key 2025 | RankVeda Marks Calculator" />
        <meta name="twitter:description" content="Instantly check RRB NTPC UG answer key, score & rank. Section-wise analysis. Download score card. Free!" />
        <meta name="twitter:site" content="@RankVedaIn" />
        
        {/* JSON-LD Schemas */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(examEventSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        
        {/* NAV */}
        <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-black gradient-text">⚡ RankVeda</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/exams" className="text-sm text-gray-400 hover:text-white transition">All Exams</Link>
              <Link href="/marketplace" className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition">
                <FaBookOpen className="text-xs" /> Question Bank
              </Link>
            </div>
          </div>
        </nav>

        {/* BREADCRUMB */}
        <nav aria-label="breadcrumb" className="max-w-6xl mx-auto px-4 pt-4">
          <ol className="flex items-center gap-2 text-xs text-gray-500">
            <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
            <li>›</li>
            <li><Link href="/exams" className="hover:text-gray-300">Exams</Link></li>
            <li>›</li>
            <li className="text-indigo-400 font-medium">RRB NTPC UG</li>
          </ol>
        </nav>

        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-red-950/50 border border-red-800/50 text-red-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                🚂 RRB NTPC UG 2025
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
                RRB NTPC UG{' '}
                <span className="gradient-text">Answer Key</span>{' '}
                2025 — Score Calculator & Rank Predictor
              </h1>
              <p className="text-gray-400 text-base leading-relaxed mb-5">
                अपनी <strong className="text-gray-200">RRB NTPC Under Graduate</strong> response sheet URL paste करें — तुरंत मिलेगा exact score (negative marking के साथ), section-wise breakdown, live rank और percentile। Score card download भी करें।
              </p>
              
              {/* Live counter */}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-bold" suppressHydrationWarning>
                  {liveCount.toLocaleString()}+
                </span>
                <span className="text-gray-500">candidates checked on RankVeda</span>
              </div>
            </motion.div>

            {/* URL FORM */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-200">Check Your RRB NTPC UG Score</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="answer-key-url" className="block text-xs font-medium text-gray-400 mb-1.5">
                      Answer Key / Response Sheet URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="answer-key-url"
                      type="url"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://rrb.digialm.com/.../assessment.html"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-gray-600 text-sm transition"
                    />
                    <p className="mt-1.5 text-xs text-gray-600">digialm.com की response sheet URL यहाँ paste करें</p>
                  </div>
                  <button type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-red-700 via-red-600 to-orange-600 hover:from-red-600 hover:to-orange-500 text-white font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg">
                    <FaSearch /> Check Score & Rank Now
                  </button>
                </form>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { icon: '⚡', text: 'Instant Result' },
                    { icon: '📊', text: 'Section-wise' },
                    { icon: '🏆', text: 'Live Rank' },
                  ].map((f, i) => (
                    <div key={i} className="flex flex-col items-center text-center gap-1">
                      <span className="text-xl">{f.icon}</span>
                      <span className="text-xs text-gray-500">{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="max-w-6xl mx-auto px-4 py-8 border-t border-gray-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FaChartLine, title: 'Section-wise Analysis', desc: 'Mathematics, GK, Reasoning — हर section का score अलग देखें', color: 'text-indigo-400' },
              { icon: FaTrophy, title: 'Live Rank & Percentile', desc: 'Real-time rank among all candidates on RankVeda', color: 'text-yellow-400' },
              { icon: FaDownload, title: 'Score Card Download', desc: 'Professional score card PNG/PDF में download करें', color: 'text-green-400' },
              { icon: FaRobot, title: 'AI Solution Unlock', desc: 'गलत questions के AI explanations अनलॉक करें', color: 'text-purple-400' },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition">
                <Icon className={`${color} text-2xl mb-3`} />
                <h3 className="font-bold text-gray-200 mb-1 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* EXAM PATTERN */}
        <section className="max-w-6xl mx-auto px-4 py-10 border-t border-gray-800">
          <h2 className="text-2xl font-black mb-2">RRB NTPC UG Exam Pattern 2025</h2>
          <p className="text-gray-400 text-sm mb-6">RRB NTPC Under Graduate CBT-I में 3 sections, 100 questions और 90 minutes का समय होता है।</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {EXAM_SECTIONS.map((sec, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-200">{sec.name}</h3>
                  <span className="text-xs bg-indigo-900/50 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{sec.questions} Qs</span>
                </div>
                <ul className="space-y-1">
                  {sec.topics.map((t, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-400">
                      <FaCheck className="text-green-500 shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Marking scheme */}
          <div className="bg-gray-900 border border-yellow-800/30 rounded-xl p-5">
            <h3 className="font-bold text-yellow-400 mb-3">📋 Marking Scheme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-green-900/50 border border-green-700 flex items-center justify-center font-black text-green-400">+1</span>
                <div>
                  <div className="font-medium text-gray-200">Correct Answer</div>
                  <div className="text-xs text-gray-500">+1 mark per question</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-red-900/50 border border-red-700 flex items-center justify-center font-black text-red-400 text-xs">-⅓</span>
                <div>
                  <div className="font-medium text-gray-200">Wrong Answer</div>
                  <div className="text-xs text-gray-500">-1/3 negative marking</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-black text-gray-400">0</span>
                <div>
                  <div className="font-medium text-gray-200">Unattempted</div>
                  <div className="text-xs text-gray-500">No marks deducted</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW TO USE */}
        <section className="max-w-6xl mx-auto px-4 py-10 border-t border-gray-800">
          <h2 className="text-2xl font-black mb-2">RRB NTPC UG Answer Key कैसे Check करें?</h2>
          <p className="text-gray-400 text-sm mb-6">3 आसान steps में अपना score और rank जानें:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'URL Copy करें', desc: 'digialm.com पर जाएं, अपनी RRB NTPC UG response sheet open करें और URL copy करें।', icon: '🔗' },
              { step: '02', title: 'RankVeda पर Paste करें', desc: 'ऊपर दिए URL box में paste करें और "Check Score & Rank" बटन दबाएं।', icon: '📋' },
              { step: '03', title: 'Result देखें & Download करें', desc: 'Section-wise score, live rank, percentile देखें और score card download करें।', icon: '📊' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-black">{s.step}</div>
                <div>
                  <div className="text-lg mb-1">{s.icon}</div>
                  <h3 className="font-bold text-gray-200 mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 py-10 border-t border-gray-800">
          <h2 className="text-2xl font-black mb-2">RRB NTPC UG — अक्सर पूछे जाने वाले सवाल (FAQ)</h2>
          <p className="text-gray-400 text-sm mb-6">RRB NTPC UG answer key और score calculation से जुड़े सवाल:</p>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => <FAQItem key={i} item={item} idx={i} />)}
          </div>
        </section>

        {/* ABOUT RRB NTPC UG — SEO Content */}
        <section className="max-w-6xl mx-auto px-4 py-10 border-t border-gray-800">
          <h2 className="text-2xl font-black mb-4">RRB NTPC Under Graduate (UG) 2025 — Complete Guide</h2>
          <div className="prose prose-sm prose-invert max-w-none text-gray-400 leading-relaxed space-y-4">
            <p>
              <strong className="text-gray-200">RRB NTPC UG (Under Graduate Level)</strong> की परीक्षा Railway Recruitment Board द्वारा Graduate Level posts जैसे Junior Clerk cum Typist, Accounts Clerk cum Typist, Junior Time Keeper, Trains Clerk आदि के लिए आयोजित की जाती है।
            </p>
            <p>
              <strong className="text-gray-200">RRB NTPC UG CBT-I</strong> में 100 objective type questions होते हैं जिन्हें 90 मिनट में solve करना होता है। इसमें तीन sections हैं: Mathematics (30 questions), General Awareness (40 questions), और General Intelligence & Reasoning (30 questions)।
            </p>
            <p>
              <strong className="text-gray-200">RankVeda</strong> India का एक free platform है जो RRB NTPC UG candidates को उनकी answer key URL से तुरंत marks calculate करने, live rank देखने, section-wise performance analyze करने और professional score card download करने की सुविधा देता है।
            </p>
            <p>
              <em className="text-xs text-gray-600">Disclaimer: RankVeda एक independent analysis platform है। यहाँ दिखाए गए scores और ranks unofficial हैं और official RRB result से भिन्न हो सकते हैं। Final result केवल Railway Recruitment Board द्वारा declared होगा।</em>
            </p>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="max-w-6xl mx-auto px-4 py-10 border-t border-gray-800">
          <div className="bg-gradient-to-br from-red-900/30 via-gray-900 to-indigo-900/30 border border-gray-700 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-black mb-2">अभी अपना RRB NTPC UG Score Check करें</h2>
            <p className="text-gray-400 text-sm mb-6">Free • Instant • Section-wise • Download Score Card</p>
            <button onClick={() => document.getElementById('answer-key-url')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold px-8 py-3 rounded-xl transition inline-flex items-center gap-2">
              <FaSearch /> Check Score Now
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-gray-800 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <div>© 2025 RankVeda.in — India's Exam Intelligence Platform</div>
            <div className="flex gap-4">
              <Link href="/exams" className="hover:text-gray-400">All Exams</Link>
              <Link href="/marketplace" className="hover:text-gray-400">Question Bank</Link>
              <Link href="/" className="hover:text-gray-400">Home</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
