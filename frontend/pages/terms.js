import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaGavel, FaUserCheck, FaCreditCard, FaBan, FaCopyright, FaExclamationTriangle, FaBalanceScale } from 'react-icons/fa';

const SITE_URL = 'https://rankresult.in';
const SITE_NAME = 'RankResult';
const LAST_UPDATED = '15 July 2026';

const sections = [
  {
    icon: FaGavel,
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using RankResult ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, you must not use our services.',
      'These terms constitute a binding legal agreement between you ("User") and RankResult Technologies ("Company", "we", "us", "our").',
      'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the Platform after changes constitutes acceptance of the modified terms.',
    ],
  },
  {
    icon: FaUserCheck,
    title: '2. Eligibility & Registration',
    content: [
      'You must be at least 13 years of age to use this Platform. Users under 18 must have parental/guardian consent.',
      'You agree to provide accurate, current, and complete information during registration.',
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'We reserve the right to suspend or terminate accounts found to be using false identities or engaging in fraudulent activity.',
      'Each user may maintain only one account. Multiple accounts created by the same individual may be terminated without notice.',
    ],
  },
  {
    icon: FaBalanceScale,
    title: '3. Services Description',
    content: [
      'RankResult provides the following services:',
      '',
      'Exam Answer Key Analysis: Users can paste digialm.com response sheet URLs to calculate scores with negative marking, section-wise analysis, rank prediction, and percentile calculation.',
      'Score Card Download: Users can download their score analysis as PNG or PDF.',
      'AI-Powered Solutions: Users can unlock AI-generated explanations for incorrect questions using platform points.',
      'Question Bank / Marketplace: Users can purchase points packs or exam packs to access question banks.',
      'B2B Marks Analysis: Coaching centers can track student marks through a dedicated portal.',
      '',
      'All scores, ranks, and percentiles provided are ESTIMATES and are NOT official. Final results are published solely by the respective recruitment boards.',
    ],
  },
  {
    icon: FaCreditCard,
    title: '4. Payments & Refunds',
    content: [
      'All payments are processed through Razorpay (India) and Stripe (International).',
      'Purchased points packs and exam packs are non-transferable.',
      'Refunds are governed by our Refund & Cancellation Policy.',
      'We reserve the right to modify pricing at any time. Price changes do not affect previously purchased items.',
      'Any fraudulent transaction activity will result in immediate account suspension and legal action.',
      'Taxes (GST, etc.) are applied as per applicable Indian laws.',
    ],
  },
  {
    icon: FaCopyright,
    title: '5. Intellectual Property Rights',
    content: [
      'All content on RankResult, including but not limited to text, graphics, logos, icons, software, databases, and code, is the property of RankResult Technologies or its content suppliers and is protected by Indian Copyright Act, 1957 and international copyright laws.',
      'Users retain ownership of the response sheet data they submit. By submitting data, you grant us a non-exclusive, royalty-free license to process and display it for the purpose of providing our services.',
      'You may not reproduce, distribute, modify, create derivative works from, or exploit any content from RankResult without prior written permission.',
      'The name "RankResult", its logo, and branding are trademarks of RankResult Technologies.',
    ],
  },
  {
    icon: FaBan,
    title: '6. Prohibited Activities',
    content: [
      'You agree NOT to:',
      '',
      'Use the Platform for any unlawful purpose or in violation of any applicable laws (Indian IT Act, 2000; IPC, etc.).',
      'Attempt to hack, reverse engineer, or disrupt the Platform\'s functionality.',
      'Scrape, crawl, or extract data from the Platform without explicit permission.',
      'Submit false or manipulated response sheet data.',
      'Create automated scripts, bots, or software to interact with the Platform.',
      'Impersonate any person or entity or misrepresent your affiliation.',
      'Upload or transmit viruses, malware, or any malicious code.',
      'Engage in any activity that interferes with other users\' access to the Platform.',
      'Use the Platform for competitive analysis or to build a competing product.',
      'Violation of these provisions may result in immediate account termination and legal prosecution.',
    ],
  },
  {
    icon: FaExclamationTriangle,
    title: '7. Disclaimer of Warranties',
    content: [
      'THE PLATFORM AND ALL SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.',
      'We do not warrant that:',
      '',
      'The Platform will be uninterrupted, timely, secure, or error-free.',
      'The results or scores calculated are accurate (they are estimates only).',
      'The quality of any products, services, or information obtained will meet your expectations.',
      'Any errors in the Platform will be corrected.',
      '',
      'We expressly disclaim all warranties, including but not limited to merchantability, fitness for a particular purpose, and non-infringement.',
    ],
  },
  {
    icon: FaExclamationTriangle,
    title: '8. Limitation of Liability',
    content: [
      'To the maximum extent permitted by applicable law, RankResult Technologies, its directors, employees, partners, and affiliates shall NOT be liable for:',
      '',
      'Any indirect, incidental, special, consequential, or punitive damages.',
      'Any loss of profits, data, use, goodwill, or other intangible losses.',
      'Any damages arising from your use of or inability to use the Platform.',
      'Any damages arising from inaccurate score calculations or rank predictions.',
      'Any unauthorized access to or alteration of your transmissions or data.',
      'Our total liability for any claim shall not exceed the amount you have paid us in the 12 months preceding the claim.',
      'This limitation of liability applies regardless of the legal theory on which the claim is based.',
    ],
  },
  {
    icon: FaBalanceScale,
    title: '9. Indemnification',
    content: [
      'You agree to indemnify, defend, and hold harmless RankResult Technologies, its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorney fees) arising from:',
      '',
      'Your use of the Platform in violation of these Terms.',
      'Your violation of any applicable law or regulation.',
      'Your violation of any third-party rights, including intellectual property rights.',
      'Any content or data you submit to the Platform.',
    ],
  },
  {
    icon: FaGavel,
    title: '10. Governing Law & Jurisdiction',
    content: [
      'These Terms shall be governed by and construed in accordance with the laws of India.',
      'Any disputes arising out of or relating to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.',
      'We may seek injunctive or other equitable relief in any court of competent jurisdiction to protect our intellectual property rights.',
    ],
  },
  {
    icon: FaGavel,
    title: '11. Dispute Resolution',
    content: [
      'Before initiating any legal proceedings, you agree to first attempt to resolve the dispute informally by contacting us at support@rankresult.in.',
      'If the dispute cannot be resolved within 30 days, it shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996.',
      'The arbitration shall be conducted in New Delhi, India, by a sole arbitrator appointed by mutual agreement.',
      'The language of arbitration shall be English.',
      'The arbitration award shall be final and binding on both parties.',
    ],
  },
  {
    icon: FaGavel,
    title: '12. Termination',
    content: [
      'We may terminate or suspend your account and access to the Platform immediately, without prior notice or liability, if:',
      '',
      'You violate any provision of these Terms.',
      'You engage in fraudulent or illegal activities.',
      'We are required to do so by law.',
      'We decide to discontinue the Platform (with reasonable notice).',
      '',
      'Upon termination, your right to use the Platform ceases immediately. Sections 5, 7, 8, 9, and 10 shall survive termination.',
    ],
  },
  {
    icon: FaGavel,
    title: '13. Entire Agreement',
    content: [
      'These Terms constitute the entire agreement between you and RankResult Technologies regarding your use of the Platform and supersede any prior agreements or understandings.',
      'If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.',
      'Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision.',
    ],
  },
  {
    icon: FaEnvelope,
    title: '14. Contact Information',
    content: [
      'For any questions, concerns, or notices regarding these Terms, please contact us:',
      '',
      'Email: support@rankresult.in',
      'Grievance Officer: grievance@rankresult.in',
      'Website: rankresult.in',
    ],
  },
];

import { FaEnvelope } from 'react-icons/fa';

export default function TermsPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: `${SITE_URL}/terms` },
    ],
  };

  return (
    <>
      <Head>
        <title>Terms & Conditions | RankResult</title>
        <meta name="description" content="RankResult Terms & Conditions governing your use of our exam score calculator, rank predictor, and question bank platform." />
        <meta name="keywords" content="RankResult terms, terms of service, conditions of use, exam platform terms" />
        <link rel="canonical" href={`${SITE_URL}/terms`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Terms & Conditions | RankResult" />
        <meta property="og:description" content="Terms and conditions governing the use of RankResult exam analysis platform." />
        <meta property="og:url" content={`${SITE_URL}/terms`} />
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
            Terms & Conditions
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm mb-2">
            Last Updated: {LAST_UPDATED}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            Welcome to {SITE_NAME}. By accessing or using our platform, you agree to be bound by these Terms & Conditions. Please read them carefully before using our services. These terms are governed by the laws of India.
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
