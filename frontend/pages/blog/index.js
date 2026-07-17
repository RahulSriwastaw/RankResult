import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaSearch, FaBookOpen, FaCalendar, FaUser, FaArrowRight } from 'react-icons/fa';
import Navbar from '../../components/Navbar';
import Logo from '../../components/Logo';

const SITE_URL = 'https://rankveda.in';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function BlogIndex({ initialPosts = [] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'Exam Updates', 'Prep Tips', 'Question Banks', 'General'];

  useEffect(() => {
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const catQuery = activeCategory !== 'All' ? `&category=${encodeURIComponent(activeCategory)}` : '';
        const res = await fetch(`${API_BASE}/api/public/blog?search=${encodeURIComponent(search)}${catQuery}`);
        const data = await res.json();
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (e) {
        console.error('Error filtering blog posts:', e);
      } finally {
        setLoading(false);
      }
    };
    // Debounce/Trigger filter on search or category change
    const timer = setTimeout(fetchFiltered, 300);
    return () => clearTimeout(timer);
  }, [search, activeCategory]);

  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  return (
    <>
      <Head>
        <title>RankVeda Blog — Competitive Exams Preparation Updates &amp; Prep Tips</title>
        <meta name="description" content="Stay updated with the latest exam notifications, preparation strategies, syllabus analysis, and expert tips for SSC CGL, RRB NTPC, Bank PO, and other government exams." />
        <link rel="canonical" href={`${SITE_URL}/blog`} />
      </Head>

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        
        {/* Navbar */}
        <Navbar />

        {/* Hero Spotlight */}
        <header className="max-w-6xl mx-auto px-4 py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/30 pointer-events-none rounded-3xl" />
          
          <div className="text-center mb-10 relative">
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-3.5 py-1.5 rounded-full mb-3 uppercase tracking-wider">
              📚 RankVeda Article Resource Hub
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 tracking-tight leading-tight">
              Latest Articles &amp; <span className="text-indigo-600">Exam Insights</span>
            </h1>
            <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
              Expert guidelines, syllabus breakdowns, study materials, and dynamic updates to help you clear government competitive exams.
            </p>
          </div>

          {/* Search + Filter category pills */}
          <div className="max-w-3xl mx-auto space-y-4 mb-10 relative">
            <div className="relative">
              <FaSearch className="absolute left-4 top-3.5 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search articles by keywords..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition ${
                    activeCategory === cat
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                      : 'bg-white border-slate-200 text-slate-505 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Post Card */}
          {featuredPost && !search && activeCategory === 'All' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 relative grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
            >
              <div className="relative h-64 md:h-full min-h-[250px] bg-slate-100">
                {featuredPost.featured_image ? (
                  <img
                    src={featuredPost.featured_image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-400">
                    <FaBookOpen className="text-5xl" />
                  </div>
                )}
                <span className="absolute top-4 left-4 bg-indigo-650 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                    <span>{featuredPost.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FaCalendar /> {new Date(featuredPost.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-indigo-950 mb-3 hover:text-indigo-600 transition leading-tight">
                    <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-5">
                    {featuredPost.excerpt || (featuredPost.content.replace(/<[^>]+>/g, '').slice(0, 180) + '...')}
                  </p>
                </div>
                <Link
                  href={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition group"
                >
                  Read Full Article <FaArrowRight className="text-[10px] group-hover:translate-x-0.5 transition" />
                </Link>
              </div>
            </motion.div>
          )}
        </header>

        {/* Regular Posts Grid */}
        <section className="max-w-6xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white border border-slate-100 rounded-3xl shadow-sm">
              <FaBookOpen className="text-4xl mx-auto mb-3 opacity-30 text-indigo-600" />
              <p className="text-sm font-bold text-slate-500">No articles match your search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* If featured post was shown above, slice it out from the grid */}
              {(featuredPost && !search && activeCategory === 'All' ? regularPosts : posts).map((post, idx) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group"
                >
                  <div>
                    <div className="relative h-48 bg-slate-100">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 text-slate-350">
                          <FaBookOpen className="text-3xl" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-100 text-indigo-950 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-2 uppercase">
                        <FaCalendar className="text-[9px]" />
                        <span>{new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <h3 className="font-extrabold text-indigo-950 text-sm mb-2 group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                        {post.excerpt || (post.content.replace(/<[^>]+>/g, '').slice(0, 120) + '...')}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition"
                    >
                      Read Article <FaArrowRight className="text-[9px] group-hover:translate-x-0.5 transition" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

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
              <div>© 2025 RankVeda — All Rights Reserved</div>
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

export async function getServerSideProps() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/public/blog`);
    const data = await res.json();
    return {
      props: {
        initialPosts: Array.isArray(data.posts) ? data.posts : [],
      },
    };
  } catch (e) {
    console.error('Error fetching initial blog list:', e);
    return {
      props: {
        initialPosts: [],
      },
    };
  }
}
