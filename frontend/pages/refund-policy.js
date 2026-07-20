import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaUndoAlt, FaCreditCard, FaExclamationTriangle, FaEnvelope, FaCheckCircle } from 'react-icons/fa';

const SITE_URL = 'https://rankresult.in';
const SITE_NAME = 'RankResult';
const LAST_UPDATED = '15 July 2026';

const sections = [
  {
    icon: FaMoneyBillWave,
    title: 'Overview',
    content: [
      'This Refund & Cancellation Policy governs all purchases made on RankResult, including points packs, exam packs, and question bank access.',
      'By making a purchase on our platform, you agree to the terms of this policy.',
      'Since we deal in digital goods and services (virtual points, access to digital content), our refund policy is limited as described below.',
    ],
  },
  {
    icon: FaCheckCircle,
    title: '2. Eligible Refunds',
    content: [
      'Refunds may be issued in the following cases:',
      '',
      'Technical Error: If you purchased a pack but did not receive the points or access due to a technical error on our end, a full refund will be issued.',
      'Duplicate Payment: If you were charged multiple times for the same transaction due to a payment gateway error, we will refund the duplicate amount.',
      'Service Unavailable: If our platform is unavailable for more than 72 continuous hours within 7 days of your purchase and you have not used the purchased item.',
      'Fraudulent Transaction: If a transaction is identified as fraudulent and proven, the legitimate purchaser will receive a full refund.',
    ],
  },
  {
    icon: FaUndoAlt,
    title: '3. Non-Refundable Items',
    content: [
      'The following are STRICTLY NON-REFUNDABLE:',
      '',
      'Points that have been used or partially used to unlock AI solutions or access content.',
      'Exam packs that have been accessed or viewed.',
      'Purchases made more than 7 days ago.',
      'Change of mind or accidental purchase (since digital goods are delivered instantly).',
      'Incorrect exam selection (please verify the exam name before purchase).',
      'Dissatisfaction with score calculation results (scores are unofficial estimates).',
      'Account suspension or termination due to violation of Terms of Service.',
    ],
  },
  {
    icon: FaCreditCard,
    title: '4. Refund Process',
    content: [
      'To request a refund:',
      '',
      'Email us at support@rankresult.in with the subject "Refund Request — [Order ID]" within 7 days of purchase.',
      'Include your registered email address, order ID, payment transaction ID, and detailed reason for the refund request.',
      'Our team will review your request and respond within 5-7 business days.',
      'If approved, refunds will be processed within 7-10 business days to the original payment method.',
      '',
      'Please note:',
      'Refunds for Razorpay payments will be credited to the original payment source (bank account, UPI, card, or wallet).',
      'Refunds for Stripe payments will be credited to the original card or payment method.',
      'International transactions may take longer due to banking procedures.',
      'Any transaction charges, gateway fees, or GST paid are non-refundable.',
    ],
  },
  {
    icon: FaExclamationTriangle,
    title: '5. Cancellation Policy',
    content: [
      'Since digital goods are delivered instantly upon successful payment, orders CANNOT be cancelled once the payment is confirmed.',
      'If you have not yet used the purchased points or accessed the content, we may, at our sole discretion, consider a cancellation request. However, this is not guaranteed.',
      'To request cancellation, contact us immediately at support@rankresult.in with your order details.',
    ],
  },
  {
    icon: FaMoneyBillWave,
    title: '6. Chargebacks',
    content: [
      'If you initiate a chargeback with your bank or payment provider without first contacting us, your account will be immediately suspended.',
      'We will provide all transaction evidence to the payment processor to contest fraudulent chargebacks.',
      'Users who abuse the chargeback process may be permanently banned from the platform.',
      'If you have a legitimate issue, please contact us first — we will resolve it fairly.',
    ],
  },
  {
    icon: FaEnvelope,
    title: '7. Contact for Refund Queries',
    content: [
      'For all refund and cancellation related queries:',
      '',
      'Email: support@rankresult.in',
      'Grievance Officer: grievance@rankresult.in',
      'Response Time: Within 24 hours on business days',
    ],
  },
];

export default function RefundPolicyPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Refund Policy', item: `${SITE_URL}/refund-policy` },
    ],
  };

  return (
    <>
      <Head>
        <title>Refund & Cancellation Policy | RankResult</title>
        <meta name="description" content="RankResult Refund and Cancellation Policy for points packs, exam packs, and question bank purchases." />
        <meta name="keywords" content="RankResult refund, cancellation policy, digital goods refund, points pack refund" />
        <link rel="canonical" href={`${SITE_URL}/refund-policy`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Refund & Cancellation Policy | RankResult" />
        <meta property="og:description" content="Understand the refund and cancellation policy for digital purchases on RankResult." />
        <meta property="og:url" content={`${SITE_URL}/refund-policy`} />
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
            Refund & Cancellation Policy
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm mb-2">
            Last Updated: {LAST_UPDATED}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            This policy applies to all digital products and services purchased on {SITE_NAME}. Please read it carefully before making a purchase.
          </motion.p>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="space-y-6">
            {sections.map(({ icon: Icon, title, content }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-900/40 border border-green-800/30 flex items-center justify-center shrink-0 mt-1">
                    <Icon className="text-green-400 text-lg" />
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
