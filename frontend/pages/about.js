import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaLightbulb, FaUsers, FaShieldAlt, FaRocket, FaHandshake, FaHeart } from 'react-icons/fa';

const SITE_URL = 'https://rankveda.in';
const SITE_NAME = 'RankVeda';

const values = [
  { icon: FaLightbulb, title: 'Innovation', desc: 'We leverage AI and modern technology to provide instant, accurate exam score analysis — a first-of-its-kind free platform for Indian government exam aspirants.' },
  { icon: FaShieldAlt, title: 'Transparency', desc: 'Every score calculation is explained step-by-step. No hidden logic. You see exactly how your marks, rank, and percentile are computed.' },
  { icon: FaUsers, title: 'Accessibility', desc: 'Our platform is completely free for basic usage. We believe every aspirant deserves access to instant score analysis without financial barriers.' },
  { icon: FaRocket, title: 'Speed', desc: 'Get your complete score analysis, rank prediction, and downloadable score card within seconds of pasting your response sheet URL.' },
  { icon: FaHandshake, title: 'Integrity', desc: 'We clearly state that our scores are unofficial estimates. Users are always directed to official exam boards for final results.' },
  { icon: FaHeart, title: 'Community First', desc: 'We build features based on aspirant feedback. Our platform evolves with the needs of the competitive exam community.' },
];

const team = [
  { name: 'Rahul Sriwastaw', role: 'Founder & Developer', desc: 'Building RankVeda with a mission to help millions of government exam aspirants check their scores instantly and plan their next steps.' },
];

export default function AboutPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'About Us', item: `${SITE_URL}/about` },
    ],
  };

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'India\'s free platform for government exam answer key calculation, rank prediction, and score card download.',
    foundingDate: '2025',
    founder: { '@type': 'Person', name: 'Rahul Sriwastaw' },
  };

  return (
    <>
      <Head>
        <title>About Us | RankVeda — Mission, Vision & Team</title>
        <meta name="description" content="Learn about RankVeda — India's free platform for government exam answer key calculation, rank prediction, and score card download. Our mission, values, and team." />
        <meta name="keywords" content="RankVeda about, mission, team, exam score calculator, India, rank predictor" />
        <link rel="canonical" href={`${SITE_URL}/about`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="About Us | RankVeda" />
        <meta property="og:description" content="RankVeda helps millions of government exam aspirants calculate scores, predict ranks, and download score cards — all for free." />
        <meta property="og:url" content={`${SITE_URL}/about`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }} />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
        <nav className="border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-black gradient-text">⚡ RankVeda</Link>
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition">← Back to Home</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-white mb-3">
            About RankVeda
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            India's first free platform dedicated to helping government exam aspirants instantly calculate their exam scores, predict ranks, and download professional score cards — all from a single response sheet URL.
          </motion.p>
        </section>

        {/* MISSION */}
        <section className="max-w-4xl mx-auto px-4 pb-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-200 mb-3">Our Mission</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Every year, millions of candidates appear for government exams in India — RRB NTPC, SSC CGL, SSC CHSL, RRB ALP, Bank PO, and many more. After each exam, aspirants wait weeks or months for official results, often in anxiety and uncertainty.
            </p>
            <br />
            <p className="text-sm text-gray-400 leading-relaxed">
              RankVeda was created to change that. Our mission is to provide every exam aspirant with <strong className="text-gray-300">instant, accurate, and free</strong> score analysis so they can assess their performance, plan their next steps, and reduce the stress of waiting.
            </p>
            <br />
            <p className="text-sm text-gray-400 leading-relaxed">
              Beyond score calculation, we are building a comprehensive ecosystem — including AI-powered solutions, question banks, and performance analytics — to empower every aspirant on their journey to success.
            </p>
          </motion.div>

          {/* WHY */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-200 mb-3">Why "RankVeda"?</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              "Veda" means knowledge in Sanskrit. RankVeda = Knowledge of your Rank. We believe that every aspirant deserves the knowledge of where they stand — not in weeks, but in seconds.
            </p>
          </motion.div>

          {/* VALUES */}
          <h2 className="text-xl font-bold text-gray-200 mb-6 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
                <Icon className="text-indigo-400 text-xl mb-3" />
                <h3 className="font-bold text-gray-200 text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* TEAM */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-200 mb-6 text-center">Our Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map(({ name, role, desc }, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl mb-3">
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-bold text-gray-200 text-sm">{name}</h3>
                  <p className="text-xs text-indigo-400 mb-2">{role}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <footer className="border-t border-gray-800 py-8 px-4">
          <div className="max-w-7xl mx-auto text-center text-xs text-gray-700">
            <p>© {new Date().getFullYear()} {SITE_NAME}.in — All Rights Reserved</p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              <Link href="/privacy" className="hover:text-gray-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-400 transition">Terms of Service</Link>
              <Link href="/disclaimer" className="hover:text-gray-400 transition">Disclaimer</Link>
              <Link href="/cookie-policy" className="hover:text-gray-400 transition">Cookie Policy</Link>
              <Link href="/refund-policy" className="hover:text-gray-400 transition">Refund Policy</Link>
              <Link href="/contact" className="hover:text-gray-400 transition">Contact Us</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
