import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaTachometerAlt, FaUsers, FaBook, FaClipboardList, FaQuestionCircle, FaMoneyBillWave, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const ADMIN_PASS = "admin123"; // Simple password for demo

export default function AdminLayout() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASS) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuthenticated(true);
      setError('');
    } else {
      setError('गलत पासवर्ड');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md"
        >
          <div className="text-center mb-6">
            <FaShieldAlt className="text-5xl text-indigo-500 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 text-sm">RankVeda एडमिन पैनल</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">पासवर्ड</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="एडमिन पासवर्ड डालें"
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:scale-[1.02] transition-transform"
            >
              लॉगिन करें
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800"
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-40 w-64 h-full bg-gray-800 border-r border-gray-700 transition-transform duration-300`}>
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-2xl text-indigo-500" />
            <div>
              <h2 className="font-bold">RankVeda</h2>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', icon: FaTachometerAlt, label: 'डैशबोर्ड' },
            { id: 'users', icon: FaUsers, label: 'यूज़र्स' },
            { id: 'exams', icon: FaBook, label: 'परीक्षाएं' },
            { id: 'results', icon: FaClipboardList, label: 'रिजल्ट' },
            { id: 'questions', icon: FaQuestionCircle, label: 'प्रश्न' },
            { id: 'parsed', icon: FaClipboardList, label: 'पैरस्ड डेटा' },
            { id: 'transactions', icon: FaMoneyBillWave, label: 'ट्रांजेक्शन्स' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${activeTab === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <button
            onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthenticated(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-gray-700 transition"
          >
            <FaSignOutAlt /> लॉगआउट
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'users' && <Users />}
          {activeTab === 'exams' && <Exams />}
          {activeTab === 'results' && <Results />}
          {activeTab === 'questions' && <Questions />}
          {activeTab === 'parsed' && <ParsedData />}
          {activeTab === 'transactions' && <Transactions />}
        </div>
      </div>
    </div>
  );
}

// ==================== DASHBOARD COMPONENT ====================
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const cards = [
    { label: 'कुल यूज़र्स', value: stats?.total_users || 0, color: 'from-blue-500 to-blue-600' },
    { label: 'कुल परीक्षाएं', value: stats?.total_exams || 0, color: 'from-purple-500 to-purple-600' },
    { label: 'कुल रिजल्ट', value: stats?.total_results || 0, color: 'from-green-500 to-green-600' },
    { label: 'कुल प्रश्न', value: stats?.total_questions || 0, color: 'from-pink-500 to-pink-600' },
    { label: 'AI सॉल्यूशन्स', value: stats?.total_solutions || 0, color: 'from-amber-500 to-amber-600' },
    { label: 'आज के रिजल्ट', value: stats?.today_results || 0, color: 'from-cyan-500 to-cyan-600' },
    { label: 'आज के यूज़र्स', value: stats?.today_users || 0, color: 'from-teal-500 to-teal-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 डैशबोर्ड</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-gradient-to-br ${card.color} rounded-xl p-5 shadow-lg`}
          >
            <p className="text-sm opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Points Summary */}
      <div className="mt-8 bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">💰 पॉइंट्स सारांश</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">कुल कमाए गए</p>
            <p className="text-2xl font-bold text-green-400">{stats?.total_points_earned || 0}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">कुल खर्च किए</p>
            <p className="text-2xl font-bold text-red-400">{stats?.total_points_spent || 0}</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-400">नेट बैलेंस</p>
            <p className="text-2xl font-bold text-indigo-400">{(stats?.total_points_earned || 0) - (stats?.total_points_spent || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== USERS COMPONENT ====================
function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [adjustModal, setAdjustModal] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [perPage, setPerPage] = useState(20);
  const [bulkSelected, setBulkSelected] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, [page, perPage, search, sortBy, dateFrom, dateTo]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/admin/users?page=${page}&per_page=${perPage}&search=${search}&sort_by=${sortBy}`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const res = await fetch(url);
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pages);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runBulkDeleteUsers = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`क्या आप वाकई ${bulkSelected.length} यूज़र्स और उनका सारा डेटा (Points, Results, Transactions) delete करना चाहते हैं?`)) return;
    
    try {
      const res = await fetch('http://localhost:5000/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: bulkSelected }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.deleted} Users deleted`);
        setBulkSelected([]);
        if (page === 1) {
          fetchUsers();
        } else {
          setPage(1);
        }
      } else {
        alert('❌ Error: ' + (data.error || ''));
      }
    } catch (e) { alert('❌ Delete failed'); }
  };

  const fetchUserDetail = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`);
      const data = await res.json();
      setSelectedUser(data);
    } catch (e) {
      console.error(e);
    }
  };

  const adjustPoints = async (userId, amount, description) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, type: amount > 0 ? 'earn' : 'spend' })
      });
      const data = await res.json();
      if (data.success) {
        fetchUserDetail(userId);
        setAdjustModal(null);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">👥 यूज़र्स मैनेजमेंट</h1>
        {bulkSelected.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-indigo-400">{bulkSelected.length} selected</span>
            <button onClick={runBulkDeleteUsers} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm transition">
              🗑️ Bulk Delete
            </button>
            <button onClick={() => setBulkSelected([])} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm transition">
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="ईमेल या नाम से खोजें..."
          className="col-span-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500"
        />
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none">
          <option value="created_at">📅 नवीनतम</option>
          <option value="balance">💰 Points Balance</option>
        </select>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none" />
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="flex-1 px-3 py-2 rounded-xl bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none" />
        </div>
      </div>

      {selectedUser ? (
        <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} onAdjustPoints={(u) => setAdjustModal(u)} />
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3 text-left w-10">
                    <input type="checkbox" onChange={e => {
                      if (e.target.checked) {
                        setBulkSelected(prev => [...new Set([...prev, ...users.map(u => u.id)])]);
                      } else {
                        const userIds = users.map(u => u.id);
                        setBulkSelected(prev => prev.filter(id => !userIds.includes(id)));
                      }
                    }}
                    checked={users.length > 0 && users.every(u => bulkSelected.includes(u.id))} className="w-4 h-4" />
                  </th>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">नाम</th>
                  <th className="p-3 text-left">ईमेल</th>
                  <th className="p-3 text-left">पॉइंट्स</th>
                  <th className="p-3 text-left">रिजल्ट</th>
                  <th className="p-3 text-left">एक्शन</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750">
                    <td className="p-3">
                      <input type="checkbox" checked={bulkSelected.includes(u.id)}
                        onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id))}
                        className="w-4 h-4" />
                    </td>
                    <td className="p-3">{u.id}</td>
                    <td className="p-3">{u.name || '—'}</td>
                    <td className="p-3 text-gray-400">{u.email || '—'}</td>
                    <td className="p-3">
                      <span className="text-yellow-400">{u.points_balance}</span>
                    </td>
                    <td className="p-3">{u.results_count}</td>
                    <td className="p-3">
                      <button
                        onClick={() => fetchUserDetail(u.id)}
                        className="text-indigo-400 hover:text-indigo-300 mr-2"
                      >
                        विवरण
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center bg-gray-800 p-3 rounded-xl">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Rows per page:</span>
              <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="bg-gray-700 text-white rounded px-2 py-1">
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded ${page === p ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Adjust Points Modal */}
      {adjustModal && (
        <PointsAdjustModal
          user={adjustModal}
          onClose={() => setAdjustModal(null)}
          onSave={adjustPoints}
        />
      )}
    </div>
  );
}

function UserDetail({ user, onBack, onAdjustPoints }) {
  return (
    <div>
      <button onClick={onBack} className="text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-2">
        ← वापस
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">यूज़र जानकारी</h2>
          <p><span className="text-gray-400">ID:</span> {user.user?.id}</p>
          <p><span className="text-gray-400">नाम:</span> {user.user?.name || '—'}</p>
          <p><span className="text-gray-400">ईमेल:</span> {user.user?.email}</p>
          <p><span className="text-gray-400">जॉइन:</span> {user.user?.created_at ? new Date(user.user.created_at).toLocaleDateString() : '—'}</p>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-3xl font-bold text-yellow-400">{user.points?.balance || 0}</p>
            <p className="text-sm text-gray-400">पॉइंट्स बैलेंस</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-green-400">कमाए: {user.points?.total_earned || 0}</span>
              <span className="text-red-400">खर्च: {user.points?.total_spent || 0}</span>
            </div>
            <button
              onClick={() => onAdjustPoints(user)}
              className="mt-4 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            >
              पॉइंट्स एडजस्ट करें
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">💰 हाल के ट्रांजेक्शन्स</h2>
          {user.transactions?.length === 0 ? (
            <p className="text-gray-500 text-sm">कोई ट्रांजेक्शन नहीं</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {user.transactions?.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 text-sm">
                  <div>
                    <span className={`font-medium ${t.type === 'earn' || t.type === 'recharge' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'earn' || t.type === 'recharge' ? '+' : '-'}{t.amount}
                    </span>
                    <p className="text-gray-400 text-xs">{t.description}</p>
                  </div>
                  <span className="text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">📝 यूज़र के रिजल्ट</h2>
          {user.results?.length === 0 ? (
            <p className="text-gray-500 text-sm">कोई रिजल्ट नहीं</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {user.results?.map((r) => (
                <div key={r.id} className="bg-gray-700/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Score: {r.score}</span>
                    <span className="text-indigo-400">Rank #{r.rank}</span>
                  </div>
                  <p className="text-gray-400 text-xs">रोल: {r.roll_number} | {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PointsAdjustModal({ user, onClose, onSave }) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">पॉइंट्स एडजस्ट करें</h3>
        <p className="text-sm text-gray-400 mb-4">
          यूज़र: {user.user?.name || user.user?.email} (ID: {user.user?.id})
          <br />वर्तमान बैलेंस: {user.points?.balance || 0}
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">अमाउंट (पॉइंट्स)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white"
              placeholder="सकारात्मक = जोड़ें, नकारात्मक = घटाएं"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">कारण</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white"
              placeholder="जैसे: बोनस, रिफंड, पेनल्टी..."
            />
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600">
              रद्द करें
            </button>
            <button
              onClick={() => onSave(user.user.id, amount, description)}
              className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              सेव करें
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== EXAMS COMPONENT ====================
function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', date: '', total_questions: 100 });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/exams');
      const data = await res.json();
      setExams(data.exams);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addExam = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:5000/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam)
      });
      setShowAdd(false);
      setNewExam({ name: '', date: '', total_questions: 100 });
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteExam = async (id) => {
    if (!confirm('क्या आप इस परीक्षा को डिलीट करना चाहते हैं? सभी संबंधित रिजल्ट भी डिलीट होंगे।')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/exams/${id}`, { method: 'DELETE' });
      fetchExams();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📚 परीक्षाएं</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
        >
          + नई परीक्षा
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addExam} className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">नई परीक्षा जोड़ें</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">परीक्षा का नाम</label>
              <input
                type="text"
                value={newExam.name}
                onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">तारीख</label>
              <input
                type="date"
                value={newExam.date}
                onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">कुल प्रश्न</label>
              <input
                type="number"
                value={newExam.total_questions}
                onChange={(e) => setNewExam({ ...newExam, total_questions: parseInt(e.target.value) || 100 })}
                className="w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm">
              सेव करें
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-sm">
              रद्द करें
            </button>
          </div>
        </form>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">नाम</th>
              <th className="p-3 text-left">तारीख</th>
              <th className="p-3 text-left">प्रश्न</th>
              <th className="p-3 text-left">रिजल्ट</th>
              <th className="p-3 text-left">एक्शन</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="p-3">{e.id}</td>
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3 text-gray-400">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                <td className="p-3">{e.total_questions}</td>
                <td className="p-3">{e.results_count}</td>
                <td className="p-3">
                  <button onClick={() => deleteExam(e.id)} className="text-red-400 hover:text-red-300 text-sm">
                    डिलीट
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== RESULTS COMPONENT ====================
function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [page, search]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/results?page=${page}&per_page=20&search=${search}`);
      const data = await res.json();
      setResults(data.results);
      setTotalPages(data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchResultDetail = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/results/${id}`);
      const data = await res.json();
      setSelectedResult(data);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteResult = async (id) => {
    if (!confirm('क्या आप इस रिजल्ट को डिलीट करना चाहते हैं?')) return;
    try {
      await fetch(`http://localhost:5000/api/admin/results/${id}`, { method: 'DELETE' });
      fetchResults();
    } catch (e) {
      console.error(e);
    }
  };

  if (selectedResult) {
    const r = selectedResult.result;
    const qs = selectedResult.questions || [];
    return (
      <div>
        <button onClick={() => setSelectedResult(null)} className="text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-2">
          ← वापस
        </button>

        {/* Candidate Info */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {r.photo_url && (
              <img src={r.photo_url} alt="Photo" className="w-24 h-28 rounded-lg object-cover border border-gray-600" />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              <div>
                <p className="text-xs text-gray-400">Registration Number</p>
                <p className="font-mono text-sm">{r.registration_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Roll Number</p>
                <p className="font-mono text-sm">{r.roll_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Candidate Name</p>
                <p className="font-medium">{r.candidate_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Community</p>
                <p>{r.community || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Test Centre</p>
                <p>{r.test_centre_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Test Date</p>
                <p>{r.test_date || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Test Time</p>
                <p>{r.test_time || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Subject</p>
                <p>{r.subject || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Score</p>
            <p className="text-2xl font-bold text-indigo-400">{r.score}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Rank</p>
            <p className="text-2xl font-bold text-purple-400">#{r.rank}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Percentile</p>
            <p className="text-2xl font-bold text-pink-400">{r.percentile}%</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">Category</p>
            <p className="text-2xl font-bold text-amber-400">{r.category}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-600/20 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">सही</p>
            <p className="text-2xl font-bold text-green-400">{selectedResult.stats?.correct || r.total_correct}</p>
          </div>
          <div className="bg-red-600/20 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">गलत</p>
            <p className="text-2xl font-bold text-red-400">{selectedResult.stats?.wrong || r.total_wrong}</p>
          </div>
          <div className="bg-gray-600/20 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-400">नहीं किया</p>
            <p className="text-2xl font-bold text-gray-400">{selectedResult.stats?.unattempted || r.total_unattempted}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="font-bold mb-4">प्रश्न ({qs.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {qs.map((q) => {
              const status = q.student_answer === q.correct_answer ? 'correct' : q.student_answer ? 'wrong' : 'unattempted';
              const statusColor = status === 'correct' ? 'bg-green-600/20 border-green-600' : status === 'wrong' ? 'bg-red-600/20 border-red-600' : 'bg-gray-600/20 border-gray-600';
              return (
                <div key={q.id} className={`${statusColor} border rounded-lg p-3 text-sm`}>
                  <div className="flex justify-between">
                    <span className="font-medium">Q{q.question_no}</span>
                    <span className={`font-medium ${status === 'correct' ? 'text-green-400' : status === 'wrong' ? 'text-red-400' : 'text-gray-400'}`}>
                      {status === 'correct' ? '✅' : status === 'wrong' ? '❌' : '⏳'} {q.marks_awarded} marks
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{q.question_text || ''}</p>
                  <p className="text-gray-400 mt-1">
                    {q.student_answer ? `आपका: ${q.student_answer}${q.student_option_text ? ' - ' + q.student_option_text : ''}` : 'नहीं किया'}
                  </p>
                  <p className="text-green-400">सही: {q.correct_answer}{q.correct_option_text ? ' - ' + q.correct_option_text : ''}</p>
                  {q.question_id_html && <p className="text-gray-600 text-xs mt-1">ID: {q.question_id_html}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📋 रिजल्ट मैनेजमेंट</h1>

      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="रोल नंबर से खोजें..."
          className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">रोल नं.</th>
              <th className="p-3 text-left">Score</th>
              <th className="p-3 text-left">Rank</th>
              <th className="p-3 text-left">Percentile</th>
              <th className="p-3 text-left">कैटेगरी</th>
              <th className="p-3 text-left">प्रश्न</th>
              <th className="p-3 text-left">तारीख</th>
              <th className="p-3 text-left">एक्शन</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="p-3">{r.id}</td>
                <td className="p-3 font-mono text-xs">{r.roll_number}</td>
                <td className="p-3">{r.score}</td>
                <td className="p-3 text-purple-400">#{r.rank}</td>
                <td className="p-3">{r.percentile}%</td>
                <td className="p-3">{r.category}</td>
                <td className="p-3">{r.questions_count}</td>
                <td className="p-3 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <button onClick={() => fetchResultDetail(r.id)} className="text-indigo-400 hover:text-indigo-300 mr-2">
                    देखें
                  </button>
                  <button onClick={() => deleteResult(r.id)} className="text-red-400 hover:text-red-300">
                    हटाएं
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded ${page === p ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}


// ==================== QUESTIONS COMPONENT (Master Questions) ====================
function Questions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedQ, setSelectedQ] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [hasSolution, setHasSolution] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [subject, setSubject] = useState('');
  const [shiftDate, setShiftDate] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { fetchQuestions(); }, [page, perPage, search, sortBy, hasSolution, correctAnswer, subject, shiftDate]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/admin/master-questions?page=${page}&per_page=${perPage}&sort_by=${sortBy}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (hasSolution) url += `&has_solution=${hasSolution}`;
      if (correctAnswer) url += `&correct_answer=${correctAnswer}`;
      if (subject) url += `&subject=${encodeURIComponent(subject)}`;
      if (shiftDate) url += `&shift_date=${shiftDate}`;
      const res = await fetch(url);
      const data = await res.json();
      setItems(Array.isArray(data.questions) ? data.questions : []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); setItems([]); }
    finally { setLoading(false); }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelectedQ(null);
    setEditMode(false);
    setAiSuggestion(null);
    setBulkResults(null);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/master-questions/${id}`);
      const data = await res.json();
      setSelectedQ(data);
      setEditData({
        question_text: data.question_text || '',
        correct_answer: data.correct_answer || '',
        correct_option_text: data.correct_option_text || '',
        question_id_html: data.question_id_html || '',
        option_a_text: data.option_a_text || '',
        option_b_text: data.option_b_text || '',
        option_c_text: data.option_c_text || '',
        option_d_text: data.option_d_text || '',
      });
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const saveEdit = async () => {
    if (!selectedQ) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/master-questions/${selectedQ.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        showToast('✅ प्रश्न सफलतापूर्वक अपडेट हुआ!');
        setEditMode(false);
        openDetail(selectedQ.id);
        fetchQuestions();
      } else {
        showToast('❌ Save करने में error आई', 'error');
      }
    } catch (e) { showToast('❌ Network error', 'error'); }
    finally { setSaving(false); }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setEditData({
      question_text: aiSuggestion.question_text || editData.question_text,
      correct_answer: aiSuggestion.correct_answer || editData.correct_answer,
      option_a_text: aiSuggestion.option_a || editData.option_a_text,
      option_b_text: aiSuggestion.option_b || editData.option_b_text,
      option_c_text: aiSuggestion.option_c || editData.option_c_text,
      option_d_text: aiSuggestion.option_d || editData.option_d_text,
      correct_option_text: editData.correct_option_text,
      question_id_html: editData.question_id_html,
    });
    setEditMode(true);
    setAiSuggestion(null);
    showToast('🤖 AI सुझाव apply हुआ! अब review करके Save करें।', 'info');
  };

  const runAiEdit = async () => {
    if (!selectedQ) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/master-questions/${selectedQ.id}/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_apply: false }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
        showToast('🤖 AI सुझाव मिल गया! नीचे देखें।', 'info');
      } else {
        showToast('❌ AI: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (e) { showToast('❌ AI edit failed', 'error'); }
    finally { setAiLoading(false); }
  };

  const toggleBulkSelect = (id) => {
    setBulkSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const runBulkAiEdit = async (autoApply = false) => {
    if (bulkSelected.length === 0) return;
    setBulkLoading(true);
    setBulkResults(null);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/master-questions/bulk-ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: bulkSelected, auto_apply: autoApply }),
      });
      const data = await res.json();
      setBulkResults(data);
      if (autoApply) fetchQuestions();
      showToast(`🤖 ${data.processed} प्रश्नों की bulk edit complete!`, 'info');
    } catch (e) { showToast('❌ Bulk AI edit failed', 'error'); }
    finally { setBulkLoading(false); }
  };

  const runBulkDeleteQuestions = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`क्या आप वाकई ${bulkSelected.length} Questions और उनके सारे Responses/Solutions delete करना चाहते हैं?`)) return;
    
    setBulkLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/master-questions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: bulkSelected }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ ${data.deleted} Questions deleted`, 'success');
        setBulkSelected([]);
        if (page === 1) {
          fetchQuestions();
        } else {
          setPage(1);
        }
      } else {
        showToast('❌ Error: ' + (data.error || ''), 'error');
      }
    } catch (e) { showToast('❌ Delete failed', 'error'); } finally { setBulkLoading(false); }
  };

  const deleteQuestion = async (id, fromDetail = false) => {
    if (!confirm(`❗ क्या आप MQ #${id} को permanently delete करना चाहते हैं?\nयह question और उससे जुड़े सभी student responses भी delete हो जाएंगे!`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/master-questions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ MQ #${id} delete हो गया।`, 'info');
        if (fromDetail) setSelectedQ(null);
        fetchQuestions();
        setBulkSelected(prev => prev.filter(x => x !== id));
      } else {
        showToast('❌ Delete में error: ' + (data.error || ''), 'error');
      }
    } catch (e) { showToast('❌ Delete failed', 'error'); }
  };

  const answerColor = { A: 'text-blue-400', B: 'text-purple-400', C: 'text-amber-400', D: 'text-rose-400' };

  // ── Detail Modal ──────────────────────────────────────────────────────────
  if (detailLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (selectedQ) {
    return (
      <div>
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
            ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-indigo-600' : 'bg-green-600'}`}>
            {toast.msg}
          </div>
        )}

        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedQ(null)} className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 text-sm">
            ← वापस सूची पर
          </button>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 text-sm">MQ #{selectedQ.id}</span>
          {selectedQ.question_id_html && (
            <span className="font-mono text-xs bg-gray-700 px-2 py-0.5 rounded text-indigo-300">{selectedQ.question_id_html}</span>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={runAiEdit} disabled={aiLoading}
              className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {aiLoading ? <span className="animate-spin">⏳</span> : '🤖'} AI Edit
            </button>
            <button onClick={() => setEditMode(!editMode)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${editMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
              {editMode ? '✕ Cancel' : '✏️ Edit'}
            </button>
            {editMode && (
              <button onClick={saveEdit} disabled={saving}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-sm font-medium disabled:opacity-50">
                {saving ? '⏳...' : '💾 Save'}
              </button>
            )}
            <button onClick={() => deleteQuestion(selectedQ.id, true)}
              className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-sm font-medium">
              🗑️ Delete
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Reference Count</p>
            <p className="text-2xl font-bold text-indigo-400">{selectedQ.reference_count}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Shift Count</p>
            <p className="text-2xl font-bold text-purple-400">{selectedQ.shift_count}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Correct Answer</p>
            <p className={`text-2xl font-bold ${answerColor[selectedQ.correct_answer] || 'text-green-400'}`}>{selectedQ.correct_answer}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">AI Solution</p>
            <p className="text-2xl">{selectedQ.has_solution ? '✅' : '❌'}</p>
          </div>
        </div>

        {/* Question & Options */}
        <div className="bg-gray-800 rounded-xl p-6 mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">प्रश्न</h3>
          {editMode ? (
            <textarea value={editData.question_text} onChange={e => setEditData(p => ({ ...p, question_text: e.target.value }))}
              className="w-full bg-gray-900 border border-indigo-500 rounded-lg p-3 text-sm text-white resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          ) : (
            <p className="text-white leading-relaxed">{selectedQ.question_text}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {['a', 'b', 'c', 'd'].map((opt) => {
              const key = `option_${opt}_text`;
              const idKey = `option_${opt}_id`;
              const label = opt.toUpperCase();
              const isCorrect = selectedQ.correct_answer === label;
              return (
                <div key={opt} className={`p-3 rounded-lg border relative ${isCorrect ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-900'}`}>
                  {selectedQ[idKey] && (
                    <div className="absolute top-1 right-2 text-[10px] text-gray-500 font-mono">
                      ID: {selectedQ[idKey]}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className={`font-bold text-xs mr-2 ${answerColor[label]}`}>{label}.</span>
                    {editMode ? (
                      <input value={editData[key]} onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
                        className="bg-transparent border-b border-gray-600 text-sm text-white w-[85%] focus:outline-none focus:border-indigo-400" />
                    ) : (
                      <span className={`text-sm ${isCorrect ? 'text-green-300' : 'text-gray-300'}`}>{selectedQ[key] || '—'}</span>
                    )}
                    {isCorrect && <span className="ml-2 text-xs text-green-400">✓ सही उत्तर</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Edit extra fields */}
          {editMode && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Correct Answer (A/B/C/D)</label>
                <select value={editData.correct_answer} onChange={e => setEditData(p => ({ ...p, correct_answer: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white">
                  {['A', 'B', 'C', 'D'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Correct Option Text</label>
                <input value={editData.correct_option_text} onChange={e => setEditData(p => ({ ...p, correct_option_text: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">HTML Element ID</label>
                <input value={editData.question_id_html} onChange={e => setEditData(p => ({ ...p, question_id_html: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-indigo-300" />
              </div>
            </div>
          )}
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div className="bg-purple-900/30 border border-purple-600 rounded-xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-purple-300">🤖 AI सुझाव</h3>
              <div className="flex gap-2">
                <button onClick={applyAiSuggestion} className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs">Apply & Review</button>
                <button onClick={() => setAiSuggestion(null)} className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs">✕ Close</button>
              </div>
            </div>
            {aiSuggestion.notes && <p className="text-xs text-purple-200 mb-3 italic">{aiSuggestion.notes}</p>}
            <p className="text-sm text-white mb-2"><span className="text-gray-400">Q:</span> {aiSuggestion.question_text}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['a', 'b', 'c', 'd'].map(o => (
                <div key={o} className="bg-gray-800 rounded p-2">
                  <span className="text-purple-400 font-bold">{o.toUpperCase()}.</span> {aiSuggestion[`option_${o}`] || '—'}
                </div>
              ))}
            </div>
            <p className="text-xs text-green-400 mt-2">✓ Suggested Answer: <strong>{aiSuggestion.correct_answer}</strong></p>
          </div>
        )}

        {/* Shifts */}
        {selectedQ.shifts && selectedQ.shifts.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">📅 Shifts ({selectedQ.shifts.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedQ.shifts.map((s, i) => (
                <div key={i} className="bg-gray-700 rounded-lg px-3 py-2 text-xs">
                  <p className="text-indigo-300 font-medium">{s.test_date} · {s.test_time}</p>
                  <p className="text-gray-400">{s.subject}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Solution */}
        {selectedQ.solution && (
          <div className="bg-gray-800 rounded-xl p-5 mb-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">💡 AI Solution</h3>
            <p className="text-sm text-gray-300 mb-2">{selectedQ.solution.explanation}</p>
            {selectedQ.solution.why_wrong && <p className="text-sm text-red-300"><span className="font-medium">Why Wrong:</span> {selectedQ.solution.why_wrong}</p>}
            {selectedQ.solution.key_takeaways && (
              <ul className="mt-2 space-y-1">
                {selectedQ.solution.key_takeaways.map((t, i) => <li key={i} className="text-xs text-green-300">• {t}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Student Responses */}
        {selectedQ.responses && selectedQ.responses.length > 0 && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">👥 Student Responses ({selectedQ.responses.length})</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3 text-left">Roll No.</th>
                  <th className="p-3 text-left">Candidate</th>
                  <th className="p-3 text-left">Q No.</th>
                  <th className="p-3 text-left">Student Answer</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Marks</th>
                </tr>
              </thead>
              <tbody>
                {selectedQ.responses.map((r) => (
                  <tr key={r.response_id} className="border-t border-gray-700">
                    <td className="p-3 font-mono">{r.roll_number || '—'}</td>
                    <td className="p-3">{r.candidate_name || '—'}</td>
                    <td className="p-3">{r.question_no}</td>
                    <td className="p-3">
                      <span className={r.student_answer === selectedQ.correct_answer ? 'text-green-400' : r.student_answer ? 'text-red-400' : 'text-gray-500'}>
                        {r.student_answer || 'Unattempted'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === 'correct' ? 'bg-green-800 text-green-300' : r.status === 'wrong' ? 'bg-red-800 text-red-300' : 'bg-gray-700 text-gray-400'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">{r.marks_awarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── List View ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-indigo-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">❓ Master Questions <span className="text-sm font-normal text-gray-400 ml-2">{total} कुल</span></h1>
        {bulkSelected.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-indigo-400">{bulkSelected.length} selected</span>
            <button onClick={() => runBulkAiEdit(false)} disabled={bulkLoading}
              className="px-3 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-xs font-medium disabled:opacity-50">
              {bulkLoading ? '⏳...' : '🤖 AI Preview'}
            </button>
            <button onClick={() => runBulkAiEdit(true)} disabled={bulkLoading}
              className="px-3 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-xs font-medium disabled:opacity-50">
              {bulkLoading ? '⏳...' : '🤖 AI Apply All'}
            </button>
            <button onClick={runBulkDeleteQuestions} disabled={bulkLoading}
              className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-medium disabled:opacity-50">
              🗑️ Bulk Delete
            </button>
            <button onClick={() => { setBulkSelected([]); setBulkResults(null); }}
              className="px-3 py-2 rounded-xl bg-gray-700 text-xs">✕ Clear</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="🔍 प्रश्न खोजें..." className="col-span-2 px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none">
          <option value="created_at">📅 नवीनतम</option>
          <option value="reference_count">🔢 Reference Count</option>
          <option value="shift_count">📋 Shift Count</option>
        </select>
        <select value={hasSolution} onChange={e => { setHasSolution(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none">
          <option value="">💡 All Solutions</option>
          <option value="true">✅ Has Solution</option>
          <option value="false">❌ No Solution</option>
        </select>
        <select value={correctAnswer} onChange={e => { setCorrectAnswer(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none">
          <option value="">🎯 All Answers</option>
          {['A', 'B', 'C', 'D'].map(v => <option key={v} value={v}>Answer: {v}</option>)}
        </select>
        <input value={subject} onChange={e => { setSubject(e.target.value); setPage(1); }}
          placeholder="📚 Exam Name..." className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none" />
        <input type="text" value={shiftDate} onChange={e => { setShiftDate(e.target.value); setPage(1); }}
          placeholder="🗓️ Date (DD/MM/YYYY)" className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white focus:outline-none" />
      </div>

      {/* Bulk AI Results */}
      {bulkResults && (
        <div className="bg-purple-900/30 border border-purple-600 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-purple-300">🤖 Bulk AI Results — {bulkResults.processed} processed</h4>
            <button onClick={() => setBulkResults(null)} className="text-gray-400 text-xs">✕</button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {bulkResults.results?.map((r, i) => (
              <div key={i} className={`text-xs px-3 py-1 rounded ${r.success ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                MQ #{r.id}: {r.success ? `✅ ${r.data?.notes || 'Edited'}` : `❌ ${r.error}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 w-8">
                <input type="checkbox" onChange={e => {
                  if (e.target.checked) {
                    setBulkSelected(prev => [...new Set([...prev, ...items.map(i => i.id)])]);
                  } else {
                    const itemIds = items.map(i => i.id);
                    setBulkSelected(prev => prev.filter(id => !itemIds.includes(id)));
                  }
                }}
                checked={items.length > 0 && items.every(i => bulkSelected.includes(i.id))}
                className="rounded" />
              </th>
              <th className="p-3 text-left">ID / HTML ID</th>
              <th className="p-3 text-left">प्रश्न</th>
              <th className="p-3 text-left">Ans</th>
              <th className="p-3 text-center">Refs</th>
              <th className="p-3 text-center">Shifts</th>
              <th className="p-3 text-center">AI Sol.</th>
              <th className="p-3 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">कोई प्रश्न नहीं मिला</td></tr>
            ) : items.map((q) => (
              <tr key={q.id} className="border-t border-gray-700 hover:bg-gray-750 cursor-pointer"
                onClick={(e) => { if (e.target.type !== 'checkbox') openDetail(q.id); }}>
                <td className="p-3" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={bulkSelected.includes(q.id)}
                    onChange={() => toggleBulkSelect(q.id)} className="rounded" />
                </td>
                <td className="p-3">
                  <p className="text-gray-300">#{q.id}</p>
                  {q.question_id_html && <p className="font-mono text-xs text-indigo-400 truncate max-w-[100px]">{q.question_id_html}</p>}
                </td>
                <td className="p-3 max-w-xs">
                  <p className="text-gray-200 truncate">{q.question_text || '—'}</p>
                </td>
                <td className="p-3">
                  <span className={`font-bold ${answerColor[q.correct_answer] || 'text-white'}`}>{q.correct_answer}</span>
                </td>
                <td className="p-3 text-center">
                  <span className="bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded-full text-xs">{q.reference_count}</span>
                </td>
                <td className="p-3 text-center">
                  <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full text-xs">{q.shift_count}</span>
                </td>
                <td className="p-3 text-center">
                  {q.has_solution ? <span className="text-green-400">✅</span> : <span className="text-gray-600">—</span>}
                </td>
                <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                  <button onClick={() => deleteQuestion(q.id)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-900/30 px-2 py-1 rounded-lg text-xs transition">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <div className="mt-4 flex justify-between items-center bg-gray-800 p-3 rounded-xl flex-wrap">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Rows per page:</span>
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="bg-gray-700 text-white rounded px-2 py-1">
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40">‹</button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-3 py-1 rounded ${page === p ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40">›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PARSED DATA COMPONENT ====================
function ParsedData() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchParsed();
  }, [search]);

  const fetchParsed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/results?page=1&per_page=50&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/results/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🧩 पैरस्ड डेटा</h1>
        <p className="text-sm text-gray-400">Candidate + Question payloads from HTML parser</p>
      </div>

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="रोल / रजिस्ट्रेशन / नाम / subject से खोजें"
          className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {selected ? (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="text-indigo-400 hover:text-indigo-300">← वापस</button>
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Candidate Metadata</h2>
            <pre className="text-xs whitespace-pre-wrap break-all text-gray-300">{JSON.stringify(selected.result, null, 2)}</pre>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Question Payloads</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selected.questions?.map((q, index) => (
                <div key={q.id} className="border border-gray-700 rounded-lg p-3">
                  <p className="text-sm font-medium text-indigo-300">Q{q.question_no}</p>
                  <p className="text-sm text-white mt-1">{q.question_text}</p>
                  <pre className="text-[11px] mt-2 whitespace-pre-wrap break-all text-gray-400">{JSON.stringify(q.parsed_payload || {}, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-3 text-left">Roll</th>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Application Photo</th>
                <th className="p-3 text-left">Parser</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">लोड हो रहा है...</td></tr>
              ) : results.map((r) => (
                <tr key={r.id} className="border-t border-gray-700 hover:bg-gray-750">
                  <td className="p-3 font-mono text-xs">{r.roll_number}</td>
                  <td className="p-3">{r.candidate_name || '—'}</td>
                  <td className="p-3">{r.subject || '—'}</td>
                  <td className="p-3 text-gray-400">{r.application_photograph ? '✅' : '—'}</td>
                  <td className="p-3 text-gray-400">{r.parser_version || '—'}</td>
                  <td className="p-3">
                    <button onClick={() => openDetail(r.id)} className="text-indigo-400 hover:text-indigo-300">देखें</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================== TRANSACTIONS COMPONENT ====================
function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [page, userId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/admin/transactions?page=${page}&per_page=20`;
      if (userId) url += `&user_id=${userId}`;
      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data.transactions);
      setTotalPages(data.pages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">💳 ट्रांजेक्शन हिस्ट्री</h1>

      <div className="mb-6">
        <input
          type="text"
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setPage(1); }}
          placeholder="User ID से फ़िल्टर करें..."
          className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">User ID</th>
              <th className="p-3 text-left">टाइप</th>
              <th className="p-3 text-left">अमाउंट</th>
              <th className="p-3 text-left">विवरण</th>
              <th className="p-3 text-left">तारीख</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t border-gray-700 hover:bg-gray-750">
                <td className="p-3">{t.id}</td>
                <td className="p-3">{t.user_id}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.type === 'earn' || t.type === 'recharge'
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-red-600/20 text-red-400'
                    }`}>
                    {t.type}
                  </span>
                </td>
                <td className="p-3 font-medium">{t.type === 'earn' || t.type === 'recharge' ? '+' : '-'}{t.amount}</td>
                <td className="p-3 text-gray-400">{t.description || '—'}</td>
                <td className="p-3 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-1 rounded ${page === p ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}