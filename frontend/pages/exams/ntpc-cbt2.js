import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaSearch, FaUsers, FaTrophy, FaDownload, FaCheck, FaChevronDown, FaChevronUp, FaBookOpen, FaRobot, FaChartLine } from 'react-icons/fa';
import axios from 'axios';

const EXAM_ID = 7;
const EXAM_SLUG = 'ntpc-cbt2';
const SITE_URL = 'https://rankveda.in';
const CANONICAL = `${SITE_URL}/exams/${EXAM_SLUG}`;

const FAQ_ITEMS = [
  {
    q: 'Where to find NTPC CBT-II answer key?',
    a: 'The official NTPC CBT-II answer key is published by the railway recruitment portal. Paste your response sheet URL on RankVeda to get instant score, section-wise analysis and rank estimate.'
  },
  {
    q: 'How is NTPC CBT-II score calculated?',
    a: 'RankVeda applies the exam marking scheme automatically so you can see your exact score with negative marking and unattempted questions accounted for.'
  },
  {
    q: 'What is the NTPC CBT-II exam pattern?',
    a: 'NTPC CBT-II is the second-stage CBT with 120 objective questions, 90 minutes duration and a 1/3 negative marking for every wrong answer.'
  },
  {
    q: 'How is rank calculated on RankVeda?',
    a: 'RankVeda uses live candidate data to provide an unofficial rank estimate. This may differ from the official result announcement.'
  },
  {
    q: 'Can I download the NTPC CBT-II score card?',
    a: 'Yes. You can download your score card in PNG or PDF format with candidate details, section-wise marks, score, rank and percentile.'
  },
  {
    q: 'What is the NTPC CBT-II expected cutoff?',
    a: 'The expected cutoff depends on category, zone and vacancy pressure. RankVeda helps you understand your standing with a live rank estimate and score analysis.'
  },
];

const EXAM_SECTIONS = [
  { name: 'Mathematics', questions: 35, marks: 35, topics: ['Number System', 'Simplification', 'Ratio & Proportion', 'Time & Work', 'Profit & Loss'] },
  { name: 'General Intelligence & Reasoning', questions: 35, marks: 35, topics: ['Analogy', 'Series', 'Coding-Decoding', 'Syllogism', 'Blood Relations'] },
  { name: 'General Awareness', questions: 50, marks: 50, topics: ['Current Affairs', 'History', 'Geography', 'Science', 'Polity'] },
];

