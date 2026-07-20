import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaUserSecret, FaCookie, FaEnvelope, FaDatabase } from 'react-icons/fa';

const SITE_URL = 'https://rankresult.in';
const SITE_NAME = 'RankResult';
const CONTACT_EMAIL = 'support@rankresult.in';
const LAST_UPDATED = '15 July 2026';

const sections = [
  {
    icon: FaShieldAlt,
    title: '1. Information We Collect',
    content: [
      'We collect the following types of information when you use RankResult:',
      '',
      'Personal Information: When you register or log in via email or Google OAuth, we collect your name, email address, and profile picture (if provided by Google). This information is stored securely using Firebase Authentication.',
      '',
      'Usage Data: We automatically collect certain information when you visit our platform, including your IP address, browser type, device type, operating system, referring URLs, and pages visited. This data is collected via Google Analytics and Vercel Analytics to improve our services.',
      '',
      'Exam Data: When you paste a digialm.com response sheet URL, we temporarily process the data from that URL to calculate your score. We do NOT permanently store individual answer keys unless you explicitly choose to save them.',
      '',
      'Payment Data: When you make purchases via Razorpay or Stripe, we collect transaction IDs, order details, and payment status. We do NOT store your credit/debit card numbers, UPI IDs, or bank account details. All payment processing is handled securely by Razorpay and Stripe.',
      '',
      'Communication Data: If you contact us via email or support forms, we retain your messages and contact information to address your queries.',
    ],
  },
  {
    icon: FaDatabase,
    title: '2. How We Use Your Information',
    content: [
      'We use the collected information for the following purposes:',
      '',
      'To provide and maintain our exam score calculation and rank prediction services.',
      'To process your transactions and manage your account, points, and purchases.',
      'To send you transactional emails (payment confirmations, password resets).',
      'To improve our platform based on usage patterns and user feedback.',
      'To detect, prevent, and address technical issues, fraud, or abuse.',
      'To comply with legal obligations under Indian IT Act, 2000 and Digital Personal Data Protection Act, 2023.',
      'We DO NOT sell, rent, or trade your personal information to third parties.',
    ],
  },
  {
    icon: FaCookie,
    title: '3. Cookies & Tracking Technologies',
    content: [
      'We use cookies and similar tracking technologies to enhance your experience. These include:',
      '',
      'Essential Cookies: Required for authentication and basic platform functionality.',
      'Analytics Cookies: Google Analytics cookies to understand how users interact with our site.',
      'Preference Cookies: To remember your theme preferences (dark/light mode).',
      '',
      'You can control cookies through your browser settings. Disabling certain cookies may affect platform functionality.',
      'We also use Firebase Local Storage for session management and authentication persistence.',
      'For more details, see our Cookie Policy.',
    ],
  },
  {
    icon: FaUserSecret,
    title: '4. Data Sharing & Third Parties',
    content: [
      'We share your information only with trusted third-party service providers who help us operate our platform:',
      '',
      'Firebase (Google) — Authentication and user data storage.',
      'Vercel — Hosting and platform analytics.',
      'Google Analytics — Usage analytics and traffic monitoring.',
      'Razorpay — Payment processing for Indian transactions.',
      'Stripe — Payment processing for international transactions.',
      'OpenAI — AI-powered solution explanations (only processed text, no personal data).',
      '',
      'All third-party providers are contractually bound to protect your data and use it solely for the purposes we specify.',
      'We may disclose your information if required by law, court order, or government regulation under the Indian IT Act, 2000.',
    ],
  },
  {
    icon: FaLock,
    title: '5. Data Security',
    content: [
      'We implement industry-standard security measures to protect your data:',
      '',
      'SSL/TLS encryption (HTTPS) for all data transmitted between your browser and our servers.',
      'Firebase Authentication with encrypted password hashing.',
      'Regular security audits and monitoring.',
      'Access controls — only essential personnel have access to user data.',
      'Secure API endpoints with rate limiting and input validation.',
      '',
      'However, no method of electronic storage is 100% secure. We cannot guarantee absolute security but will notify users within 72 hours of any confirmed data breach as required by Indian DPDP Act, 2023.',
    ],
  },
  {
    icon: FaEnvelope,
    title: '6. Your Rights',
    content: [
      'Under the Digital Personal Data Protection Act, 2023 (India), GDPR (EU), and CCPA (California), you have the following rights:',
      '',
      'Right to Access — Request a copy of your personal data we hold.',
      'Right to Correction — Request correction of inaccurate or incomplete data.',
      'Right to Deletion — Request deletion of your account and associated data (Right to be Forgotten).',
      'Right to Restrict Processing — Request limitation on how we use your data.',
      'Right to Data Portability — Request your data in a structured, machine-readable format.',
      'Right to Withdraw Consent — Withdraw consent at any time without affecting the lawfulness of prior processing.',
      'Right to Grievance Redressal — File a complaint with us or the relevant data protection authority.',
      '',
      'To exercise any of these rights, email us at CONTACT_EMAIL with the subject "Data Request — [Your Email]". We will respond within 30 days.',
    ],
  },
  {
    icon: FaDatabase,
    title: '7. Data Retention',
    content: [
      'We retain your personal data only as long as necessary:',
      '',
      'Account data: Retained until you delete your account or for 3 years of inactivity.',
      'Transaction data: Retained for 7 years as required by Indian tax laws.',
      'Usage analytics: Retained for 26 months (per Google Analytics policy).',
      'Communication records: Retained for 2 years after the last interaction.',
      '',
      'After the retention period, data is securely deleted or anonymized.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: '8. Third-Party Links',
    content: [
      'Our platform may contain links to third-party websites (e.g., digialm.com for exam response sheets). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before submitting any personal information.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: '9. Children\'s Privacy',
    content: [
      'RankResult is not intended for users under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child under 13 has provided us with personal data, we will delete it immediately. If you are a parent or guardian and believe your child has provided us with data, please contact us.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: '10. Grievance Officer (As per IT Act, 2000)',
    content: [
      'In compliance with the Information Technology Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, we have appointed a Grievance Officer:',
      '',
      'Name: Rahul Sriwastaw',
      'Email: grievance@rankresult.in',
      'Address: RankResult Technologies, India',
      '',
      'Any complaints or concerns regarding data privacy or platform usage may be addressed to the Grievance Officer. We will acknowledge receipt of any complaint within 24 hours and resolve it within 30 days.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: '11. Changes to This Privacy Policy',
    content: [
      'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Material changes will be notified via email or a prominent notice on our platform. Your continued use of RankResult after changes constitutes acceptance of the updated policy.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: '12. Contact Us',
    content: [
      'If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:',
      '',
      'Email: support@rankresult.in',
      'Grievance Officer: grievance@rankresult.in',
      'Website: rankresult.in',
    ],
  },
];

export default function PrivacyPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${SITE_URL}/privacy` },
    ],
  };

  return (
    <>
      <Head>
        <title>Privacy Policy | RankResult — Your Data, Your Rights</title>
        <meta name="description" content="RankResult Privacy Policy explains how we collect, use, and protect your personal data in compliance with DPDP Act 2023, IT Act 2000, GDPR, and CCPA." />
        <meta name="keywords" content="RankResult privacy policy, data protection, DPDP Act 2023, IT Act 2000, GDPR, CCPA, privacy, data security" />
        <link rel="canonical" href={`${SITE_URL}/privacy`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Privacy Policy | RankResult" />
        <meta property="og:description" content="How RankResult protects your personal data in compliance with Indian and international privacy laws." />
        <meta property="og:url" content={`${SITE_URL}/privacy`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-gray-300">
        {/* NAV */}
        <nav className="border-b border-gray-800 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-black gradient-text">⚡ RankResult</Link>
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition">← Back to Home</Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-black text-white mb-3">
            Privacy Policy
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm mb-2">
            Last Updated: {LAST_UPDATED}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            This Privacy Policy describes how {SITE_NAME} ("we", "us", or "our") collects, uses, stores, and protects your personal information when you use our website and services. We are committed to safeguarding your privacy in compliance with the <strong className="text-gray-300">Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, <strong className="text-gray-300">Information Technology Act, 2000 (IT Act)</strong>, <strong className="text-gray-300">General Data Protection Regulation (GDPR)</strong>, and the <strong className="text-gray-300">California Consumer Privacy Act (CCPA)</strong>.
          </motion.p>
        </section>

        {/* CONTENT */}
        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="space-y-8">
            {sections.map(({ icon: Icon, title, content }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center shrink-0 mt-1">
                    <Icon className="text-indigo-400 text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-200 mb-3">{title}</h2>
                    <div className="text-sm text-gray-400 leading-relaxed space-y-1">
                      {content.map((line, j) => {
                        if (line.startsWith('Name:') || line.startsWith('Email:') || line.startsWith('Address:') || line.startsWith('Website:')) {
                          return <p key={j} className="text-gray-300"><span className="text-gray-500">{line.split(':')[0]}:</span>{line.includes(':') ? line.substring(line.indexOf(':') + 1) : ''}</p>;
                        }
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

        {/* FOOTER */}
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
