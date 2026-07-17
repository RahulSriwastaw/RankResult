import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaLock, FaBookOpen } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Logo from '../../components/Logo';

const SITE_URL = 'https://rankveda.in';

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Exams', item: `${SITE_URL}/exams` },
  ],
};

export default function ExamsIndexPage({ exams = [] }) {
  const activeExams = exams.filter((e) => e.status === 'active');
  const upcomingExams = exams.filter((e) => e.status === 'coming-soon');

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'All Government Exam Answer Key Calculators — RankVeda',
    itemListElement: exams.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${e.name} ${e.year || '2025'} Answer Key — ${e.full_name}`,
      url: `${SITE_URL}/exams/${e.slug}`,
    })),
  };

  return (
    <>
      <Head>
        <title>All Exam Answer Key Calculators 2025 | RRB NTPC, SSC CGL, CHSL, Bank PO | RankVeda</title>
        <meta
          name="description"
          content="Check answer keys, calculate exact scores and predict rank for RRB NTPC UG, NTPC CBT-II, SSC CGL, SSC CHSL, RRB ALP, IBPS PO and SSC MTS 2025. Free tool with section-wise analysis and score card download."
        />
        <meta
          name="keywords"
          content="exam answer key calculator 2025, RRB NTPC answer key, NTPC CBT-II answer key, SSC CGL answer key, SSC CHSL answer key, RRB ALP answer key, IBPS PO answer key, SSC MTS answer key, government exam rank predictor"
        />
        <link rel="canonical" href={`${SITE_URL}/exams`} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
        <meta name="author" content="RankVeda" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="All Exam Answer Key Calculators 2025 | RankVeda" />
        <meta
          property="og:description"
          content="Free answer key calculators for RRB NTPC, SSC CGL, SSC CHSL, RRB ALP, IBPS PO and SSC MTS. Check score, rank and download score card."
        />
        <meta property="og:url" content={`${SITE_URL}/exams`} />
        <meta property="og:site_name" content="RankVeda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="All Exam Answer Key Calculators 2025 | RankVeda" />
        <meta name="twitter:site" content="@RankVedaIn" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

        {/* Navbar */}
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-10">

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              <li><Link href="/" className="hover:text-indigo-600">Home</Link></li>
              <li className="text-slate-300">›</li>
              <li className="text-indigo-600">Exams</li>
            </ol>
          </nav>

          {/* Page header */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 tracking-tight mb-2">
            Government Exam <span className="text-indigo-600">Answer Key</span> Calculators
          </h1>
          <p className="text-slate-500 mb-10 max-w-2xl text-xs md:text-sm leading-relaxed">
            RRB NTPC UG, NTPC CBT-II, SSC CGL, SSC CHSL, RRB ALP, IBPS PO, SSC MTS — free answer key calculator
            for all exams. Exact score with negative marking, live rank, percentile &amp; score card download.
          </p>

          {/* Active exams */}
          {activeExams.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeExams.map((exam, i) => {
                  const badgeText = exam.badge || 'Active';
                  const descText = exam.desc_card || exam.description || '';
                  const examIcon = exam.icon || '📋';
                  const examYear = exam.year || '2025';
                  
                  return (
                    <motion.div
                      key={exam.slug || exam.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={`/exams/${exam.slug}`} className="block group h-full">
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col h-full">
                          
                          {/* Top Row: Icon + Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl">
                              {examIcon}
                            </div>
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
                              {badgeText}
                            </span>
                          </div>

                          {/* Exam Info */}
                          <h3 className="font-extrabold text-indigo-950 text-lg mb-1 group-hover:text-indigo-600 transition">
                            {exam.name} <span className="text-xs font-bold text-indigo-400">{examYear}</span>
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-400 mb-2">{exam.full_name}</p>
                          <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-grow">{descText}</p>

                          {/* Action Button */}
                          <div className="border-t border-slate-100 pt-4 mt-auto">
                            <div className="flex items-center justify-between text-xs text-indigo-600 font-bold group-hover:text-indigo-500 transition">
                              <span>Check Answer Key</span>
                              <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition" />
                            </div>
                          </div>

                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coming Soon exams */}
          {upcomingExams.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <h2 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Coming Soon</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingExams.map((exam, i) => {
                  const badgeText = exam.badge || 'Coming Soon';
                  const descText = exam.desc_card || exam.description || '';
                  const examIcon = exam.icon || '📋';
                  const examYear = exam.year || '2025';

                  return (
                    <motion.div
                      key={exam.slug || exam.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}
                    >
                      <div className="bg-white/60 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative flex flex-col h-full opacity-70">
                        
                        {/* Top Row: Icon + Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center text-2xl">
                            {examIcon}
                          </div>
                          <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border bg-orange-55/20 text-orange-500 border-orange-200">
                            {badgeText}
                          </span>
                        </div>

                        {/* Exam Info */}
                        <h3 className="font-extrabold text-slate-700 text-lg mb-1">
                          {exam.name} <span className="text-xs font-bold text-slate-400">{examYear}</span>
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-400 mb-2">{exam.full_name}</p>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-grow">{descText}</p>

                        {/* Lock Button */}
                        <div className="border-t border-slate-100 pt-4 mt-auto">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                            <FaLock className="text-[10px]" />
                            <span>Available soon</span>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 px-4 mt-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
              <div>
                <div className="mb-2"><Logo size="sm" /></div>
                <p className="text-[10px] text-slate-500 mt-1">
                  India's leading unofficial answer key calculator &amp; rank predictor portal.
                </p>
              </div>
              <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <Link href="/exams" className="text-white">Exams</Link>
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