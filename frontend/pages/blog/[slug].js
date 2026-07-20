import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaCalendar, FaUser, FaBookOpen, FaArrowRight, FaShareAlt, FaTelegram, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Logo from '../../components/Logo';

const SITE_URL = 'https://rankresult.in';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function BlogPostPage({ post, related = [] }) {
  const router = useRouter();
  const [toc, setToc] = useState([]);

  // Fallback state
  if (router.isFallback || !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-xs font-bold">Loading article...</p>
        </div>
      </div>
    );
  }

  // Parse Headings to dynamically construct Table of Contents (ToC)
  useEffect(() => {
    if (!post.content) return;
    const regex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
    const headings = [];
    let match;
    let index = 0;
    
    // Copy content to clean tags inside headings
    while ((match = regex.exec(post.content)) !== null) {
      const level = match[1];
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      const id = `toc-heading-${index++}`;
      headings.push({ level: parseInt(level), text, id });
    }
    setToc(headings);
  }, [post.content]);

  // Replace content headings with IDs so ToC anchor links work
  const getProcessedContent = () => {
    if (!post.content) return '';
    let processed = post.content;
    let index = 0;
    
    // Inject dynamic ids into h2 and h3 tags
    processed = processed.replace(/<h([2-3])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, text) => {
      const id = `toc-heading-${index++}`;
      return `<h${level} id="${id}" ${attrs}>${text}</h${level}>`;
    });
    
    return processed;
  };

  const CANONICAL = `${SITE_URL}/blog/${post.slug}`;
  const shareText = encodeURIComponent(`Read: ${post.title}`);
  
  // JSON-LD Schemas
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: CANONICAL }
    ]
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: [post.featured_image || `${SITE_URL}/images/og-blog-fallback.jpg`],
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      '@type': 'Organization',
      name: 'RankResult Expert Team',
      url: SITE_URL
    },
    publisher: {
      '@type': 'Organization',
      name: 'RankResult',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': CANONICAL
    }
  };

  return (
    <>
      <Head>
        {/* SEO Meta Tags */}
        <title>{post.meta_title || `${post.title} — RankResult`}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <meta name="keywords" content={post.meta_keywords || post.tags} />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.og_title || post.title} />
        <meta property="og:description" content={post.og_description || post.excerpt} />
        <meta property="og:url" content={CANONICAL} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <meta property="og:site_name" content="RankResult" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        {post.featured_image && <meta name="twitter:image" content={post.featured_image} />}

        {/* Injected JSON-LD Schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        
        {/* Navbar */}
        <Navbar />

        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="max-w-6xl mx-auto px-4 pt-6">
          <ol className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            <li><Link href="/" className="hover:text-indigo-600">Home</Link></li>
            <li className="text-slate-350">›</li>
            <li><Link href="/blog" className="hover:text-indigo-600">Blog</Link></li>
            <li className="text-slate-350">›</li>
            <li className="text-indigo-600 truncate max-w-[200px]">{post.title}</li>
          </ol>
        </nav>

        {/* Article Layout */}
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
            
            {/* Left Column: Post Details */}
            <article className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide">
                {post.category}
              </span>

              <h1 className="text-2xl md:text-3xl font-black text-indigo-950 mt-4 mb-4 leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-450 border-b border-slate-100 pb-6 mb-6">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <FaCalendar /> {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <FaUser /> By RankResult Experts
                </span>
              </div>

              {/* Featured Image */}
              {post.featured_image && (
                <div className="rounded-2xl overflow-hidden mb-8 max-h-[380px] bg-slate-100 border border-slate-100">
                  <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Article Content */}
              <div 
                className="prose prose-indigo max-w-none text-xs md:text-sm text-slate-650 leading-relaxed space-y-5
                  prose-headings:text-indigo-950 prose-headings:font-black prose-headings:tracking-tight
                  prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-3 prose-h2:pb-1.5 prose-h2:border-b prose-h2:border-slate-100
                  prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                  prose-strong:font-bold prose-strong:text-indigo-950
                  prose-p:mb-4
                  prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1.5
                  prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-1.5
                  prose-li:text-slate-600
                  prose-a:text-indigo-600 prose-a:font-bold prose-a:underline hover:prose-a:text-indigo-500"
                dangerouslySetInnerHTML={{ __html: getProcessedContent() }}
              />

              {/* Social Sharing Share-Buttons */}
              <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FaShareAlt /> Share Article:
                </span>
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/?text=${shareText}%20${CANONICAL}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition text-sm"
                  >
                    <FaWhatsapp />
                  </a>
                  <a
                    href={`https://telegram.me/share/url?url=${CANONICAL}&text=${shareText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition text-sm"
                  >
                    <FaTelegram />
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?url=${CANONICAL}&text=${shareText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-indigo-950 text-white flex items-center justify-center hover:bg-slate-800 transition text-xs"
                  >
                    <FaTwitter />
                  </a>
                </div>
              </div>
            </article>

            {/* Right Column: Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24">
              
              {/* Table of Contents Widget */}
              {toc.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-indigo-950 mb-4 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-50">
                    <FaBookOpen className="text-indigo-650" /> Table of Contents
                  </h3>
                  <nav className="space-y-2 text-xs font-semibold">
                    {toc.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block transition hover:text-indigo-600 ${
                          item.level === 3 ? 'pl-4 text-slate-450 text-[11px]' : 'text-slate-600'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Related Posts Widget */}
              {related.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-indigo-950 mb-4 text-xs uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-50">
                    📖 Related Articles
                  </h3>
                  <div className="space-y-4">
                    {related.map(item => (
                      <Link
                        key={item.id}
                        href={`/blog/${item.slug}`}
                        className="block group space-y-1.5"
                      >
                        <h4 className="font-bold text-xs text-slate-700 group-hover:text-indigo-600 leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Call-to-action widget */}
              <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/30 border border-slate-100 rounded-3xl p-6 shadow-sm text-center">
                <span className="text-2xl mb-2 block">⚡</span>
                <h3 className="font-extrabold text-indigo-950 text-sm mb-2">
                  Check Exam Answer Keys
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Calculate section score &amp; view live rank percentile instant.
                </p>
                <Link
                  href="/"
                  className="w-full py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                >
                  Predict Rank Now <FaArrowRight className="text-[9px]" />
                </Link>
              </div>

            </aside>
            
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 px-4 mt-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
              <div>
                <div className="mb-2"><Logo size="sm" /></div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Unofficial rank predictor and competitive government exam resource bank.
                </p>
              </div>
              <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <Link href="/exams" className="hover:text-white transition">Exams</Link>
                <Link href="/blog" className="hover:text-white transition">Blog</Link>
                <Link href="/marketplace" className="hover:text-white transition">Question Bank</Link>
              </div>
            </div>
            
            <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <div>© 2025 RankResult — All Rights Reserved</div>
              <div className="text-center md:text-right normal-case tracking-normal">
                Disclaimer: blog articles are for information/preparation reference purposes. Final dates/notifications only by official boards.
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/blog/${params.slug}`);
    if (res.status === 404) {
      return { notFound: true };
    }
    const data = await res.json();
    if (!data.post) {
      return { notFound: true };
    }
    return {
      props: {
        post: data.post,
        related: data.related || []
      }
    };
  } catch (e) {
    console.error('Error fetching blog post details:', e);
    return { notFound: true };
  }
}
