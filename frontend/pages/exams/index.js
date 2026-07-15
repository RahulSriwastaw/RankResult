import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

const EXAMS = [
  {
    slug: 'rrb-ntpc-ug',
    name: 'RRB NTPC UG',
    year: '2025',
    fullName: 'Railway NTPC Under Graduate Level CBT-I',
    desc: '100 questions | 90 min | Math, GK, Reasoning. Check answer key, calculate score with negative marking and predict rank.',
    badge: 'Active',
    badgeColor: 'bg-green-900/50 text-green-400 border-green-800',
    icon: '🚂',
    color: 'from-red-600/20 to-orange-600/20',
    border: 'border-red-700/30',
  },
  {
    slug: 'ntpc-cbt2',
    name: 'NTPC CBT-II',
    year: '2025',
    fullName: 'Railway NTPC Computer Based Test-II',
    desc: '100 questions | 90 min | General Awareness, Mathematics, Reasoning. Check answer key, calculate score and predict rank.',
    badge: 'Active',
    badgeColor: 'bg-indigo-900/50 text-indigo-400 border-indigo-800',
    icon: '🚉',
    color: 'from-indigo-600/20 to-purple-600/20',
    border: 'border-indigo-700/30',
  },
  {
    slug: 'ssc-cgl',
    name: 'SSC CGL',
    year: '2025',
    fullName: 'Staff Selection Commission CGL Tier-I',
    desc: '100 questions | 60 min | GK, English, Math, Reasoning. Free score calculator and rank predictor.',
    badge: 'Coming Soon',
    badgeColor: 'bg-blue-900/50 text-blue-400 border-blue-800',
    icon: '📋',
    color: 'from-blue-600/10 to-indigo-600/10',
    border: 'border-blue-700/30',
  },
  {
    slug: 'ssc-chsl',
    name: 'SSC CHSL',
    year: '2025',
    fullName: 'Staff Selection Commission CHSL Tier-I',
    desc: '100 questions | 60 min | 4 sections. Marks calculator with negative marking.',
    badge: 'Coming Soon',
    badgeColor: 'bg-purple-900/50 text-purple-400 border-purple-800',
    icon: '📋',
    color: 'from-purple-600/10 to-pink-600/10',
    border: 'border-purple-700/30',
  },
  {
    slug: 'rrb-alp',
    name: 'RRB ALP',
    year: '2025',
    fullName: 'Railway Recruitment Board ALP CBT-I',
    desc: '75 questions | 60 min | Math, Science, GK. Score and rank calculator.',
    badge: 'Coming Soon',
    badgeColor: 'bg-teal-900/50 text-teal-400 border-teal-800',
    icon: '🚆',
    color: 'from-teal-600/10 to-cyan-600/10',
    border: 'border-teal-700/30',
  },
  {
    slug: 'bank-po',
    name: 'Bank PO',
    year: '2025',
    fullName: 'IBPS / SBI PO Preliminary Exam',
    desc: '100 questions | 60 min | Quant, Reasoning, English. Answer key calculator.',
    badge: 'Coming Soon',
    badgeColor: 'bg-amber-900/50 text-amber-400 border-amber-800',
    icon: '🏦',
    color: 'from-amber-600/10 to-orange-600/10',
    border: 'border-amber-700/30',
  },
  {
    slug: 'ssc-mts',
    name: 'SSC MTS',
    year: '2025',
    fullName: 'Staff Selection Commission MTS Tier-I',
    desc: '90 questions | 90 min | 4 sections. Marks and rank calculator.',
    badge: 'Coming Soon',
    badgeColor: 'bg-pink-900/50 text-pink-400 border-pink-800',
    icon: '📋',
    color: 'from-pink-600/10 to-rose-600/10',
    border: 'border-pink-700/30',
  },
];

const SITE_URL = 'https://rankveda.in';

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Exams', item: `${SITE_URL}/exams` },
  ]
};

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'All Government Exam Answer Key Calculators',
  itemListElement: EXAMS.map((e, i) => ({
    '@type': 'ListItem', position: i + 1,
    name: `${e.name} ${e.year} - ${e.fullName}`,
    url: `${SITE_URL}/exams/${e.slug}`,
  }))
};

export default function ExamsIndexPage() {
  return (
    <>
      <Head>
        <title>All Exam Answer Key Calculators 2025 | RRB NTPC, SSC CGL, CHSL, Bank PO | RankVeda</title>
        <meta name="description" content="Check answer keys, calculate exact scores and predict rank for RRB NTPC UG, SSC CGL, SSC CHSL, RRB ALP, Bank PO and SSC MTS 2025. Free tool with section-wise analysis and score card download." />
        <meta name="keywords" content="exam answer key calculator 2025, RRB NTPC answer key, SSC CGL answer key, SSC CHSL answer key, RRB ALP answer key, Bank PO answer key, SSC MTS answer key, government exam rank predictor" />
        <link rel="canonical" href={`${SITE_URL}/exams`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="All Exam Answer Key Calculators 2025 | RankVeda" />
        <meta property="og:description" content="Free answer key calculators for RRB NTPC UG, SSC CGL, SSC CHSL, RRB ALP, Bank PO and SSC MTS. Check score, rank and download score card." />
        <meta property="og:url" content={`${SITE_URL}/exams`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-black gradient-text">RankVeda</Link>
            <Link href="/marketplace" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition">Question Bank</Link>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto px-4 py-10">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-gray-500">
              <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
              <li>&#8250;</li>
              <li className="text-indigo-400">Exams</li>
            </ol>
          </nav>

          <h1 className="text-3xl md:text-4xl font-black mb-2">
            Government Exam <span className="gradient-text">Answer Key</span> Calculators
          </h1>
          <p className="text-gray-400 mb-8 max-w-2xl">
            RRB NTPC UG, SSC CGL, SSC CHSL, RRB ALP, Bank PO, SSC MTS — free answer key calculator for all exams. Exact score, live rank, percentile and score card download.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {EXAMS.map((exam, i) => {
              const isActive = exam.badge === 'Active';
              const Wrapper = isActive ? Link : 'div';
              const wrapperProps = isActive ? { href: `/exams/${exam.slug}` } : {};

              return (
                <motion.div key={exam.slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Wrapper {...wrapperProps}>
                    <div className={`bg-gradient-to-br ${exam.color} border ${exam.border} rounded-2xl p-5 transition ${isActive ? 'hover:border-indigo-600/50 cursor-pointer group' : 'opacity-60'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{exam.icon}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${exam.badgeColor}`}>{exam.badge}</span>
                          </div>
                          <h2 className="font-black text-lg text-gray-200 mb-0.5 transition group-hover:text-indigo-400">
                            {exam.name} <span className="text-xs font-normal text-gray-500">{exam.year}</span>
                          </h2>
                          <p className="text-xs text-gray-500 mb-2">{exam.fullName}</p>
                          <p className="text-sm text-gray-400 leading-relaxed">{exam.desc}</p>
                          {isActive && (
                            <div className="mt-3 flex items-center gap-1 text-xs text-indigo-400 font-medium">
                              Check Answer Key <FaArrowRight className="text-xs group-hover:translate-x-1 transition" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Wrapper>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}