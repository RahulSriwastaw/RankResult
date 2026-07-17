import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FaSearch, FaUsers, FaTrophy, FaDownload, FaChevronDown,
  FaChevronUp, FaBookOpen, FaRobot, FaChartLine, FaArrowRight,
  FaCheckCircle, FaLock
} from 'react-icons/fa';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Logo from '../../components/Logo';

const SITE_URL = 'https://rankveda.in';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Colour token map (themeColor → Tailwind classes for Light Theme) ────────
const THEME = {
  indigo: {
    badge: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    hero: 'from-indigo-50/50 via-white to-slate-50/30',
    btn: 'from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-500 shadow-indigo-100',
    ring: 'focus:border-indigo-500 focus:ring-indigo-500/20',
    icon: 'text-indigo-600',
    dot: 'bg-indigo-600',
    border: 'border-indigo-100',
    crumb: 'text-indigo-600',
    tag: 'bg-indigo-50/60 text-indigo-700 border-indigo-100/50',
  },
  red: {
    badge: 'bg-red-50 border-red-200 text-red-700',
    hero: 'from-red-50/50 via-white to-slate-50/30',
    btn: 'from-red-700 via-red-600 to-orange-600 hover:from-red-600 hover:to-orange-500 shadow-red-100',
    ring: 'focus:border-red-500 focus:ring-red-500/20',
    icon: 'text-red-600',
    dot: 'bg-red-600',
    border: 'border-red-100',
    crumb: 'text-red-600',
    tag: 'bg-red-50/60 text-red-700 border-red-100/50',
  },
  blue: {
    badge: 'bg-blue-50 border-blue-200 text-blue-700',
    hero: 'from-blue-50/50 via-white to-slate-50/30',
    btn: 'from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 shadow-blue-100',
    ring: 'focus:border-blue-500 focus:ring-blue-500/20',
    icon: 'text-blue-600',
    dot: 'bg-blue-600',
    border: 'border-blue-100',
    crumb: 'text-blue-600',
    tag: 'bg-blue-50/60 text-blue-700 border-blue-100/50',
  },
  teal: {
    badge: 'bg-teal-50 border-teal-200 text-teal-700',
    hero: 'from-teal-50/50 via-white to-slate-50/30',
    btn: 'from-teal-700 via-teal-600 to-cyan-600 hover:from-teal-600 hover:to-cyan-500 shadow-teal-100',
    ring: 'focus:border-teal-500 focus:ring-teal-500/20',
    icon: 'text-teal-600',
    dot: 'bg-teal-600',
    border: 'border-teal-100',
    crumb: 'text-teal-600',
    tag: 'bg-teal-50/60 text-teal-700 border-teal-100/50',
  },
  amber: {
    badge: 'bg-amber-50 border-amber-200 text-amber-700',
    hero: 'from-amber-50/50 via-white to-slate-50/30',
    btn: 'from-amber-700 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-500 shadow-amber-100',
    ring: 'focus:border-amber-500 focus:ring-amber-500/20',
    icon: 'text-amber-600',
    dot: 'bg-amber-600',
    border: 'border-amber-100',
    crumb: 'text-amber-600',
    tag: 'bg-amber-50/60 text-amber-700 border-amber-100/50',
  },
  purple: {
    badge: 'bg-purple-50 border-purple-200 text-purple-700',
    hero: 'from-purple-50/50 via-white to-slate-50/30',
    btn: 'from-purple-700 via-purple-600 to-pink-600 hover:from-purple-600 hover:to-pink-500 shadow-purple-100',
    ring: 'focus:border-purple-500 focus:ring-purple-500/20',
    icon: 'text-purple-600',
    dot: 'bg-purple-600',
    border: 'border-purple-100',
    crumb: 'text-purple-600',
    tag: 'bg-purple-50/60 text-purple-700 border-purple-100/50',
  },
  orange: {
    badge: 'bg-orange-50 border-orange-200 text-orange-700',
    hero: 'from-orange-50/50 via-white to-slate-50/30',
    btn: 'from-orange-700 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-500 shadow-orange-100',
    ring: 'focus:border-orange-500 focus:ring-orange-500/20',
    icon: 'text-orange-600',
    dot: 'bg-orange-600',
    border: 'border-orange-100',
    crumb: 'text-orange-600',
    tag: 'bg-orange-50/60 text-orange-700 border-orange-100/50',
  },
  pink: {
    badge: 'bg-pink-50 border-pink-200 text-pink-700',
    hero: 'from-pink-50/50 via-white to-slate-50/30',
    btn: 'from-pink-700 via-pink-600 to-rose-600 hover:from-pink-600 hover:to-rose-500 shadow-pink-100',
    ring: 'focus:border-pink-500 focus:ring-pink-500/20',
    icon: 'text-pink-600',
    dot: 'bg-pink-600',
    border: 'border-pink-100',
    crumb: 'text-pink-600',
    tag: 'bg-pink-50/60 text-pink-700 border-pink-100/50',
  },
};

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQItem({ item, idx, t }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white">
      <button
        id={`faq-q-${idx}`}
        aria-expanded={open}
        aria-controls={`faq-a-${idx}`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition gap-4 text-indigo-950 font-bold"
      >
        <span className="text-sm">{item.q}</span>
        {open
          ? <FaChevronUp className={`${t.icon} shrink-0 text-xs`} />
          : <FaChevronDown className="text-slate-400 shrink-0 text-xs" />}
      </button>
      {open && (
        <div
          id={`faq-a-${idx}`}
          role="region"
          aria-labelledby={`faq-q-${idx}`}
          className="p-5 bg-slate-50/50 border-t border-slate-100 text-xs md:text-sm text-slate-600 leading-relaxed"
        >
          {item.a}
        </div>
      )}
    </div>
  );
}

