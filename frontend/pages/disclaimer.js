import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaExclamationTriangle, FaChartLine, FaFileAlt, FaLink, FaShieldAlt, FaGavel } from 'react-icons/fa';

const SITE_URL = 'https://rankveda.in';
const SITE_NAME = 'RankVeda';
const LAST_UPDATED = '15 July 2026';

const sections = [
  {
    icon: FaExclamationTriangle,
    title: 'General Disclaimer',
    content: [
      'The information and services provided on RankVeda are for general informational purposes only. All score calculations, rank predictions, and percentile estimates are UNOFFICIAL and should NOT be treated as final or authoritative.',
      'RankVeda Technologies makes no representations or warranties of any kind, express or implied, regarding the accuracy, reliability, or completeness of any score, rank, or percentile displayed on this platform.',
      'The final answer keys, results, and merit lists are published exclusively by the respective recruitment boards, testing agencies, and government authorities. Users must refer to the official websites for authentic results.',
    ],
  },
  {
    icon: FaChartLine,
    title: 'Score & Rank Disclaimer',
    content: [
      'All scores calculated through RankVeda are based on:',
      '',
      'The candidate\'s responses as displayed on digialm.com or similar portals.',
      'The official or provisional answer keys published by the respective exam conducting bodies.',
      'Standard negative marking patterns as specified in the official exam notification.',
      '',
      'PLEASE NOTE:',
      'The calculated score may differ from your actual score due to:',
      'Changes in the official answer key after re-evaluation or challenge process.',
      'Discrepancies between provisional and final answer keys.',
      'Human error in data entry or parsing of response sheets.',
      'Variations in negative marking application by the exam conducting body.',
      '',
      'Rank predictions and percentile calculations are ESTIMATES based on available data and should not be considered as your final rank or percentile.',
    ],
  },
  {
    icon: FaLink,
    title: 'External Links Disclaimer',
    content: [
      'RankVeda may contain links to third-party websites, including digialm.com, exam conducting body portals, and payment gateways. These links are provided for your convenience only.',
      'We have no control over the content, privacy practices, or accuracy of information on external sites. We do not endorse, guarantee, or assume responsibility for any third-party website or its content.',
      'Your use of any third-party website is subject to their respective terms and privacy policies.',
    ],
  },
  {
    icon: FaFileAlt,
    title: 'Accuracy Disclaimer',
    content: [
      'While we strive to ensure that all information on RankVeda is accurate and up-to-date, we make no guarantees regarding:',
      '',
      'The completeness or timeliness of exam data, answer keys, or exam patterns.',
      'The availability or uninterrupted access to our platform.',
      'The absence of technical errors, bugs, or vulnerabilities.',
      'The compatibility of our platform with all devices, browsers, or operating systems.',
      '',
      'We reserve the right to modify, suspend, or discontinue any aspect of our services at any time without notice.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: 'No Professional Advice',
    content: [
      'The content on RankVeda is not intended to be a substitute for professional advice, including legal, financial, or career counseling. You should consult with qualified professionals for advice specific to your situation.',
      'RankVeda does not provide any guarantee of exam qualification, job placement, or career advancement.',
    ],
  },
  {
    icon: FaGavel,
    title: 'Legal Compliance',
    content: [
      'This disclaimer is governed by the laws of India. Any disputes arising from the use of this platform shall be subject to the jurisdiction of courts in New Delhi.',
      'If any provision of this disclaimer is found to be unenforceable or invalid, the remaining provisions shall continue to apply.',
    ],
  },
];

export default function DisclaimerPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Disclaimer', item: `${SITE_URL}/disclaimer` },
    ],
  };

  return (
    <>
      <Head>
        <title>Disclaimer | RankVeda — Unofficial Score Estimates</title>
        <meta name="description" content="RankVeda Disclaimer: All scores, ranks, and percentiles are unofficial estimates. Refer to official exam boards for final results." />
        <meta name="keywords" content="RankVeda disclaimer, unofficial scores, rank estimate, exam disclaimer" />
        <link rel="canonical" href={`${SITE_URL}/disclaimer`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Disclaimer | RankVeda" />
        <meta property="og:description" content="Important disclaimer about the unofficial nature of score calculations and rank predictions on RankVeda." />
        <meta property="og:url" content={`${SITE_URL}/disclaimer`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
        <nav className="border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-black gradient-text">⚡ RankVeda</Link>
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition">← Back to Home</Link>
          </div>
        </nav>

        <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-white mb-3">
            Disclaimer
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm mb-2">
            Last Updated: {LAST_UPDATED}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            Please read this disclaimer carefully before using {SITE_NAME}. By using our platform, you acknowledge and agree to the terms stated herein.
          </motion.p>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="space-y-6">
            {sections.map(({ icon: Icon, title, content }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-900/40 border border-amber-800/30 flex items-center justify-center shrink-0 mt-1">
                    <Icon className="text-amber-400 text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-200 mb-3">{title}</h2>
                    <div className="text-sm text-gray-400 leading-relaxed space-y-1">
                      {content.map((line, j) => {
                        if (line === '') return <br key={j} />;
                        return <p key={j}>{line}</p>;
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
