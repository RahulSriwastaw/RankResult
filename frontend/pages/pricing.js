import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCoins, FaCheckCircle, FaQuestionCircle, FaInfoCircle,
  FaChevronDown, FaShieldAlt, FaArrowRight, FaTicketAlt
} from 'react-icons/fa';
import Navbar from '../components/Navbar';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('rv_token');
      const u = localStorage.getItem('rv_user');
      if (t) setToken(t);
      if (u) {
        try { setUser(JSON.parse(u)); } catch {}
      }
    }
  }, []);
  return { user, token };
}

export default function Pricing() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [pointsPacks, setPointsPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyModal, setBuyModal] = useState(null);
  const [buying, setBuying] = useState(false);
  const [buyMsg, setBuyMsg] = useState('');
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    fetchPointsPacks();
    fetchUserPoints();
  }, [user]);

  const fetchUserPoints = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/user/${user.id}/points`);
      const data = await res.json();
      setCurrentUser(prev => prev ? { ...prev, balance: data.balance } : { ...user, balance: data.balance });
      
      const localUser = JSON.parse(localStorage.getItem('rv_user') || '{}');
      localUser.balance = data.balance;
      localStorage.setItem('rv_user', JSON.stringify(localUser));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPointsPacks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/marketplace/points-packs`);
      const data = await res.json();
      setPointsPacks(Array.isArray(data.packs) ? data.packs : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const buyItem = (pack) => {
    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }
    setBuyMsg('');
    setBuyModal(pack);
  };

  const confirmBuy = async () => {
    if (!buyModal) return;
    setBuying(true);
    setBuyMsg('Initiating secure payment order...');
    try {
      const orderRes = await fetch(`${API}/api/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ points_pack_id: buyModal.id }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) {
        setBuyMsg('❌ ' + (orderData.error || 'Failed to create order'));
        setBuying(false);
        return;
      }

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'RankResult',
          description: `Points Pack: ${buyModal.name}`,
          order_id: orderData.order_id,
          handler: async function (response) {
            setBuying(true);
            setBuyMsg('Verifying payment details...');
            try {
              const verifyRes = await fetch(`${API}/api/payments/razorpay/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  points_pack_id: buyModal.id
                })
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                setBuyMsg('✅ Points added successfully!');
                fetchUserPoints();
                setTimeout(() => setBuyModal(null), 1500);
              } else {
                setBuyMsg('❌ ' + (verifyData.error || 'Verification failed'));
              }
            } catch (err) {
              setBuyMsg('❌ Verification error');
            } finally {
              setBuying(false);
            }
          },
          prefill: {
            name: orderData.user.name || '',
            email: orderData.user.email || ''
          },
          theme: { color: '#6366f1' },
          modal: {
            ondismiss: function () {
              setBuyMsg('❌ Payment cancelled');
              setBuying(false);
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setBuyMsg('❌ Payment gateway script not loaded. Please try again.');
        setBuying(false);
      }
    } catch (e) {
      setBuyMsg('❌ Network error');
      setBuying(false);
    }
  };

  const faqs = [
    {
      q: "What are points used for in RankResult?",
      a: "Points are virtual credits used to unlock detailed, step-by-step AI explanations, solution keys, difficulty ratings, chapter concepts, and bilingual translations for wrong questions in your test results."
    },
    {
      q: "Do purchased points have an expiration date?",
      a: "No, all purchased points packs come with lifetime validity. They will remain in your account until you spend them."
    },
    {
      q: "How many points does it cost to unlock a question explanation?",
      a: "Unlocking a full AI solution with bilingual step-by-step reasoning generally costs between 5 to 10 points depending on the exam difficulty and length of explanation."
    },
    {
      q: "Are payment methods secure?",
      a: "Yes. All transactions are securely processed through Razorpay (Indian payment methods like UPI, Net Banking, Cards, and Wallets) and Stripe (International cards). We do not store any of your financial data."
    },
    {
      q: "Can I get a refund if I do not use my points?",
      a: "Since points are digital services and credited to your account balance immediately upon successful transaction, they are generally non-refundable. Please refer to our Refund & Cancellation Policy for specific details."
    }
  ];

  return (
    <>
      <Head>
        <title>Pricing Plans &amp; Points Packages — RankResult</title>
        <meta name="description" content="Simple, transparent pricing. Buy RankResult points packages to unlock step-by-step AI exam solutions and detailed rank calculations." />
        <link rel="canonical" href="https://rankresult.in/pricing" />
      </Head>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">
        <div>
          <Navbar user={currentUser} />

          {/* Pricing Header Hero */}
          <section className="relative overflow-hidden py-16">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/30 pointer-events-none" />
            <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-3.5 py-1.5 rounded-full mb-3 uppercase tracking-wider shadow-sm">
                  💎 Secure Points Marketplace
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-950 tracking-tight leading-tight">
                  Transparent Pricing, <span className="text-indigo-600">Infinite Learning</span>
                </h1>
                <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
                  Purchase points packages securely to unlock AI solutions, in-depth shift analyses, and step-by-step reasoning for competitive exam questions.
                </p>
              </motion.div>

              {/* User points balance widget */}
              {currentUser && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-md shadow-indigo-50/40 mt-8"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white text-sm shadow-sm select-none">
                    <FaCoins />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Your Balance</p>
                    <p className="text-base font-black text-slate-800">{currentUser.balance || 0} Points</p>
                  </div>
                </motion.div>
              )}
            </div>
          </section>

          {/* Pricing Grid */}
          <section className="max-w-6xl mx-auto px-4 pb-16">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full" />
              </div>
            ) : pointsPacks.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white border border-slate-100 rounded-3xl shadow-sm max-w-2xl mx-auto">
                <FaCoins className="text-4xl mx-auto mb-3 opacity-30 text-indigo-600 animate-pulse" />
                <p className="text-sm font-bold text-slate-500">No points packages configured yet.</p>
                <p className="text-xs text-slate-400 mt-1">Please check back later or contact support.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                {pointsPacks.map((pack, index) => {
                  // Determine customized color themes for each pack based on its index
                  const themes = [
                    { border: 'border-slate-100', headerBg: 'bg-slate-50/50', btnBg: 'from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800', ribbon: null, iconColor: 'text-slate-400' },
                    { border: 'border-indigo-100', headerBg: 'bg-indigo-50/10', btnBg: 'from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600', ribbon: null, iconColor: 'text-indigo-500' },
                    { border: 'border-amber-250 shadow-md shadow-amber-50', headerBg: 'bg-amber-50/20', btnBg: 'from-amber-500 to-yellow-600 text-white hover:from-amber-400 hover:to-yellow-500', ribbon: 'Most Popular 🔥', iconColor: 'text-amber-500' },
                    { border: 'border-purple-200', headerBg: 'bg-purple-50/20', btnBg: 'from-purple-600 to-indigo-700 text-white hover:from-purple-500 hover:to-indigo-600', ribbon: 'Best Value 🚀', iconColor: 'text-purple-500' }
                  ];
                  const t = themes[index % themes.length];
                  
                  // Generate custom feature listings based on pack points
                  const pointsVal = pack.points || 0;
                  const estimatedUnlocks = Math.floor(pointsVal / 8);

                  return (
                    <motion.div
                      key={pack.id}
                      whileHover={{ y: -6 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`bg-white border rounded-3xl flex flex-col justify-between overflow-hidden shadow-sm relative h-full transition duration-300 ${t.border}`}
                    >
                      {t.ribbon && (
                        <span className="absolute top-3.5 right-4 bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {t.ribbon}
                        </span>
                      )}

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className={`p-4 rounded-2xl mb-4 ${t.headerBg}`}>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">{pack.name}</h3>
                            <div className="flex items-baseline gap-1.5 mt-2">
                              <span className="text-3xl font-black text-slate-800 tracking-tight">{pack.points}</span>
                              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <FaCoins className="text-[9px] text-amber-500 animate-spin" style={{ animationDuration: '4s' }} /> Points
                              </span>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-1.5 my-5">
                            <span className="text-2xl font-black text-slate-800">₹{pack.price}</span>
                            <span className="text-[10px] text-slate-400 font-bold">One-time payment</span>
                          </div>

                          <div className="border-t border-slate-100 pt-4 space-y-3">
                            <div className="flex items-start gap-2 text-xs">
                              <FaCheckCircle className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                              <span className="text-slate-600">Unlocks approx. <strong className="text-indigo-950">{estimatedUnlocks} AI explanations</strong></span>
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                              <FaCheckCircle className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                              <span className="text-slate-600">Bilingual reasoning (Hindi/English)</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                              <FaCheckCircle className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                              <span className="text-slate-600">Step-by-step math calculations</span>
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                              <FaCheckCircle className="text-emerald-500 text-sm mt-0.5 shrink-0" />
                              <span className="text-slate-600">Lifetime Validity</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8">
                          <button
                            onClick={() => buyItem(pack)}
                            className={`w-full py-3 rounded-2xl bg-gradient-to-r font-extrabold text-xs shadow-sm transition-all duration-200 flex items-center justify-center gap-1 ${t.btnBg}`}
                          >
                            Buy Package <FaArrowRight className="text-[9px]" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Secure transaction notice */}
          <section className="max-w-md mx-auto px-4 pb-16 text-center">
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-center gap-3">
              <FaShieldAlt className="text-indigo-600 text-2xl" />
              <div className="text-left text-[11px] leading-relaxed text-slate-500">
                <strong className="text-slate-800 font-bold uppercase block tracking-wider mb-0.5">Secure Checkout</strong>
                Payments are securely processed via Razorpay and Stripe. None of your card or payment information is stored by us.
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white border-y border-slate-100 py-16">
            <div className="max-w-3xl mx-auto px-4">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full mb-3 uppercase tracking-wider">
                  <FaQuestionCircle /> Frequently Asked Questions
                </span>
                <h2 className="text-2xl font-extrabold text-indigo-950">Got Questions? We've Got Answers</h2>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden transition bg-slate-50/30">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full p-4 text-left font-bold text-xs md:text-sm text-indigo-950 flex justify-between items-center transition hover:bg-slate-50/50"
                    >
                      {faq.q}
                      <FaChevronDown className={`text-slate-400 text-xs transition duration-300 ${openFaq === i ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="p-4 pt-0 text-slate-500 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-white">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-[#0f172a] text-slate-400 pt-12 pb-8 px-4 border-t border-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
              <div>
                <span className="text-white font-extrabold text-base tracking-wider uppercase">RankResult</span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Unofficial rank predictor and government exam resource bank.
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
                Disclaimer: Points and packs purchases are subject to terms of service. AI solutions are for preparation reference only.
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Buy Confirm Modal */}
      <AnimatePresence>
        {buyModal && (
          <motion.div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-lg"
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
              <h3 className="text-lg font-extrabold text-indigo-950 mb-2">🛒 Confirm Purchase</h3>
              <p className="text-slate-500 text-xs mb-4 leading-relaxed">Unlock {buyModal.name} Points Bundle.</p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 flex justify-between items-center shadow-sm">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Price</span>
                <span className="text-amber-500 font-extrabold text-base flex items-center gap-1">
                  ₹{buyModal.price}
                </span>
              </div>
              {buyMsg && (
                <div className={`mb-4 text-xs font-semibold px-4 py-3 rounded-xl ${buyMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {buyMsg}
                </div>
              )}
              {!buyMsg.startsWith('✅') && (
                <div className="flex gap-3">
                  <button onClick={() => setBuyModal(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs font-bold transition">
                    Cancel
                  </button>
                  <button onClick={confirmBuy} disabled={buying}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-500 text-white font-extrabold text-xs disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                    {buying ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : '✅ Confirm'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
