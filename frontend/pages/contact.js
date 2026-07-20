import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEnvelope, FaMapMarkerAlt, FaClock, FaPhone, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';

const SITE_URL = 'https://rankresult.in';
const SITE_NAME = 'RankResult';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const mailtoLink = `mailto:support@rankresult.in?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
    window.open(mailtoLink, '_blank');
    setSubmitted(true);
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact Us', item: `${SITE_URL}/contact` },
    ],
  };

  return (
    <>
      <Head>
        <title>Contact Us | RankResult — Get in Touch</title>
        <meta name="description" content="Contact RankResult support team. Email us at support@rankresult.in for queries, feedback, or grievances." />
        <meta name="keywords" content="RankResult contact, support, email, grievance officer, help" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Contact Us | RankResult" />
        <meta property="og:description" content="Get in touch with the RankResult team for support, feedback, or any queries." />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
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
            Contact Us
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            Have a question, feedback, or need help? We are here for you. Reach out to us through any of the channels below.
          </motion.p>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center mb-3">
                <FaEnvelope className="text-indigo-400 text-xl" />
              </div>
              <h3 className="font-bold text-gray-200 mb-1 text-sm">Email</h3>
              <p className="text-xs text-gray-500">support@rankresult.in</p>
              <p className="text-xs text-gray-600 mt-1">We reply within 24 hours</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center mb-3">
                <FaClock className="text-indigo-400 text-xl" />
              </div>
              <h3 className="font-bold text-gray-200 mb-1 text-sm">Response Time</h3>
              <p className="text-xs text-gray-500">Mon–Sat, 10 AM – 7 PM IST</p>
              <p className="text-xs text-gray-600 mt-1">We close on public holidays</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-900/40 border border-indigo-800/30 flex items-center justify-center mb-3">
                <FaMapMarkerAlt className="text-indigo-400 text-xl" />
              </div>
              <h3 className="font-bold text-gray-200 mb-1 text-sm">Grievance Officer</h3>
              <p className="text-xs text-gray-500">grievance@rankresult.in</p>
              <p className="text-xs text-gray-600 mt-1">As per IT Act, 2000</p>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8 max-w-2xl mx-auto">
            {submitted ? (
              <div className="text-center py-8">
                <FaCheckCircle className="text-green-400 text-5xl mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-200 mb-2">Message Sent!</h2>
                <p className="text-sm text-gray-500">Your email client has been opened. Please send the email to reach us.</p>
                <button onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }} className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition">
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-200 mb-6 text-center">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Your Name *</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 transition" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Your Email *</label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 transition" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Subject *</label>
                    <select required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-600 transition">
                      <option value="" disabled>Select a subject</option>
                      <option value="General Query">General Query</option>
                      <option value="Technical Support">Technical Support</option>
                      <option value="Refund Request">Refund Request</option>
                      <option value="Grievance">Grievance</option>
                      <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                      <option value="Bug Report">Bug Report</option>
                      <option value="Partnership / Collaboration">Partnership / Collaboration</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Message *</label>
                    <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Write your message here..." className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 transition resize-y" />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-sm transition flex items-center justify-center gap-2">
                    <FaPaperPlane /> Send Message
                  </button>
                </form>
              </>
            )}
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
