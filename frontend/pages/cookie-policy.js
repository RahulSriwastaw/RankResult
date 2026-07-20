import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCookieBite, FaCog, FaChartBar, FaCheckCircle, FaQuestionCircle, FaEnvelope } from 'react-icons/fa';

const SITE_URL = 'https://rankresult.in';
const SITE_NAME = 'RankResult';
const LAST_UPDATED = '15 July 2026';

const cookieTypes = [
  {
    name: 'Essential / Strictly Necessary',
    purpose: 'These cookies are required for the platform to function. They enable authentication, session management, and security features.',
    examples: 'Firebase Auth session tokens, CSRF tokens',
    duration: 'Session / Persistent',
    icon: FaCog,
  },
  {
    name: 'Analytics / Performance',
    purpose: 'These cookies help us understand how visitors interact with our platform by collecting anonymous usage data. We use this data to improve performance and user experience.',
    examples: 'Google Analytics (_ga, _gid, _gat), Vercel Analytics',
    duration: 'Up to 2 years',
    icon: FaChartBar,
  },
  {
    name: 'Functional / Preference',
    purpose: 'These cookies remember your preferences and choices (e.g., dark/light mode) to provide a personalized experience.',
    examples: 'Theme preference, language preference',
    duration: 'Up to 1 year',
    icon: FaCheckCircle,
  },
  {
    name: 'Third-Party Cookies',
    purpose: 'These cookies are set by third-party services we use, such as Razorpay and Stripe for payment processing, and Google for authentication.',
    examples: 'Payment gateway session cookies, Google OAuth cookies',
    duration: 'Varies by provider',
    icon: FaCookieBite,
  },
];

const manageContent = [
  'Most web browsers allow you to control cookies through their settings. You can:',
  '',
  'View cookies stored in your browser.',
  'Delete individual or all cookies.',
  'Block cookies from specific websites.',
  'Set your browser to notify you when a cookie is set.',
  '',
  'Please note that disabling essential cookies may prevent RankResult from functioning properly.',
  '',
  'To manage cookies in your browser:',
  'Chrome: Settings → Privacy and Security → Cookies and other site data',
  'Firefox: Options → Privacy & Security → Cookies and Site Data',
  'Safari: Preferences → Privacy → Cookies and website data',
  'Edge: Settings → Site permissions → Cookies and site data',
];

export default function CookiePolicyPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Cookie Policy', item: `${SITE_URL}/cookie-policy` },
    ],
  };

  return (
    <>
      <Head>
        <title>Cookie Policy | RankResult — How We Use Cookies</title>
        <meta name="description" content="RankResult Cookie Policy explains how and why we use cookies, and how you can manage them." />
        <meta name="keywords" content="RankResult cookie policy, cookies, tracking, Google Analytics, cookie preferences" />
        <link rel="canonical" href={`${SITE_URL}/cookie-policy`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Cookie Policy | RankResult" />
        <meta property="og:description" content="Learn how RankResult uses cookies and how you can control your cookie preferences." />
        <meta property="og:url" content={`${SITE_URL}/cookie-policy`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
        <nav className="border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-black gradient-text">⚡ RankResult</Link>
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition">← Back to Home</Link>
          </div>
        </nav>

        <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-white mb-3">
            Cookie Policy
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm mb-2">
            Last Updated: {LAST_UPDATED}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            This Cookie Policy explains what cookies are, how we use them, and how you can manage them when you visit {SITE_NAME}. By continuing to use our platform, you consent to our use of cookies as described in this policy.
          </motion.p>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-16">
          {/* What are cookies */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center shrink-0 mt-1">
                <FaQuestionCircle className="text-indigo-400 text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-200 mb-3">What Are Cookies?</h2>
                <div className="text-sm text-gray-400 leading-relaxed space-y-1">
                  <p>Cookies are small text files that are placed on your device (computer, tablet, smartphone) when you visit a website. They are widely used to make websites work efficiently and provide useful information to website owners.</p>
                  <p>Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (remain on your device for a set period).</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Cookie Types */}
          <h2 className="text-xl font-bold text-gray-200 mb-6">Cookies We Use</h2>
          <div className="space-y-4 mb-8">
            {cookieTypes.map(({ name, purpose, examples, duration, icon: Icon }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center shrink-0 mt-1">
                    <Icon className="text-indigo-400 text-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-200 mb-2">{name}</h3>
                    <div className="text-sm text-gray-400 leading-relaxed space-y-1">
                      <p><span className="text-gray-500">Purpose:</span> {purpose}</p>
                      <p><span className="text-gray-500">Examples:</span> {examples}</p>
                      <p><span className="text-gray-500">Duration:</span> {duration}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Manage Cookies */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center shrink-0 mt-1">
                <FaCog className="text-indigo-400 text-lg" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-200 mb-3">How to Manage Cookies</h2>
                <div className="text-sm text-gray-400 leading-relaxed space-y-1">
                  {manageContent.map((line, j) => {
                    if (line === '') return <br key={j} />;
                    if (line.includes(':') && !line.startsWith(' ')) return <p key={j}><span className="text-gray-300">{line.split(':')[0]}:</span>{line.substring(line.indexOf(':') + 1)}</p>;
                    return <p key={j}>{line}</p>;
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Updates & Contact */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center shrink-0 mt-1">
                <FaEnvelope className="text-indigo-400 text-lg" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-200 mb-3">Updates & Contact</h2>
                <div className="text-sm text-gray-400 leading-relaxed space-y-1">
                  <p>We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.</p>
                  <br />
                  <p>If you have any questions about our use of cookies, please contact us:</p>
                  <p>Email: support@rankresult.in</p>
                </div>
              </div>
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