// ─── Other Exams sidebar ─────────────────────────────────────────────────────
function OtherExams({ currentSlug, allExams = [] }) {
  const others = allExams.filter((e) => e.slug !== currentSlug).slice(0, 5);
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
      <h3 className="font-extrabold text-indigo-950 mb-4 text-sm flex items-center gap-2">
        <FaBookOpen className="text-indigo-600" /> Other Exams
      </h3>
      <div className="space-y-3">
        {others.map((e) => (
          e.status === 'active' ? (
            <Link
              key={e.slug}
              href={`/exams/${e.slug}`}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-100 transition group text-xs font-bold text-slate-700"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{e.icon}</span> {e.name}
              </span>
              <FaArrowRight className="text-[10px] text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
            </Link>
          ) : (
            <div
              key={e.slug}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50/50 border border-slate-100/50 text-xs font-bold text-slate-400 opacity-60"
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">{e.icon}</span> {e.name}
              </span>
              <FaLock className="text-[10px]" />
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function ExamPage({ exam, allExams = [] }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [liveCount, setLiveCount] = useState(0);

  // Guard: fallback or missing prop during dev HMR
  if (router.isFallback || !exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-xs font-bold">Loading exam data...</p>
        </div>
      </div>
    );
  }

  const themeColorKey = exam.theme_color || 'indigo';
  const t = THEME[themeColorKey] || THEME.indigo;
  const CANONICAL = `${SITE_URL}/exams/${exam.slug}`;

  // Live candidate counter
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/live-stats?exam=${exam.id}`);
        setLiveCount(res.data.totalViews || 0);
      } catch {
        setLiveCount((prev) => prev || Math.floor(Math.random() * 5000 + 8000));
      }
    };
    fetchCount();
    const timer = setInterval(fetchCount, 15000);
    return () => clearInterval(timer);
  }, [exam.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    router.push(`/result?url=${encodeURIComponent(url.trim())}&exam=${exam.id}`);
  };

  // ── Schema.org structured data ──────────────────────────────────────────
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Exams', item: `${SITE_URL}/exams` },
      { '@type': 'ListItem', position: 3, name: exam.name, item: CANONICAL },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: exam.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const examEventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: exam.seo.eventName,
    description: exam.seo.eventDesc,
    organizer: { '@type': 'Organization', name: exam.conducted_by, url: 'https://indianrailways.gov.in' },
    url: CANONICAL,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: exam.seo.title,
    description: exam.seo.description,
    url: CANONICAL,
    inLanguage: 'en-IN',
    author: { '@type': 'Organization', name: 'RankVeda', url: SITE_URL },
    breadcrumb: breadcrumbSchema,
  };

  return (
    <>
      <Head>
        <title>{exam.seo.title}</title>
        <meta name="description" content={exam.seo.description} />
        <meta name="keywords" content={exam.seo.keywords} />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="RankVeda" />
        <meta name="language" content="en-IN" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={exam.seo.ogTitle} />
        <meta property="og:description" content={exam.seo.ogDesc} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:site_name" content="RankVeda" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={exam.seo.twitterTitle} />
        <meta name="twitter:description" content={exam.seo.twitterDesc} />
        <meta name="twitter:site" content="@RankVedaIn" />

        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(examEventSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <Navbar user={user} />

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav aria-label="breadcrumb" className="max-w-7xl mx-auto px-4 pt-4">
          <ol className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <li><Link href="/" className="hover:text-indigo-600">Home</Link></li>
            <li className="text-slate-350">›</li>
            <li><Link href="/exams" className="hover:text-indigo-600">Exams</Link></li>
            <li className="text-slate-350">›</li>
            <li className={`${t.crumb} font-extrabold`}>{exam.name}</li>
          </ol>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 py-10 relative">
          {/* Subtle gradient glow */}
          <div className={`absolute inset-0 bg-gradient-to-br ${t.hero} to-transparent pointer-events-none rounded-3xl`} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">

            {/* Left — copy */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className={`inline-flex items-center gap-2 ${t.badge} border text-[10px] font-extrabold px-3 py-1.5 rounded-full mb-4`}>
                {exam.icon} {exam.name} {exam.year}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 leading-tight mb-3 tracking-tight">
                {exam.name}{' '}
                <span className="text-indigo-600">Rank Predictor</span>{' '}
                {exam.year} — Score Calculator &amp; Answer Key
              </h1>

              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                {exam.body_text}
              </p>

              {/* Live counter */}
              <div className="flex items-center gap-2 text-xs font-bold mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-600" suppressHydrationWarning>
                  {liveCount.toLocaleString()}+
                </span>
                <span className="text-slate-400 uppercase tracking-wide">candidates checked on RankVeda</span>
              </div>

              {/* Quick feature pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { icon: '⚡', text: 'Instant Score' },
                  { icon: '📊', text: 'Section-wise Analysis' },
                  { icon: '🏆', text: 'Live Rank' },
                  { icon: '📥', text: 'Score Card Download' },
                  { icon: '🤖', text: 'AI Explanations' },
                ].map((pill) => (
                  <span
                    key={pill.text}
                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border ${t.tag}`}
                  >
                    {pill.icon} {pill.text}
                  </span>
                ))}
              </div>

              {/* Exam at a glance */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Questions', value: exam.sections.reduce((sum, sec) => sum + sec.questions, 0) + ' MCQs' },
                  { label: 'Duration', value: exam.highlights.find(h => h.label === 'Duration')?.value || '—' },
                  { label: 'Sections', value: exam.sections.length + ' Subjects' },
                  { label: 'Marking', value: exam.highlights.find(h => h.label === 'Negative Marking')?.value || '—' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                    <p className="text-sm font-extrabold text-indigo-950">{stat.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — URL input card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:sticky lg:top-24"
            >
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <h2 className="text-lg font-extrabold mb-1 text-indigo-950">
                  Check Your {exam.name} Score
                </h2>
                <p className="text-xs font-semibold text-slate-400 mb-4">
                  Paste your official response sheet / answer key URL below
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="answer-key-url" className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      Answer Key / Response Sheet URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="answer-key-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://cdndigialm.com/.../assessment.html"
                      required
                      className={`w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 ${t.ring} focus:ring-2 text-slate-800 placeholder-slate-400 text-sm transition outline-none`}
                    />
                    <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                      Find this URL on the official exam portal after result declaration
                    </p>
                  </div>

                  <button
                    type="submit"
                    id="check-score-btn"
                    className={`w-full py-3 rounded-xl bg-gradient-to-r ${t.btn} text-white font-extrabold transition flex items-center justify-center gap-2 text-sm shadow-md`}
                  >
                    <FaSearch className="text-xs" /> Check Score &amp; Rank Now
                  </button>
                </form>

                {/* Trust signals */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-2">
                    {exam.features.map((f) => (
                      <div key={f.text} className="flex flex-col items-center text-center gap-1">
                        <span className="text-xl">{f.icon}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{f.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  🔒 Free forever · No login required · Instant results
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── How it Works ───────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-extrabold mb-6 text-indigo-950">
            How to Check {exam.name} Score on RankVeda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Open Official Portal', desc: `Go to the official ${exam.conducted_by} website and find your response sheet link.`, icon: '🌐' },
              { step: '02', title: 'Copy URL & Paste', desc: 'Copy the response sheet URL and paste it in the input box above on RankVeda.', icon: '📋' },
              { step: '03', title: 'Instant Analysis', desc: 'Get score with negative marking, section-wise breakdown, live rank and percentile instantly.', icon: '🚀' },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * parseInt(item.step) }}
                className="bg-white border border-slate-100 rounded-3xl p-6 relative overflow-hidden shadow-sm"
              >
                <span className="absolute top-3 right-4 text-5xl font-black text-slate-100 select-none leading-none">
                  {item.step}
                </span>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-extrabold text-indigo-950 mb-1 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Exam Pattern + Details ─────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-extrabold mb-6 text-indigo-950">{exam.name} Exam Pattern {exam.year}</h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">

            {/* Pattern table */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className={`flex items-center gap-2 mb-4 font-bold ${t.icon}`}>
                <FaChartLine className="text-sm" />
                <span className="text-indigo-950 font-extrabold text-sm">Subject-wise Breakdown</span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <div className="grid grid-cols-3 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 bg-slate-50/50 uppercase tracking-wider">
                  <div className="p-3">Subject</div>
                  <div className="p-3 text-center">Questions</div>
                  <div className="p-3 text-center">Marks</div>
                </div>
                {exam.sections.map((section) => (
                  <div key={section.name} className="grid grid-cols-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition">
                    <div className="p-3 text-xs font-semibold text-slate-700">{section.name}</div>
                    <div className="p-3 text-xs text-center font-bold text-slate-500">{section.questions}</div>
                    <div className="p-3 text-xs text-center font-bold text-slate-500">{section.marks}</div>
                  </div>
                ))}
                {/* Total row */}
                <div className="grid grid-cols-3 bg-slate-50 border-t border-slate-100">
                  <div className="p-3 text-xs font-extrabold text-indigo-950">Total</div>
                  <div className={`p-3 text-xs text-center font-extrabold ${t.icon}`}>
                    {exam.sections.reduce((sum, sec) => sum + sec.questions, 0)}
                  </div>
                  <div className={`p-3 text-xs text-center font-extrabold ${t.icon}`}>
                    {exam.sections.reduce((sum, sec) => sum + sec.marks, 0)}
                  </div>
                </div>
              </div>

              {/* Marking scheme */}
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4 text-xs text-slate-500">
                <p className="font-extrabold text-indigo-950 mb-2 text-[10px] uppercase tracking-wider">Marking Scheme</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-500 text-xs shrink-0" />
                    <span>Correct answer: <strong className="text-emerald-600 font-bold">+1 mark</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-[10px] font-black shrink-0 w-3 text-center">✕</span>
                    <span>Wrong answer: <strong className="text-red-600 font-bold">
                      -{exam.highlights.find(h => h.label === 'Negative Marking')?.value?.replace('mark for each wrong answer', '').trim() || '1/3'}
                    </strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs shrink-0 w-3 text-center">○</span>
                    <span>Unattempted: <strong className="text-slate-500 font-bold">0 marks</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam details table */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className={`flex items-center gap-2 mb-4 font-bold ${t.icon}`}>
                <FaRobot className="text-sm" />
                <span className="text-indigo-950 font-extrabold text-sm">Exam Details</span>
              </div>
              <div className="space-y-2">
                {exam.highlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-100 bg-slate-50/30 px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    <span className="text-xs font-extrabold text-indigo-950">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Topics Covered ─────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-extrabold mb-6 text-indigo-950">{exam.name} Topics Covered</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exam.sections.map((section) => (
              <div key={section.name} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${t.dot}`} />
                  <h3 className="font-extrabold text-indigo-950 text-sm">{section.name}</h3>
                  <span className={`ml-auto text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${t.tag}`}>
                    {section.questions} Qs
                  </span>
                </div>
                <ul className="space-y-2">
                  {section.topics.map((topic) => (
                    <li key={topic} className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <span className={`w-1 h-1 rounded-full ${t.dot} opacity-60`} />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why RankVeda ───────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-extrabold mb-6 text-indigo-950">Why Use RankVeda for {exam.name}?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Instant Score Calculation', desc: 'Get your exact score in seconds — automatic negative marking calculation, no manual effort.' },
              { icon: '📊', title: 'Section-wise Analysis', desc: 'See your performance broken down by subject. Identify weak areas instantly.' },
              { icon: '🏆', title: 'Live Rank & Percentile', desc: `Know where you stand among all ${exam.name} candidates on RankVeda in real-time.` },
              { icon: '📥', title: 'Score Card Download', desc: 'Download your personalized score card in PNG or PDF — share with friends and family.' },
              { icon: '🤖', title: 'AI-Powered Explanations', desc: 'Understand wrong answers with Gemini AI — never miss learning from mistakes.' },
              { icon: '🔒', title: '100% Free & Secure', desc: 'No login required, no data sold. Your result URL stays private and secure.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="font-extrabold text-indigo-950 text-sm mb-2">{feature.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-extrabold mb-6 text-indigo-950">
            Frequently Asked Questions — {exam.name}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="space-y-4">
              {exam.faq.map((item, idx) => (
                <FAQItem key={item.q} item={item} idx={idx} t={t} />
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <OtherExams currentSlug={exam.slug} allExams={allExams} />

              {/* CTA card */}
              <div className={`bg-gradient-to-br ${t.hero} border border-slate-100 rounded-3xl p-6 shadow-sm`}>
                <h3 className="font-extrabold text-indigo-950 text-sm mb-2">
                  Ready to check your {exam.name} score?
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Paste your response sheet URL and get instant results.
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${t.btn} text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md`}
                >
                  <FaSearch className="text-[10px]" /> Check Score Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 px-4 mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
              <div>
                <div className="mb-2"><Logo size="sm" /></div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Unofficial rank predictor. Not affiliated with {exam.conducted_by || 'recruitment board'}.
                </p>
              </div>
              <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <Link href="/exams" className="hover:text-white transition">Exams</Link>
                <Link href="/marketplace" className="hover:text-white transition">Question Bank</Link>
              </div>
            </div>
            
            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div>© 2025 RankVeda — All Rights Reserved</div>
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

// ─── Dynamic Server Side Rendering ───────────────────────────────────────────
export async function getServerSideProps({ params }) {
  try {
    const [examRes, allExamsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/exams/${params.slug}`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/exams`)
    ]);
    
    if (examRes.status === 404) {
      return { notFound: true };
    }
    
    const examData = await examRes.json();
    const allExamsData = await allExamsRes.json();
    const exam = examData.exam;
    const allExams = allExamsData.exams || [];
    
    if (!exam || exam.status === 'draft') {
      return { notFound: true };
    }
    
    return {
      props: {
        exam,
        allExams,
      },
    };
  } catch (e) {
    console.error("Error fetching exam details:", e);
    return { notFound: true };
  }
}