const EXAM_HIGHLIGHTS = [
  { label: 'Exam Name', value: 'RRB NTPC CBT-II' },
  { label: 'Conducting Body', value: 'Railway Recruitment Board (RRB)' },
  { label: 'Exam Mode', value: 'Computer Based Test (CBT)' },
  { label: 'Duration', value: '90 Minutes' },
  { label: 'Total Questions', value: '120' },
  { label: 'Maximum Marks', value: '120 Marks' },
  { label: 'Question Type', value: 'Objective Type (MCQ)' },
  { label: 'Language', value: 'English, Hindi & Regional Languages' },
  { label: 'Negative Marking', value: '1/3 mark for each wrong answer' },
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
        className="w-full flex items-center justify-between p-4 text-left bg-gray-900 hover:bg-gray-800 transition gap-4"
      >
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

export default function NTPCCBT2Page() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/live-stats?exam=${EXAM_ID}`);
        setLiveCount(res.data.totalViews || 0);
      } catch {
        setLiveCount(prev => prev || 12487);
      }
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

  const examEventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: 'NTPC CBT-II Exam 2025',
    description: 'NTPC CBT-II answer key calculator and rank predictor for Railway Recruitment Board candidates.',
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
      { '@type': 'ListItem', position: 3, name: 'NTPC CBT-II', item: CANONICAL },
    ]
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'NTPC CBT-II Answer Key 2025 — Score Calculator & Rank Predictor | RankVeda',
    description: 'Check NTPC CBT-II answer key 2025 instantly. Calculate exact marks with negative marking, view section-wise score breakdown, predict your rank and percentile. Download score card.',
    url: CANONICAL,
    inLanguage: 'en-IN',
    author: { '@type': 'Organization', name: 'RankVeda', url: SITE_URL },
    breadcrumb: breadcrumbSchema,
  };

  return (
    <>
      <Head>
        <title>NTPC CBT-II Answer Key 2025 — Score Calculator & Rank Predictor | RankVeda</title>
        <meta name="description" content="Check NTPC CBT-II answer key 2025 instantly. Calculate exact marks with negative marking, view section-wise score breakdown, predict rank and percentile. Download score card in PNG/PDF." />
        <meta name="keywords" content="NTPC CBT-II answer key 2025, NTPC CBT-II score calculator, NTPC CBT-II rank predictor, NTPC CBT-II marks calculator, railway exam answer key, NTPC answer key 2025" />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="RankVeda" />
        <meta name="language" content="en-IN" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="NTPC CBT-II Answer Key 2025 | Score Calculator & Rank | RankVeda" />
        <meta property="og:description" content="Instantly check NTPC CBT-II answer key, calculate score with negative marking, view section-wise breakdown, predict rank and download score card." />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content="RankVeda" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NTPC CBT-II Answer Key 2025 | RankVeda" />
        <meta name="twitter:description" content="Instantly check NTPC CBT-II answer key, score & rank. Section-wise analysis. Download score card. Free!" />
        <meta name="twitter:site" content="@RankVedaIn" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(examEventSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
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

        <nav aria-label="breadcrumb" className="max-w-6xl mx-auto px-4 pt-4">
          <ol className="flex items-center gap-2 text-xs text-gray-500">
            <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
            <li>›</li>
            <li><Link href="/exams" className="hover:text-gray-300">Exams</Link></li>
            <li>›</li>
            <li className="text-indigo-400 font-medium">NTPC CBT-II</li>
          </ol>
        </nav>

        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/50 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                🚉 NTPC CBT-II 2025
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight mb-3">
                NTPC CBT-II{' '}
                <span className="gradient-text">Answer Key</span>{' '}
                2025 — Score Calculator & Rank Predictor
              </h1>
              <p className="text-gray-400 text-base leading-relaxed mb-5">
                Paste your <strong className="text-gray-200">NTPC CBT-II</strong> response sheet URL and get exact score with negative marking, section-wise breakdown, live rank and percentile instantly.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-bold" suppressHydrationWarning>
                  {liveCount.toLocaleString()}+
                </span>
                <span className="text-gray-500">candidates checked on RankVeda</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-bold mb-4 text-gray-200">Check Your NTPC CBT-II Score</h2>
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
                      placeholder="https://railwayportal/.../assessment.html"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder-gray-600 text-sm transition"
                    />
                    <p className="mt-1.5 text-xs text-gray-600">Paste your official response sheet URL here</p>
                  </div>
                  <button type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg">
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

        <section className="max-w-6xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 mb-2"><FaBookOpen className="text-sm" /> <span className="font-semibold">Exam Pattern</span></div>
              <p className="text-sm text-gray-400">120 objective questions across Mathematics, Reasoning and General Awareness in 90 minutes.</p>
            </div>
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 mb-2"><FaTrophy className="text-sm" /> <span className="font-semibold">Rank Prediction</span></div>
              <p className="text-sm text-gray-400">Get a smart rank estimate based on live candidate performance.</p>
            </div>
            <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 mb-2"><FaDownload className="text-sm" /> <span className="font-semibold">Score Card</span></div>
              <p className="text-sm text-gray-400">Download a downloadable score card in PNG or PDF format.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4 text-indigo-400">
                <FaChartLine /> <span className="font-semibold">Exam Pattern</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/60">
                <div className="grid grid-cols-2 border-b border-gray-800 text-sm font-semibold text-gray-300">
                  <div className="p-3">Subject</div>
                  <div className="p-3">Questions</div>
                </div>
                {EXAM_SECTIONS.map((section) => (
                  <div key={section.name} className="grid grid-cols-2 border-b border-gray-800 last:border-b-0">
                    <div className="p-3 text-white">{section.name}</div>
                    <div className="p-3 text-gray-400">{section.questions}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-950/60 p-4 text-sm text-gray-400">
                <p className="font-semibold text-white mb-2">Marking Scheme</p>
                <p>Correct answer: +1 mark</p>
                <p>Incorrect answer: -1/3 mark</p>
                <p>Unattempted: 0 mark</p>
              </div>
            </div>

            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4 text-indigo-400">
                <FaRobot /> <span className="font-semibold">Why RankVeda?</span>
              </div>
              <div className="space-y-4 text-sm text-gray-300">
                {EXAM_HIGHLIGHTS.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{item.label}</span>
                      <span className="text-right text-gray-400">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <FAQItem key={item.q} item={item} idx={idx} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
