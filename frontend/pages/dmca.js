import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCopyright, FaFlag, FaShieldAlt, FaEnvelope, FaGavel, FaFileAlt } from 'react-icons/fa';

const SITE_URL = 'https://rankresult.in';
const SITE_NAME = 'RankResult';
const LAST_UPDATED = '15 July 2026';

const sections = [
  {
    icon: FaCopyright,
    title: 'Copyright Policy',
    content: [
      'RankResult respects the intellectual property rights of others and expects its users to do the same. This Copyright Policy outlines our procedures for addressing claims of copyright infringement.',
      'All original content on RankResult — including software code, design elements, text, graphics, and database structures — is the exclusive property of RankResult Technologies and is protected under the Indian Copyright Act, 1957 and international copyright treaties.',
    ],
  },
  {
    icon: FaFlag,
    title: 'DMCA Compliance (Digital Millennium Copyright Act)',
    content: [
      'RankResult complies with the provisions of the Digital Millennium Copyright Act (DMCA) and the Indian Copyright Act, 1957. We have implemented procedures for receiving and addressing notices of alleged copyright infringement.',
      'If you believe that your copyrighted work has been copied, displayed, or distributed on RankResult in a way that constitutes copyright infringement, please submit a written notification to our Designated Copyright Agent including the following information:',
      '',
      'A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.',
      'Identification of the copyrighted work claimed to have been infringed.',
      'Identification of the material that is claimed to be infringing, including its location on our platform (URL or specific page).',
      'Your contact information: name, address, telephone number, and email address.',
      'A statement that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.',
      'A statement, made under penalty of perjury, that the information in the notification is accurate and that you are the copyright owner or authorized to act on the owner\'s behalf.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: 'Counter-Notification',
    content: [
      'If you believe that material you submitted was removed or disabled as a result of mistake or misidentification, you may file a counter-notification. Your counter-notification must include:',
      '',
      'Your physical or electronic signature.',
      'Identification of the material that has been removed and the location where it appeared before removal.',
      'A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.',
      'Your name, address, telephone number, and email address.',
      'A statement that you consent to the jurisdiction of the federal district court for the judicial district in which your address is located (or, if outside the USA, any jurisdiction where RankResult may be found), and that you will accept service of process from the person who provided the original notification.',
      'Upon receiving a valid counter-notification, we may restore the removed material in accordance with applicable law.',
    ],
  },
  {
    icon: FaGavel,
    title: 'Designated Copyright Agent',
    content: [
      'All copyright infringement notices and counter-notifications should be sent to our Designated Agent:',
      '',
      'Email: copyright@rankresult.in',
      'Subject Line: "DMCA Notice — RankResult" or "Copyright Claim — RankResult"',
    ],
  },
  {
    icon: FaFileAlt,
    title: 'Repeat Infringer Policy',
    content: [
      'RankResult maintains a policy of terminating the accounts of users who are repeat infringers of intellectual property rights. We reserve the right to remove infringing content and terminate user accounts at our sole discretion, without prior notice.',
    ],
  },
  {
    icon: FaShieldAlt,
    title: 'Trademark Notice',
    content: [
      '"RankResult" name, logo, and all related branding elements are trademarks of RankResult Technologies. Unauthorized use of our trademarks, including in meta tags, advertising, or domain names, is strictly prohibited.',
      'All third-party trademarks, service marks, and logos mentioned on our platform are the property of their respective owners. Reference to any third-party trademark does not imply endorsement or affiliation.',
    ],
  },
  {
    icon: FaEnvelope,
    title: 'Report a Copyright Issue',
    content: [
      'If you believe any content on RankResult infringes your copyright, please contact us immediately:',
      '',
      'Email: copyright@rankresult.in',
      'Grievance Officer: grievance@rankresult.in',
      'We will investigate and take appropriate action within 48 hours of receiving a valid notice.',
    ],
  },
];

export default function DMCAPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'DMCA & Copyright', item: `${SITE_URL}/dmca` },
    ],
  };

  return (
    <>
      <Head>
        <title>DMCA & Copyright Policy | RankResult</title>
        <meta name="description" content="RankResult DMCA Compliance and Copyright Policy. Learn how to report copyright infringement and our intellectual property protection practices." />
        <meta name="keywords" content="RankResult DMCA, copyright policy, copyright infringement, trademark, intellectual property" />
        <link rel="canonical" href={`${SITE_URL}/dmca`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="DMCA & Copyright Policy | RankResult" />
        <meta property="og:description" content="Copyright and DMCA compliance information for RankResult platform." />
        <meta property="og:url" content={`${SITE_URL}/dmca`} />
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
            DMCA & Copyright Policy
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-gray-500 text-sm mb-2">
            Last Updated: {LAST_UPDATED}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
            {SITE_NAME} respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA) and the Indian Copyright Act, 1957.
          </motion.p>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-16">
          <div className="space-y-6">
            {sections.map(({ icon: Icon, title, content }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-900/40 border border-purple-800/30 flex items-center justify-center shrink-0 mt-1">
                    <Icon className="text-purple-400 text-lg" />
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
