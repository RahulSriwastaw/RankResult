import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaShieldAlt, FaTachometerAlt, FaUsers, FaBook, FaClipboardList,
  FaQuestionCircle, FaMoneyBillWave, FaSignOutAlt, FaBars, FaTimes,
  FaBox, FaDatabase, FaCoins, FaSearch, FaDownload,
  FaPlus, FaTrash, FaEdit, FaEye, FaArrowLeft,
  FaChevronLeft, FaChevronRight, FaCog, FaExclamationTriangle,
  FaRobot, FaUserPlus, FaChartBar, FaCheckCircle,
  FaHome, FaChartLine
} from 'react-icons/fa';
import { cn } from '../../lib/utils';

const API = 'http://localhost:5000/api/admin';

// ─── LAYOUT ──────────────────────────────────────────────────────────
export default function AdminLayout() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sidebar, setSidebar] = useState(false);
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') setAuthed(true);
  }, []);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="card p-6 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[rgb(var(--primary))] flex items-center justify-center mx-auto shadow-lg shadow-[rgb(var(--primary))/0.3]">
                <FaShieldAlt className="text-xl text-white" />
              </div>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
              <p className="text-sm text-[rgb(var(--muted-foreground))]">RankVeda Administration</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); if (password === 'admin123') { sessionStorage.setItem('admin_auth', 'true'); setAuthed(true); setError(''); } else setError('Incorrect password'); }} className="space-y-4">
              <div className="space-y-2">
                <label className="label">Password</label>
                <div className="relative">
                  <FaCog className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))] w-4 h-4" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input pl-9" placeholder="Enter admin password" autoFocus />
                </div>
              </div>
              {error && <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400"><FaExclamationTriangle className="w-4 h-4 shrink-0" />{error}</div>}
              <button type="submit" className="btn-primary w-full"><FaArrowLeft className="w-4 h-4 rotate-180" /> Sign In</button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { id: 'users', icon: FaUsers, label: 'Users' },
    { id: 'exams', icon: FaBook, label: 'Exams' },
    { id: 'packs', icon: FaBox, label: 'Packs' },
    { id: 'results', icon: FaClipboardList, label: 'Results' },
    { id: 'questions', icon: FaQuestionCircle, label: 'Questions' },
    { id: 'parsed', icon: FaDatabase, label: 'Parsed' },
    { id: 'transactions', icon: FaMoneyBillWave, label: 'Transactions' },
    { id: 'pointspacks', icon: FaCoins, label: 'Points' },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--primary))] flex items-center justify-center"><FaShieldAlt className="text-sm text-white" /></div>
          <span className="font-semibold text-sm">RankVeda</span>
        </div>
        <button onClick={() => setSidebar(!sidebar)} className="btn-ghost p-2">
          {sidebar ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebar && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebar(false)} />}

      {/* Sidebar / Drawer */}
      <aside className={cn(
        'fixed md:sticky top-0 z-40 h-full w-56 bg-[rgb(var(--card))] border-r border-[rgb(var(--border))] flex flex-col transition-transform duration-200',
        'md:translate-x-0',
        sidebar ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="hidden md:flex items-center gap-2.5 p-4 border-b border-[rgb(var(--border))]">
          <div className="w-9 h-9 rounded-lg bg-[rgb(var(--primary))] flex items-center justify-center shadow-lg"><FaShieldAlt className="text-base text-white" /></div>
          <div><h2 className="font-semibold text-sm">RankVeda</h2><p className="text-[10px] text-[rgb(var(--muted-foreground))]">Admin Panel</p></div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item, i) => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebar(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                tab === item.id
                  ? 'bg-[rgb(var(--primary))/0.1] text-[rgb(var(--primary))] font-medium'
                  : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--accent))] hover:text-[rgb(var(--accent-foreground))]'
              )}>
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-[rgb(var(--border))]">
          <button onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthed(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
            <FaSignOutAlt size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))] flex overflow-x-auto scrollbar-thin safe-area-bottom">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setSidebar(false); }}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] min-w-[56px] flex-shrink-0 transition-colors',
              tab === item.id ? 'text-[rgb(var(--primary))]' : 'text-[rgb(var(--muted-foreground))]'
            )}>
            <item.icon size={16} />
            <span className="truncate max-w-[56px]">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {tab === 'dashboard' && <Dashboard />}
              {tab === 'users' && <Users />}
              {tab === 'exams' && <Exams />}
              {tab === 'packs' && <Packs />}
              {tab === 'results' && <Results />}
              {tab === 'questions' && <Questions />}
              {tab === 'parsed' && <ParsedData />}
              {tab === 'transactions' && <Transactions />}
              {tab === 'pointspacks' && <PointsPacks />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-4 flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color)}>
        <Icon className="text-base text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[rgb(var(--muted-foreground))] truncate">{label}</p>
        <p className="text-lg font-bold mt-0.5">{value}</p>
      </div>
    </motion.div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-[rgb(var(--border))] border-t-[rgb(var(--primary))] animate-spin" />
    </div>
  );
}

function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-[rgb(var(--muted-foreground))] mt-0.5 truncate">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{children}</div>}
    </div>
  );
}

function TablePagination({ page, totalPages, perPage, setPerPage, setPage, options = [20, 50, 100] }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
      <div className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))]">
        <span>Rows</span>
        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="input h-8 w-16 text-xs">
          {options.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn-ghost h-8 w-8 p-0"><FaChevronLeft size={12} /></button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => setPage(p)}
            className={cn('h-8 w-8 rounded-lg text-sm transition-colors', page === p ? 'bg-[rgb(var(--primary))] text-white' : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--accent))]')}>{p}</button>
        ))}
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-ghost h-8 w-8 p-0"><FaChevronRight size={12} /></button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try { const res = await fetch(`${API}/dashboard`); setStats(await res.json()); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  const cards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: FaUsers, color: 'bg-indigo-500' },
    { label: 'Total Exams', value: stats?.total_exams || 0, icon: FaBook, color: 'bg-purple-500' },
    { label: 'Total Results', value: stats?.total_results || 0, icon: FaChartBar, color: 'bg-emerald-500' },
    { label: 'Total Questions', value: stats?.total_questions || 0, icon: FaQuestionCircle, color: 'bg-pink-500' },
    { label: 'AI Solutions', value: stats?.total_solutions || 0, icon: FaRobot, color: 'bg-amber-500' },
    { label: "Today's Results", value: stats?.today_results || 0, icon: FaClipboardList, color: 'bg-cyan-500' },
    { label: "Today's Signups", value: stats?.today_users || 0, icon: FaUserPlus, color: 'bg-teal-500' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Platform overview at a glance" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((card, i) => <StatCard key={i} {...card} />)}
      </div>
      <div className="card p-4 sm:p-5 mt-4">
        <h2 className="text-sm font-semibold mb-4">Points Economy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4"><p className="text-xs text-[rgb(var(--muted-foreground))] mb-1">Total Earned</p><p className="text-xl font-bold text-emerald-400">{stats?.total_points_earned || 0}</p></div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4"><p className="text-xs text-[rgb(var(--muted-foreground))] mb-1">Total Spent</p><p className="text-xl font-bold text-red-400">{stats?.total_points_spent || 0}</p></div>
          <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-4"><p className="text-xs text-[rgb(var(--muted-foreground))] mb-1">Net Balance</p><p className="text-xl font-bold text-indigo-400">{(stats?.total_points_earned || 0) - (stats?.total_points_spent || 0)}</p></div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS ────────────────────────────────────────────────────────────
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
  const [availablePacks, setAvailablePacks] = useState([]);
  const [assignedPackIds, setAssignedPackIds] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', points: 0 });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => { fetchUsers(); fetchAdminPacks(); }, [page, perPage, search, sortBy, dateFrom, dateTo]);

  const fetchAdminPacks = async () => {
    try { const res = await fetch(`${API}/packs`); const data = await res.json(); setAvailablePacks(Array.isArray(data.packs) ? data.packs : []); }
    catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `${API}/users?page=${page}&per_page=${perPage}&search=${search}&sort_by=${sortBy}`;
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const res = await fetch(url); const data = await res.json();
      setUsers(data.users); setTotalPages(data.pages); setTotal(data.total || 0);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreateUser = async e => {
    e.preventDefault();
    try { const res = await fetch(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) }); const data = await res.json(); if (res.ok && data.success) { setShowAdd(false); setNewUser({ name: '', email: '', password: '', points: 0 }); fetchUsers(); } else alert(data.error || 'Failed to create user'); }
    catch (err) { alert('Network error'); }
  };

  const startEditUser = u => { setEditingUserId(u.id); setEditForm({ name: u.name || '', email: u.email || '', password: '' }); };

  const handleUpdateUser = async e => {
    e.preventDefault();
    try { const res = await fetch(`${API}/users/${editingUserId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) }); const data = await res.json(); if (res.ok && data.success) { setEditingUserId(null); fetchUsers(); if (selectedUser && selectedUser.user?.id === editingUserId) fetchUserDetail(editingUserId); } else alert(data.error || 'Failed to update user'); }
    catch (err) { alert('Network error'); }
  };

  const handleDeleteUser = async userId => {
    if (!confirm('Delete this user? All their results and points balance will be deleted.')) return;
    try { const res = await fetch(`${API}/users/${userId}`, { method: 'DELETE' }); const data = await res.json(); if (res.ok && data.success) { fetchUsers(); if (selectedUser && selectedUser.user?.id === userId) setSelectedUser(null); } else alert(data.error || 'Failed to delete user'); }
    catch (err) { alert('Delete failed'); }
  };

  const runBulkDeleteUsers = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`Delete ${bulkSelected.length} users and all their data?`)) return;
    try { const res = await fetch(`${API}/users/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: bulkSelected }) }); const data = await res.json(); if (data.success) { alert(`${data.deleted} Users deleted`); setBulkSelected([]); setPage(1); } }
    catch (e) { alert('Delete failed'); }
  };

  const fetchUserDetail = async userId => {
    try { const res = await fetch(`${API}/users/${userId}`); const data = await res.json(); setSelectedUser(data); setAssignedPackIds(Array.isArray(data.packs) ? data.packs : []); }
    catch (e) { console.error(e); }
  };

  const saveUserPacks = async (userId, packIds) => {
    try { const res = await fetch(`${API}/users/${userId}/packs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pack_ids: packIds }) }); const data = await res.json(); if (data.success) { setAssignedPackIds(packIds); fetchUserDetail(userId); alert('Pack assignment saved.'); return true; } alert(data.error || 'Failed to save'); return false; }
    catch (e) { alert('Network error'); return false; }
  };

  const adjustPoints = async (userId, amount, description) => {
    if (!amount) { alert('Enter a non-zero point amount.'); return; }
    try { const txnType = amount > 0 ? 'earn' : 'spend'; const res = await fetch(`${API}/users/${userId}/points`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, description, type: txnType }) }); const data = await res.json(); if (data.success) { alert(`Points updated. New balance: ${data.new_balance}`); fetchUserDetail(userId); setAdjustModal(null); fetchUsers(); } else alert(data.error || 'Failed to adjust points'); }
    catch (e) { alert('Network error'); }
  };

  return (
    <div>
      <PageHeader title="Users" subtitle={`${total} total registered`}>
        {bulkSelected.length > 0 && <div className="flex items-center gap-2"><span className="text-xs text-[rgb(var(--primary))]">{bulkSelected.length} selected</span><button onClick={runBulkDeleteUsers} className="btn-destructive btn-sm">Bulk Delete</button><button onClick={() => setBulkSelected([])} className="btn-ghost btn-sm">Clear</button></div>}
        <button onClick={() => setShowAdd(true)} className="btn-primary"><FaPlus size={14} /> New User</button>
      </PageHeader>

      {/* Filters */}
      <div className="card p-3 mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))] w-4 h-4" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search email or name..." className="input pl-9 h-9" />
        </div>
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="input h-9 w-auto"><option value="created_at">Latest</option><option value="balance">Points</option></select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="input h-9 w-auto" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="input h-9 w-auto" />
      </div>

      {/* Add / Edit Forms */}
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreateUser} className="card p-4 mb-4 space-y-3 border-l-2 border-l-emerald-500">
          <h3 className="text-sm font-semibold flex items-center gap-2"><FaUserPlus className="text-emerald-400" /> Create New User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2"><input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="input h-9" placeholder="Name" required /><input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="input h-9" placeholder="Email" required /><input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="input h-9" placeholder="Password" required /><input type="number" value={newUser.points} onChange={e => setNewUser({ ...newUser, points: parseInt(e.target.value) || 0 })} className="input h-9" placeholder="Points" /></div>
          <div className="flex gap-2"><button type="submit" className="btn-primary btn-sm">Create</button><button type="button" onClick={() => setShowAdd(false)} className="btn-ghost btn-sm">Cancel</button></div>
        </motion.form>
      )}
      {editingUserId && (
        <motion.form initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleUpdateUser} className="card p-4 mb-4 space-y-3 border-l-2 border-l-indigo-500">
          <h3 className="text-sm font-semibold flex items-center gap-2"><FaEdit className="text-indigo-400" /> Edit User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="input h-9" placeholder="Name" required /><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="input h-9" placeholder="Email" required /><input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} className="input h-9" placeholder="New password (leave blank)" /></div>
          <div className="flex gap-2"><button type="submit" className="btn-primary btn-sm">Save</button><button type="button" onClick={() => setEditingUserId(null)} className="btn-ghost btn-sm">Cancel</button></div>
        </motion.form>
      )}

      {selectedUser ? (
        <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} onAdjustPoints={u => setAdjustModal(u)}
          availablePacks={availablePacks} assignedPackIds={assignedPackIds} setAssignedPackIds={setAssignedPackIds} saveUserPacks={saveUserPacks} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card overflow-x-auto hidden sm:block">
            <table className="w-full text-sm"><thead><tr className="border-b border-[rgb(var(--border))]">
              <th className="table-header w-10"><input type="checkbox" onChange={e => { if (e.target.checked) setBulkSelected(prev => [...new Set([...prev, ...users.map(u => u.id)])]); else { const ids = users.map(u => u.id); setBulkSelected(prev => prev.filter(id => !ids.includes(id))); } }} checked={users.length > 0 && users.every(u => bulkSelected.includes(u.id))} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] bg-transparent" /></th>
              <th className="table-header">ID</th><th className="table-header">Name</th><th className="table-header">Email</th><th className="table-header">Points</th><th className="table-header">Results</th><th className="table-header">Actions</th>
            </tr></thead>
              <tbody>{loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))/0.3] transition-colors">
                  <td className="table-cell"><input type="checkbox" checked={bulkSelected.includes(u.id)} onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id))} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" /></td>
                  <td className="table-cell text-[rgb(var(--muted-foreground))] font-mono">#{u.id}</td>
                  <td className="table-cell font-medium">{u.name || '\u2014'}</td>
                  <td className="table-cell text-[rgb(var(--muted-foreground))]">{u.email || '\u2014'}</td>
                  <td className="table-cell font-bold text-amber-400">{u.points_balance}</td>
                  <td className="table-cell"><span className="badge-info">{u.results_count}</span></td>
                  <td className="table-cell"><div className="flex items-center gap-1"><button onClick={() => fetchUserDetail(u.id)} className="btn-ghost p-1.5"><FaEye size={14} /></button><button onClick={() => setAdjustModal({ user: { id: u.id, name: u.name, email: u.email }, points: { balance: u.points_balance || 0 } })} className="btn-ghost p-1.5 text-emerald-400"><FaCoins size={14} /></button><button onClick={() => startEditUser(u)} className="btn-ghost p-1.5"><FaEdit size={14} /></button><button onClick={() => handleDeleteUser(u.id)} className="btn-ghost p-1.5 text-red-400"><FaTrash size={14} /></button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {loading ? (
              <div className="text-center py-8 text-sm text-[rgb(var(--muted-foreground))]">Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-sm text-[rgb(var(--muted-foreground))]">No users found.</div>
            ) : users.map(u => (
              <div key={u.id} className="card p-3 space-y-2">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2 min-w-0"><input type="checkbox" checked={bulkSelected.includes(u.id)} onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id))} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] shrink-0" /><div className="min-w-0"><p className="text-sm font-medium truncate">{u.name || '\u2014'}</p><p className="text-xs text-[rgb(var(--muted-foreground))] truncate">{u.email || '\u2014'}</p></div></div><span className="font-bold text-amber-400 text-sm">{u.points_balance}</span></div>
                <div className="flex items-center gap-3 text-xs text-[rgb(var(--muted-foreground))]"><span>#{u.id}</span><span className="badge-info">{u.results_count} results</span></div>
                <div className="flex items-center gap-1 pt-1 border-t border-[rgb(var(--border))]"><button onClick={() => fetchUserDetail(u.id)} className="btn-ghost btn-sm flex-1"><FaEye size={12} /> View</button><button onClick={() => setAdjustModal({ user: { id: u.id, name: u.name, email: u.email }, points: { balance: u.points_balance || 0 } })} className="btn-ghost btn-sm flex-1 text-emerald-400"><FaCoins size={12} /> Points</button><button onClick={() => startEditUser(u)} className="btn-ghost btn-sm flex-1"><FaEdit size={12} /> Edit</button><button onClick={() => handleDeleteUser(u.id)} className="btn-ghost btn-sm flex-1 text-red-400"><FaTrash size={12} /> Del</button></div>
              </div>
            ))}
          </div>

          <TablePagination page={page} totalPages={totalPages} perPage={perPage} setPerPage={setPerPage} setPage={setPage} />
        </>
      )}
      {adjustModal && <PointsAdjustModal user={adjustModal} onClose={() => setAdjustModal(null)} onSave={adjustPoints} />}
    </div>
  );
}

function UserDetail({ user, onBack, onAdjustPoints, availablePacks, assignedPackIds, setAssignedPackIds, saveUserPacks }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button onClick={onBack} className="btn-ghost mb-4 text-sm"><FaArrowLeft className="mr-1" /> Back to Users</button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-[rgb(var(--border))]">
            <div className="w-10 h-10 rounded-lg bg-[rgb(var(--primary))] flex items-center justify-center text-base font-bold text-white">{user.user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
            <div className="min-w-0"><h2 className="text-sm font-semibold truncate">{user.user?.name || '\u2014'}</h2><p className="text-xs text-[rgb(var(--muted-foreground))] truncate">{user.user?.email}</p></div>
          </div>
          <div className="space-y-1.5 text-sm"><div className="flex justify-between"><span className="text-[rgb(var(--muted-foreground))]">ID</span><span className="font-mono">#{user.user?.id}</span></div><div className="flex justify-between"><span className="text-[rgb(var(--muted-foreground))]">Joined</span><span>{user.user?.created_at ? new Date(user.user.created_at).toLocaleDateString() : '\u2014'}</span></div></div>
          <div className="pt-3 border-t border-[rgb(var(--border))] space-y-2">
            <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"><p className="text-2xl font-bold text-amber-400">{user.points?.balance || 0}</p><p className="text-xs text-[rgb(var(--muted-foreground))]">Points Balance</p></div>
            <div className="flex justify-between text-xs"><span className="text-emerald-400">Earned: {user.points?.total_earned || 0}</span><span className="text-red-400">Spent: {user.points?.total_spent || 0}</span></div>
            <button onClick={() => onAdjustPoints(user)} className="btn-primary w-full"><FaCoins size={14} /> Adjust Points</button>
          </div>
        </div>

        {/* Pack Assignment */}
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-3"><h2 className="text-sm font-semibold">Assign Question Packs</h2><button onClick={() => saveUserPacks(user.user.id, assignedPackIds)} className="btn-primary btn-sm"><FaCheckCircle size={12} /> Save</button></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availablePacks.length === 0 ? <div className="text-sm text-[rgb(var(--muted-foreground))] col-span-2 text-center py-6">No packs available.</div>
            : availablePacks.map(pack => {
              const isAssigned = assignedPackIds.includes(pack.id);
              return (
                <label key={pack.id} className={cn('cursor-pointer rounded-lg p-3 border transition-colors flex items-start gap-3', isAssigned ? 'border-[rgb(var(--primary))/0.3] bg-[rgb(var(--primary))/0.05]' : 'border-[rgb(var(--border))] hover:border-[rgb(var(--muted-foreground))/0.3]')}>
                  <input type="checkbox" checked={isAssigned} onChange={e => { const next = e.target.checked ? [...new Set([...assignedPackIds, pack.id])] : assignedPackIds.filter(id => id !== pack.id); setAssignedPackIds(next); }} className="mt-0.5 w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" />
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{pack.name}</p><p className="text-xs text-[rgb(var(--muted-foreground))] truncate mt-0.5">{pack.description || 'No description'}</p><div className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">{pack.price ? `\u20B9${pack.price} \u2022 ${pack.exam_ids?.length || 0} exams` : 'Free pack'}</div></div>
                  <span className={pack.is_active ? 'badge-success shrink-0' : 'badge-destructive shrink-0'}>{pack.is_active ? 'Active' : 'Inactive'}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card p-4"><h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><FaMoneyBillWave className="text-emerald-400" /> Recent Transactions</h2>
          {user.transactions?.length === 0 ? <p className="text-xs text-[rgb(var(--muted-foreground))] text-center py-4">No transactions</p> : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">{user.transactions?.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-[rgb(var(--accent))/0.3] p-2.5 text-sm"><div><span className={cn('font-medium', (t.type === 'earn' || t.type === 'recharge') ? 'text-emerald-400' : 'text-red-400')}>{(t.type === 'earn' || t.type === 'recharge') ? '+' : '-'}{t.amount}</span><p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">{t.description}</p></div><span className="text-xs text-[rgb(var(--muted-foreground))]">{new Date(t.created_at).toLocaleDateString()}</span></div>
            ))}</div>
          )}
        </div>

        {/* User Results */}
        <div className="card p-4"><h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><FaClipboardList className="text-indigo-400" /> Results</h2>
          {user.results?.length === 0 ? <p className="text-xs text-[rgb(var(--muted-foreground))] text-center py-4">No results</p> : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">{user.results?.map(r => (
              <div key={r.id} className="rounded-lg bg-[rgb(var(--accent))/0.3] p-2.5 text-sm"><div className="flex justify-between"><span className="font-medium">Score: <span className="text-indigo-400">{r.score}</span></span><span className="text-purple-400 font-medium">Rank #{r.rank}</span></div><p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">Roll: {r.roll_number} | {new Date(r.created_at).toLocaleDateString()}</p></div>
            ))}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function PointsAdjustModal({ user, onClose, onSave }) {
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const isPositive = amount > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3"><div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', isPositive ? 'bg-emerald-500' : 'bg-red-500')}><FaCoins className="text-lg text-white" /></div><div><h3 className="text-sm font-semibold">Adjust Points</h3><p className="text-xs text-[rgb(var(--muted-foreground))]">{user.user?.name || user.user?.email} &middot; Balance: {user.points?.balance || 0}</p></div></div>
        <div className="space-y-3"><div><label className="label text-xs">Amount</label><input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="input mt-1.5" placeholder="Positive=add, negative=subtract" autoFocus /></div><div><label className="label text-xs">Reason</label><input type="text" value={description} onChange={e => setDescription(e.target.value)} className="input mt-1.5" placeholder="e.g. Bonus, refund..." /></div></div>
        <div className="flex gap-2 pt-1"><button onClick={onClose} className="btn-ghost flex-1">Cancel</button><button onClick={() => onSave(user.user.id, amount, description)} className={cn('flex-1 btn', isPositive ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-red-500 text-white hover:bg-red-600')}>{isPositive ? 'Add Points' : 'Deduct Points'}</button></div>
      </motion.div>
    </div>
  );
}

// ─── EXAMS ────────────────────────────────────────────────────────────
function Exams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExam, setNewExam] = useState({ name: '', date: '', total_questions: 100 });
  const [bulkSelected, setBulkSelected] = useState([]);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try { const res = await fetch(`${API}/exams`); const data = await res.json(); setExams(data.exams); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const runBulkDeleteExams = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`Delete ${bulkSelected.length} exams? Related results will be deleted.`)) return;
    try { const res = await fetch(`${API}/exams/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: bulkSelected }) }); const data = await res.json(); if (data.success) { alert(`${data.deleted} Exams deleted`); setBulkSelected([]); fetchExams(); } else alert('Error: ' + (data.error || '')); } catch (e) { alert('Delete failed'); }
  };
  const addExam = async e => {
    e.preventDefault();
    try { await fetch(`${API}/exams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newExam) }); setShowAdd(false); setNewExam({ name: '', date: '', total_questions: 100 }); fetchExams(); } catch (e) { console.error(e); }
  };
  const deleteExam = async id => {
    if (!confirm('Delete this exam? Related results will be deleted.')) return;
    try { await fetch(`${API}/exams/${id}`, { method: 'DELETE' }); fetchExams(); } catch (e) { console.error(e); }
  };

  return (
    <div>
      <PageHeader title="Exams" subtitle={`${exams.length} total`}>
        {bulkSelected.length > 0 && <div className="flex items-center gap-2"><span className="text-xs text-[rgb(var(--primary))]">{bulkSelected.length} selected</span><button onClick={runBulkDeleteExams} className="btn-destructive btn-sm">Bulk Delete</button><button onClick={() => setBulkSelected([])} className="btn-ghost btn-sm">Clear</button></div>}
        <button onClick={() => setShowAdd(true)} className="btn-primary"><FaPlus size={14} /> New Exam</button>
      </PageHeader>
      {showAdd && (
        <motion.form initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} onSubmit={addExam} className="card p-4 mb-4 space-y-3 border-l-2 border-l-emerald-500">
          <h3 className="text-sm font-semibold">Add New Exam</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><input value={newExam.name} onChange={e => setNewExam({ ...newExam, name: e.target.value })} className="input h-9" placeholder="Exam name" required /><input type="date" value={newExam.date} onChange={e => setNewExam({ ...newExam, date: e.target.value })} className="input h-9" /><input type="number" value={newExam.total_questions} onChange={e => setNewExam({ ...newExam, total_questions: parseInt(e.target.value) || 100 })} className="input h-9" placeholder="Total questions" /></div>
          <div className="flex gap-2"><button type="submit" className="btn-primary btn-sm">Save</button><button type="button" onClick={() => setShowAdd(false)} className="btn-ghost btn-sm">Cancel</button></div>
        </motion.form>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b border-[rgb(var(--border))]"><th className="table-header w-10"><input type="checkbox" onChange={e => { if (e.target.checked) setBulkSelected(exams.map(ex => ex.id)); else setBulkSelected([]); }} checked={exams.length > 0 && bulkSelected.length === exams.length} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" /></th><th className="table-header">ID</th><th className="table-header">Name</th><th className="table-header">Date</th><th className="table-header">Questions</th><th className="table-header">Results</th><th className="table-header">Actions</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="7" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">Loading...</td></tr> : exams.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">No exams found.</td></tr> : exams.map(e => (
            <tr key={e.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))/0.3] transition-colors"><td className="table-cell"><input type="checkbox" checked={bulkSelected.includes(e.id)} onChange={() => setBulkSelected(prev => prev.includes(e.id) ? prev.filter(x => x !== e.id) : [...prev, e.id])} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" /></td><td className="table-cell text-[rgb(var(--muted-foreground))] font-mono">#{e.id}</td><td className="table-cell font-medium">{e.name}</td><td className="table-cell text-[rgb(var(--muted-foreground))]">{e.date ? new Date(e.date).toLocaleDateString() : '\u2014'}</td><td className="table-cell"><span className="badge-info">{e.total_questions}</span></td><td className="table-cell text-[rgb(var(--muted-foreground))]">{e.results_count}</td><td className="table-cell"><button onClick={() => deleteExam(e.id)} className="btn-ghost p-1.5 text-red-400"><FaTrash size={14} /></button></td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PACKS ────────────────────────────────────────────────────────────
function Packs() {
  const [packs, setPacks] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '0', exam_ids: [], is_active: true });
  const [editingPackId, setEditingPackId] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try { const [packsRes, examsRes] = await Promise.all([fetch(`${API}/packs`), fetch(`${API}/exams`)]); const packsData = await packsRes.json(); const examsData = await examsRes.json(); setPacks(Array.isArray(packsData.packs) ? packsData.packs : []); setExams(Array.isArray(examsData.exams) ? examsData.exams : []); }
    catch (e) { console.error(e); setError('Failed to load'); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Question Packs" subtitle="Bundle multiple exams into marketplace offers" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); setMessage(''); setError(''); try { const url = editingPackId ? `${API}/packs/${editingPackId}` : `${API}/packs`; const method = editingPackId ? 'PUT' : 'POST'; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, description: form.description, price: Number(form.price || 0), exam_ids: form.exam_ids, is_active: form.is_active }) }); const data = await res.json(); if (data.success) { setMessage(editingPackId ? 'Pack updated' : 'Pack created'); setForm({ name: '', description: '', price: '0', exam_ids: [] }); setEditingPackId(null); fetchData(); } else setError(data.error || 'Failed'); } catch (e) { setError('Network error'); } finally { setSubmitting(false); } }} className="xl:col-span-2 card p-4 space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">{editingPackId ? <FaEdit className="text-indigo-400" /> : <FaPlus className="text-emerald-400" />}{editingPackId ? 'Edit Pack' : 'New Pack'}</h2>
          {message && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-400"><FaCheckCircle className="inline mr-1" />{message}</div>}
          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400"><FaExclamationTriangle className="inline mr-1" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Pack name" required />
            <input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" placeholder="Price (INR)" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="textarea" placeholder="Description..." />
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" /><span>Active</span></label>
          <div><label className="label text-xs mb-2 block">Select Exams</label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto scrollbar-thin rounded-lg border border-[rgb(var(--border))] p-2">
              {exams.map(exam => {
                const checked = form.exam_ids.some(item => typeof item === 'object' ? item.exam_id === exam.id : item === exam.id);
                return (
                  <label key={exam.id} className={cn('flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors', checked ? 'bg-[rgb(var(--primary))/0.05]' : 'hover:bg-[rgb(var(--accent))/0.3]')}>
                    <input type="checkbox" checked={checked} onChange={() => setForm(prev => { const exists = prev.exam_ids.some(item => typeof item === 'object' ? item.exam_id === exam.id : item === exam.id); if (exists) return { ...prev, exam_ids: prev.exam_ids.filter(item => typeof item === 'object' ? item.exam_id !== exam.id : item !== exam.id) }; return { ...prev, exam_ids: [...prev.exam_ids, { exam_id: exam.id, include_questions: true, include_results: true }] }; })} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" />
                    <span>{exam.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2"><button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? 'Saving...' : editingPackId ? 'Update' : 'Create'}</button>{editingPackId && <button type="button" onClick={() => { setEditingPackId(null); setForm({ name: '', description: '', price: '0', exam_ids: [] }); setMessage(''); setError(''); }} className="btn-ghost btn-sm">Cancel</button>}</div>
        </form>
        <div className="card p-4">
          <h2 className="text-sm font-semibold mb-3">Existing Packs</h2>
          {loading ? <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}</div> : packs.length === 0 ? <div className="text-center py-8 text-sm text-[rgb(var(--muted-foreground))]">No packs created yet.</div> : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">{packs.map(pack => (
              <div key={pack.id} className="rounded-lg border border-[rgb(var(--border))] p-3 hover:border-[rgb(var(--muted-foreground))/0.3] transition-colors">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{pack.name}</p><p className="text-xs text-[rgb(var(--muted-foreground))] truncate mt-0.5">{pack.description || 'No description'}</p></div><div className="flex items-center gap-1 shrink-0"><button onClick={() => { setEditingPackId(pack.id); setForm({ name: pack.name || '', description: pack.description || '', price: (pack.price || 0).toString(), exam_ids: pack.exam_ids || [], is_active: pack.is_active !== false }); }} className="btn-ghost p-1"><FaEdit size={12} /></button><button onClick={async () => { if (!confirm('Delete this pack?')) return; try { const res = await fetch(`${API}/packs/${pack.id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) fetchData(); else setError(data.error || 'Delete failed'); } catch (e) { setError('Delete failed'); } }} className="btn-ghost p-1 text-red-400"><FaTrash size={12} /></button></div></div>
                <div className="mt-2 flex items-center gap-2 text-xs"><span className="text-[rgb(var(--muted-foreground))]">{(pack.exam_ids || []).length} exams</span><span className={pack.is_active ? 'badge-success' : 'badge-destructive'}>{pack.is_active ? 'Active' : 'Inactive'}</span><span className="text-emerald-400 font-semibold">\u20B9{pack.price || 0}</span></div>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RESULTS ──────────────────────────────────────────────────────────
function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResult, setSelectedResult] = useState(null);
  const [bulkSelected, setBulkSelected] = useState([]);

  useEffect(() => { fetchResults(); }, [page, search]);

  const fetchResults = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/results?page=${page}&per_page=20&search=${search}`); const data = await res.json(); setResults(data.results); setTotalPages(data.pages); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const runBulkDeleteResults = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`Delete ${bulkSelected.length} results?`)) return;
    try { const res = await fetch(`${API}/results/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: bulkSelected }) }); const data = await res.json(); if (data.success) { alert(`${data.deleted} Results deleted`); setBulkSelected([]); if (page === 1) fetchResults(); else setPage(1); } else alert('Error: ' + (data.error || '')); }
    catch (e) { alert('Delete failed'); }
  };

  const fetchResultDetail = async id => { try { const res = await fetch(`${API}/results/${id}`); const data = await res.json(); setSelectedResult(data); } catch (e) { console.error(e); } };
  const deleteResult = async id => { if (!confirm('Delete this result?')) return; try { await fetch(`${API}/results/${id}`, { method: 'DELETE' }); fetchResults(); } catch (e) { console.error(e); } };
  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['ID', 'Roll No', 'Score', 'Rank', 'Percentile', 'Category', 'Questions', 'Date'];
    const rows = results.map(r => [r.id, r.roll_number, r.score, r.rank, r.percentile, r.category, r.questions_count, r.created_at].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `results_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  if (selectedResult) {
    const r = selectedResult.result;
    const qs = selectedResult.questions || [];
    const sections = (() => {
      const sw = r?.section_wise;
      if (Array.isArray(sw) && sw.length > 0) return sw;
      if (sw && typeof sw === 'object' && Object.keys(sw).length > 0) return Object.entries(sw).map(([name, marks]) => ({ name, marks, total: null, na: null, right: null, wrong: null }));
      if (!qs?.length) return [];
      const groups = {};
      qs.forEach(q => { const sn = q.parsed_payload?.section_name || 'Overall'; if (!groups[sn]) groups[sn] = { name: sn, total: 0, na: 0, right: 0, wrong: 0, marks: 0 }; groups[sn].total++; if (q.student_answer && q.student_answer === q.correct_answer) { groups[sn].right++; groups[sn].marks = +(groups[sn].marks + 1).toFixed(2); } else if (q.student_answer) { groups[sn].wrong++; groups[sn].marks = +(groups[sn].marks - 1 / 3).toFixed(2); } else groups[sn].na++; });
      return Object.values(groups);
    })();

    return (
      <div>
        <button onClick={() => setSelectedResult(null)} className="btn-ghost mb-4"><FaArrowLeft className="mr-1" /> Back</button>
        {/* Score Cards - Mobile Friendly */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Score</p><p className="text-lg sm:text-xl font-bold text-indigo-400 mt-1">{r.score}</p></div>
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Rank</p><p className="text-lg sm:text-xl font-bold text-purple-400 mt-1">#{r.rank}</p></div>
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Percentile</p><p className="text-lg sm:text-xl font-bold text-pink-400 mt-1">{r.percentile}%</p></div>
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Category</p><p className="text-lg sm:text-xl font-bold text-amber-400 mt-1">{r.category}</p></div>
        </div>
        {/* Correct/Wrong/Unattempted - Mobile Friendly */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Correct</p><p className="text-lg font-bold text-emerald-400 mt-1">{selectedResult.stats?.correct || r.total_correct}</p></div>
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Wrong</p><p className="text-lg font-bold text-red-400 mt-1">{selectedResult.stats?.wrong || r.total_wrong}</p></div>
          <div className="rounded-lg bg-[rgb(var(--accent))/0.3] border border-[rgb(var(--border))] p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Unattempted</p><p className="text-lg font-bold text-[rgb(var(--muted-foreground))] mt-1">{selectedResult.stats?.unattempted || r.total_unattempted}</p></div>
        </div>
        {/* Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="card p-4"><h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FaChartBar className="text-indigo-400" /> Candidate Info</h3>
            <div className="space-y-1.5 text-sm">{[['Registration', r.registration_number], ['Roll No', r.roll_number], ['Name', r.candidate_name], ['Community', r.community], ['Test Centre', r.test_centre_name], ['Test Date', r.test_date], ['Test Time', r.test_time], ['Subject', r.subject]].map(([label, val]) => (
              <div key={label} className="flex justify-between"><span className="text-[rgb(var(--muted-foreground))]">{label}</span><span className="text-right">{val || '\u2014'}</span></div>
            ))}</div>
          </div>
          {sections.length > 0 && <div className="card p-4"><h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FaChartBar className="text-indigo-400" /> Section-wise</h3>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-[rgb(var(--muted-foreground))]"><tr><th className="px-2 py-2 text-left">Section</th><th className="px-2 py-2 text-center">Total</th><th className="px-2 py-2 text-center">Right</th><th className="px-2 py-2 text-center">Wrong</th><th className="px-2 py-2 text-center">Marks</th></tr></thead><tbody>{sections.map((sec, i) => (
              <tr key={i} className="border-t border-[rgb(var(--border))]"><td className="px-2 py-2 text-xs">{sec.name}</td><td className="px-2 py-2 text-center text-[rgb(var(--muted-foreground))]">{sec.total ?? '--'}</td><td className="px-2 py-2 text-center text-emerald-400 font-semibold">{sec.right ?? '--'}</td><td className="px-2 py-2 text-center text-red-400 font-semibold">{sec.wrong ?? '--'}</td><td className="px-2 py-2 text-center text-indigo-400 font-semibold">{sec.marks != null ? Number(sec.marks).toFixed(2) : '--'}</td></tr>
            ))}</tbody></table></div>
          </div>}
        </div>
        {/* Questions */}
        <div className="card p-4"><h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FaQuestionCircle className="text-indigo-400" /> Questions ({qs.length})</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {qs.map(q => {
                  const status = q.student_answer === q.correct_answer ? 'correct' : q.student_answer ? 'wrong' : 'unattempted';
                  return <div key={q.id} className={cn('rounded-lg border p-2.5 text-sm', status === 'correct' ? 'border-emerald-500/30 bg-emerald-500/5' : status === 'wrong' ? 'border-red-500/30 bg-red-500/5' : 'border-[rgb(var(--border))] bg-[rgb(var(--accent))/0.2]')}>
                    <div className="flex justify-between items-center mb-1.5"><span className="font-medium text-xs">Q{q.question_no}</span><span className={cn('text-xs font-medium', status === 'correct' ? 'text-emerald-400' : status === 'wrong' ? 'text-red-400' : 'text-[rgb(var(--muted-foreground))]')}>{status === 'correct' ? '\u2705' : status === 'wrong' ? '\u274C' : '\u23F3'} {q.marks_awarded} marks</span></div>
                    <p className="text-xs text-[rgb(var(--foreground))] mb-2" dangerouslySetInnerHTML={{ __html: q.question_text || `Question ${q.question_no}` }}></p>
                    <div className="space-y-0.5 text-xs">{['a', 'b', 'c', 'd'].map(opt => { const text = q.parsed_payload?.[`option_${opt}_text`]; if (!text) return null; const isCorrect = q.parsed_payload?.correct_option_text === text; const isSelected = q.student_option_text === text; return <div key={opt} className={cn('flex gap-1', isCorrect ? 'text-emerald-400 font-medium' : isSelected ? 'text-red-400' : 'text-[rgb(var(--muted-foreground))]')}><span className="uppercase">{opt}.</span><span dangerouslySetInnerHTML={{ __html: text }}></span>{isSelected && <span className="text-[10px] opacity-70">(chosen)</span>}{isCorrect && <span className="text-[10px] opacity-70">(correct)</span>}</div>; })}</div>
                  </div>;
                })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Results" subtitle="Candidate results management">
        {bulkSelected.length > 0 && <div className="flex items-center gap-2"><span className="text-xs text-[rgb(var(--primary))]">{bulkSelected.length} selected</span><button onClick={runBulkDeleteResults} className="btn-destructive btn-sm">Bulk Delete</button><button onClick={() => setBulkSelected([])} className="btn-ghost btn-sm">Clear</button></div>}
        <button onClick={exportCSV} className="btn-primary btn-sm"><FaDownload size={12} /> CSV</button>
      </PageHeader>
      <div className="card p-3 mb-4"><FaSearch className="absolute ml-3 mt-2.5 text-[rgb(var(--muted-foreground))] w-4 h-4" /><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-9" placeholder="Search by roll number..." /></div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm"><thead><tr className="border-b border-[rgb(var(--border))]"><th className="table-header w-10"><input type="checkbox" onChange={e => { if (e.target.checked) setBulkSelected(results.map(r => r.id)); else setBulkSelected([]); }} checked={results.length > 0 && bulkSelected.length === results.length} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" /></th><th className="table-header">ID</th><th className="table-header">Roll</th><th className="table-header">Score</th><th className="table-header">Rank</th><th className="table-header">%</th><th className="table-header">Category</th><th className="table-header">Q</th><th className="table-header">Date</th><th className="table-header">Actions</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="10" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">Loading...</td></tr> : results.length === 0 ? <tr><td colSpan="10" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">No results found.</td></tr> : results.map(r => (
            <tr key={r.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))/0.3] transition-colors"><td className="table-cell"><input type="checkbox" checked={bulkSelected.includes(r.id)} onChange={() => setBulkSelected(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])} className="w-4 h-4 rounded" /></td><td className="table-cell text-[rgb(var(--muted-foreground))] font-mono">#{r.id}</td><td className="table-cell font-mono text-xs">{r.roll_number}</td><td className="table-cell font-semibold">{r.score}</td><td className="table-cell text-purple-400">#{r.rank}</td><td className="table-cell">{r.percentile}%</td><td className="table-cell"><span className="badge-info">{r.category}</span></td><td className="table-cell">{r.questions_count}</td><td className="table-cell text-xs text-[rgb(var(--muted-foreground))]">{new Date(r.created_at).toLocaleDateString()}</td><td className="table-cell"><div className="flex gap-1"><button onClick={() => fetchResultDetail(r.id)} className="btn-ghost p-1.5"><FaEye size={14} /></button><button onClick={() => deleteResult(r.id)} className="btn-ghost p-1.5 text-red-400"><FaTrash size={14} /></button></div></td></tr>
          ))}</tbody>
        </table>
      </div>
      {totalPages > 0 && <TablePagination page={page} totalPages={totalPages} perPage={20} setPerPage={() => {}} setPage={setPage} />}
    </div>
  );
}

// ─── QUESTIONS ─────────────────────────────────────────────────────────
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
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [hasSolution, setHasSolution] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [subject, setSubject] = useState('');
  const [shiftDate, setShiftDate] = useState('');

  useEffect(() => { fetchQuestions(); }, [page, perPage, search, sortBy, hasSolution, correctAnswer, subject, shiftDate]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = `${API}/master-questions?page=${page}&per_page=${perPage}&sort_by=${sortBy}`;
      if (search) url += `&search=${encodeURIComponent(search)}`; if (hasSolution) url += `&has_solution=${hasSolution}`;
      if (correctAnswer) url += `&correct_answer=${correctAnswer}`; if (subject) url += `&subject=${encodeURIComponent(subject)}`;
      if (shiftDate) url += `&shift_date=${shiftDate}`;
      const res = await fetch(url); const data = await res.json();
      setItems(Array.isArray(data.questions) ? data.questions : []); setTotalPages(data.pages || 1); setTotal(data.total || 0);
    } catch (e) { console.error(e); setItems([]); } finally { setLoading(false); }
  };

  const openDetail = async id => {
    setDetailLoading(true); setSelectedQ(null); setEditMode(false); setAiSuggestion(null); setBulkResults(null);
    try { const res = await fetch(`${API}/master-questions/${id}`); const data = await res.json(); setSelectedQ(data); setEditData({ question_text: data.question_text || '', correct_answer: data.correct_answer || '', correct_option_text: data.correct_option_text || '', question_id_html: data.question_id_html || '', option_a_text: data.option_a_text || '', option_b_text: data.option_b_text || '', option_c_text: data.option_c_text || '', option_d_text: data.option_d_text || '' }); }
    catch (e) { console.error(e); } finally { setDetailLoading(false); }
  };

  const saveEdit = async () => {
    if (!selectedQ) return; setSaving(true);
    try { const res = await fetch(`${API}/master-questions/${selectedQ.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editData) }); if (res.ok) { setEditMode(false); openDetail(selectedQ.id); fetchQuestions(); } else alert('Save failed'); }
    catch (e) { alert('Network error'); } finally { setSaving(false); }
  };

  const runAiEdit = async () => {
    if (!selectedQ) return; setAiLoading(true); setAiSuggestion(null);
    try { const res = await fetch(`${API}/master-questions/${selectedQ.id}/ai-edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ auto_apply: false }) }); const data = await res.json(); if (data.suggestion) setAiSuggestion(data.suggestion); else alert('AI: ' + (data.error || 'Unknown')); }
    catch (e) { alert('AI edit failed'); } finally { setAiLoading(false); }
  };

  const runBulkAiEdit = async (autoApply = false) => {
    if (bulkSelected.length === 0) return; setBulkLoading(true); setBulkResults(null);
    try { const res = await fetch(`${API}/master-questions/bulk-ai-edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: bulkSelected, auto_apply: autoApply }) }); const data = await res.json(); setBulkResults(data); if (autoApply) fetchQuestions(); }
    catch (e) { alert('Bulk AI edit failed'); } finally { setBulkLoading(false); }
  };

  const runBulkDeleteQuestions = async () => {
    if (bulkSelected.length === 0) return;
    if (!confirm(`Delete ${bulkSelected.length} questions?`)) return;
    setBulkLoading(true);
    try { const res = await fetch(`${API}/master-questions/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: bulkSelected }) }); const data = await res.json(); if (data.success) { setBulkSelected([]); if (page === 1) fetchQuestions(); else setPage(1); } else alert('Error: ' + (data.error || '')); }
    catch (e) { alert('Delete failed'); } finally { setBulkLoading(false); }
  };

  const deleteQuestion = async (id, fromDetail = false) => {
    if (!confirm(`Delete question #${id}?`)) return;
    try { const res = await fetch(`${API}/master-questions/${id}`, { method: 'DELETE' }); const data = await res.json(); if (data.success) { if (fromDetail) setSelectedQ(null); fetchQuestions(); setBulkSelected(prev => prev.filter(x => x !== id)); } else alert('Error: ' + (data.error || '')); }
    catch (e) { alert('Delete failed'); }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setEditData(p => ({ question_text: aiSuggestion.question_text || p.question_text, correct_answer: aiSuggestion.correct_answer || p.correct_answer, option_a_text: aiSuggestion.option_a || p.option_a_text, option_b_text: aiSuggestion.option_b || p.option_b_text, option_c_text: aiSuggestion.option_c || p.option_c_text, option_d_text: aiSuggestion.option_d || p.option_d_text, correct_option_text: p.correct_option_text, question_id_html: p.question_id_html }));
    setEditMode(true); setAiSuggestion(null);
  };

  const answerColor = { A: 'text-blue-400', B: 'text-purple-400', C: 'text-amber-400', D: 'text-rose-400' };

  if (detailLoading) return <LoadingSpinner />;

  if (selectedQ) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setSelectedQ(null)} className="btn-ghost btn-sm"><FaArrowLeft className="mr-1" /> Back</button>
          <span className="text-sm font-mono text-[rgb(var(--muted-foreground))]">MQ #{selectedQ.id}</span>
          <div className="ml-auto flex gap-1 flex-wrap">
            <button onClick={runAiEdit} disabled={aiLoading} className="btn-ghost btn-sm">{aiLoading ? '...' : '\uD83E\uDD16'} AI</button>
            <button onClick={() => setEditMode(!editMode)} className={cn('btn-ghost btn-sm', editMode && 'text-red-400')}>{editMode ? 'Cancel' : 'Edit'}</button>
            {editMode && <button onClick={saveEdit} disabled={saving} className="btn-primary btn-sm">{saving ? '...' : 'Save'}</button>}
            <button onClick={() => deleteQuestion(selectedQ.id, true)} className="btn-destructive btn-sm"><FaTrash size={12} /> Delete</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Ref Count</p><p className="text-lg font-bold text-indigo-400">{selectedQ.reference_count}</p></div>
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Shifts</p><p className="text-lg font-bold text-purple-400">{selectedQ.shift_count}</p></div>
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">Answer</p><p className={cn('text-lg font-bold', answerColor[selectedQ.correct_answer] || 'text-emerald-400')}>{selectedQ.correct_answer}</p></div>
          <div className="card p-3 text-center"><p className="text-xs text-[rgb(var(--muted-foreground))]">AI Sol</p><p className="text-lg">{selectedQ.has_solution ? '\u2705' : '\u274C'}</p></div>
        </div>
        <div className="card p-4 mb-4"><h3 className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase mb-2">Question</h3>
          {editMode ? <textarea value={editData.question_text} onChange={e => setEditData(p => ({ ...p, question_text: e.target.value }))} className="textarea min-h-[80px]" /> : <p className="text-sm leading-relaxed">{selectedQ.question_text}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {['a', 'b', 'c', 'd'].map(opt => { const key = `option_${opt}_text`; const label = opt.toUpperCase(); const isCorrect = selectedQ.correct_answer === label; return (
              <div key={opt} className={cn('rounded-lg border p-2.5', isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[rgb(var(--border))]')}><span className={cn('font-bold text-xs mr-1', answerColor[label])}>{label}.</span>{editMode ? <input value={editData[key]} onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))} className="input h-7 text-xs inline w-[80%]" /> : <span className={cn('text-xs', isCorrect ? 'text-emerald-300' : 'text-[rgb(var(--foreground))]')}>{selectedQ[key] || '—'}</span>}{isCorrect && <span className="ml-1 text-[10px] text-emerald-400">\u2713</span>}</div>
            ); })}
          </div>
          {editMode && <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3"><select value={editData.correct_answer} onChange={e => setEditData(p => ({ ...p, correct_answer: e.target.value }))} className="input h-8 text-xs">{['A', 'B', 'C', 'D'].map(v => <option key={v}>{v}</option>)}</select><input value={editData.correct_option_text} onChange={e => setEditData(p => ({ ...p, correct_option_text: e.target.value }))} className="input h-8 text-xs" placeholder="Correct text" /><input value={editData.question_id_html} onChange={e => setEditData(p => ({ ...p, question_id_html: e.target.value }))} className="input h-8 text-xs font-mono" placeholder="HTML ID" /></div>}
        </div>
        {aiSuggestion && <div className="card p-4 mb-4 border-l-2 border-l-purple-500"><div className="flex justify-between items-center mb-2"><h3 className="text-sm font-semibold text-purple-300">AI Suggestion</h3><div className="flex gap-1"><button onClick={applyAiSuggestion} className="btn-ghost btn-sm text-purple-400">Apply</button><button onClick={() => setAiSuggestion(null)} className="btn-ghost btn-sm">Close</button></div></div>{aiSuggestion.notes && <p className="text-xs text-purple-200 mb-2 italic">{aiSuggestion.notes}</p>}<p className="text-xs mb-2"><span className="text-[rgb(var(--muted-foreground))]">Q:</span> {aiSuggestion.question_text}</p><div className="grid grid-cols-2 gap-1 text-xs">{[...'abcd'].map(o => <div key={o} className="rounded bg-[rgb(var(--accent))/0.3] p-1.5"><span className="text-purple-400 font-bold">{o.toUpperCase()}.</span> {aiSuggestion[`option_${o}`] || '—'}</div>)}</div><p className="text-xs text-emerald-400 mt-1">Answer: <strong>{aiSuggestion.correct_answer}</strong></p></div>}
        {selectedQ.shifts?.length > 0 && <div className="card p-4 mb-4"><h3 className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase mb-2">Shifts ({selectedQ.shifts.length})</h3><div className="flex flex-wrap gap-1.5">{selectedQ.shifts.map((s, i) => <div key={i} className="rounded-lg bg-[rgb(var(--accent))/0.3] px-2.5 py-1.5 text-xs"><p className="text-indigo-300 font-medium">{s.test_date} \u00B7 {s.test_time}</p><p className="text-[rgb(var(--muted-foreground))]">{s.subject}</p></div>)}</div></div>}
        {selectedQ.solution && <div className="card p-4 mb-4"><h3 className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase mb-2">AI Solution</h3><p className="text-sm mb-2">{selectedQ.solution.explanation}</p>{selectedQ.solution.why_wrong && <p className="text-xs text-red-300 mb-1"><span className="font-medium">Why Wrong:</span> {selectedQ.solution.why_wrong}</p>}{selectedQ.solution.key_takeaways?.length > 0 && <ul className="space-y-0.5">{selectedQ.solution.key_takeaways.map((t, i) => <li key={i} className="text-xs text-emerald-300">\u2022 {t}</li>)}</ul>}</div>}
        {selectedQ.responses?.length > 0 && <div className="card overflow-x-auto"><div className="p-3 border-b border-[rgb(var(--border))]"><h3 className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase">Responses ({selectedQ.responses.length})</h3></div><table className="w-full text-xs"><thead><tr className="border-b border-[rgb(var(--border))]"><th className="p-2 text-left">Roll</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Q No</th><th className="p-2 text-left">Answer</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Marks</th></tr></thead><tbody>{selectedQ.responses.map(r => (
          <tr key={r.response_id} className="border-b border-[rgb(var(--border))]"><td className="p-2 font-mono">{r.roll_number || '—'}</td><td className="p-2">{r.candidate_name || '—'}</td><td className="p-2">{r.question_no}</td><td className="p-2"><span className={r.student_answer === selectedQ.correct_answer ? 'text-emerald-400' : r.student_answer ? 'text-red-400' : 'text-[rgb(var(--muted-foreground))]'}>{r.student_answer || '—'}</span></td><td className="p-2"><span className={cn('px-1.5 py-0.5 rounded-full text-[10px] font-medium', r.status === 'correct' ? 'bg-emerald-500/15 text-emerald-400' : r.status === 'wrong' ? 'bg-red-500/15 text-red-400' : 'bg-[rgb(var(--muted))/0.3] text-[rgb(var(--muted-foreground))]')}>{r.status}</span></td><td className="p-2">{r.marks_awarded}</td></tr>
        ))}</tbody></table></div>}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Master Questions" subtitle={`${total} total`}>
        {bulkSelected.length > 0 && <div className="flex items-center gap-1 flex-wrap"><span className="text-xs text-[rgb(var(--primary))]">{bulkSelected.length} sel</span><button onClick={() => runBulkAiEdit(false)} disabled={bulkLoading} className="btn-ghost btn-sm">{'\uD83E\uDD16'} Preview</button><button onClick={() => runBulkAiEdit(true)} disabled={bulkLoading} className="btn-ghost btn-sm">{'\uD83E\uDD16'} Apply</button><button onClick={runBulkDeleteQuestions} disabled={bulkLoading} className="btn-destructive btn-sm">Delete</button><button onClick={() => { setBulkSelected([]); setBulkResults(null); }} className="btn-ghost btn-sm">Clear</button></div>}
      </PageHeader>
      {/* Filters - Mobile Friendly */}
      <div className="card p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..." className="input h-8 text-xs col-span-2" />
        <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="input h-8 text-xs"><option value="created_at">Latest</option><option value="reference_count">Refs</option><option value="shift_count">Shifts</option></select>
        <select value={hasSolution} onChange={e => { setHasSolution(e.target.value); setPage(1); }} className="input h-8 text-xs"><option value="">Solutions</option><option value="true">Has</option><option value="false">No</option></select>
        <select value={correctAnswer} onChange={e => { setCorrectAnswer(e.target.value); setPage(1); }} className="input h-8 text-xs"><option value="">Answer</option>{['A','B','C','D'].map(v => <option key={v}>{v}</option>)}</select>
        <input value={subject} onChange={e => { setSubject(e.target.value); setPage(1); }} placeholder="Subject..." className="input h-8 text-xs" />
        <input value={shiftDate} onChange={e => { setShiftDate(e.target.value); setPage(1); }} placeholder="Date..." className="input h-8 text-xs" />
      </div>
      {bulkResults && <div className="card p-3 mb-4 border-l-2 border-l-purple-500"><div className="flex justify-between mb-1"><span className="text-xs font-semibold text-purple-300">Bulk AI — {bulkResults.processed} processed</span><button onClick={() => setBulkResults(null)} className="text-xs text-[rgb(var(--muted-foreground))]">Close</button></div><div className="max-h-32 overflow-y-auto space-y-0.5">{bulkResults.results?.map((r, i) => <div key={i} className={cn('text-xs px-2 py-0.5 rounded', r.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>MQ #{r.id}: {r.success ? '\u2705 ' + (r.data?.notes || 'Done') : '\u274C ' + r.error}</div>)}</div></div>}
      {/* Desktop Table */}
      <div className="card overflow-x-auto hidden sm:block"><table className="w-full text-sm"><thead><tr className="border-b border-[rgb(var(--border))]"><th className="table-header w-10"><input type="checkbox" onChange={e => { if (e.target.checked) setBulkSelected(prev => [...new Set([...prev, ...items.map(i => i.id)])]); else { const ids = items.map(i => i.id); setBulkSelected(prev => prev.filter(id => !ids.includes(id))); } }} checked={items.length > 0 && items.every(i => bulkSelected.includes(i.id))} className="w-4 h-4 rounded" /></th><th className="table-header">ID</th><th className="table-header">Question</th><th className="table-header">Ans</th><th className="table-header text-center">Refs</th><th className="table-header text-center">Shifts</th><th className="table-header text-center">AI</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">Loading...</td></tr> : items.length === 0 ? <tr><td colSpan="7" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">No questions found.</td></tr> : items.map(q => (
        <tr key={q.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))/0.3] transition-colors cursor-pointer" onClick={() => openDetail(q.id)}><td className="table-cell" onClick={e => e.stopPropagation()}><input type="checkbox" checked={bulkSelected.includes(q.id)} onChange={() => setBulkSelected(prev => prev.includes(q.id) ? prev.filter(x => x !== q.id) : [...prev, q.id])} className="w-4 h-4 rounded" /></td><td className="table-cell text-[rgb(var(--muted-foreground))] font-mono text-xs">#{q.id}</td><td className="table-cell max-w-xs truncate">{q.question_text || '—'}</td><td className="table-cell"><span className={cn('font-bold', answerColor[q.correct_answer] || 'text-white')}>{q.correct_answer}</span></td><td className="table-cell text-center"><span className="badge-info">{q.reference_count}</span></td><td className="table-cell text-center"><span className="rounded-full bg-purple-500/15 text-purple-400 px-2 py-0.5 text-xs">{q.shift_count}</span></td><td className="table-cell text-center">{q.has_solution ? <span className="text-emerald-400">{'\u2705'}</span> : <span className="text-[rgb(var(--muted-foreground))]">&mdash;</span>}</td></tr>
      ))}</tbody></table></div>
      {/* Mobile Cards */}
      <div className="sm:hidden space-y-2">{loading ? <div className="text-center py-8 text-sm text-[rgb(var(--muted-foreground))]">Loading...</div> : items.length === 0 ? <div className="text-center py-8 text-sm text-[rgb(var(--muted-foreground))]">No questions found.</div> : items.map(q => (
        <div key={q.id} className="card p-3 cursor-pointer" onClick={() => openDetail(q.id)}>
          <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{q.question_text || '—'}</p><p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">#{q.id} {q.question_id_html ? `\u2022 ${q.question_id_html}` : ''}</p></div><span className={cn('font-bold text-sm', answerColor[q.correct_answer] || 'text-white')}>{q.correct_answer}</span></div>
          <div className="flex items-center gap-2 mt-2 text-xs"><span className="badge-info">{q.reference_count} refs</span><span className="rounded-full bg-purple-500/15 text-purple-400 px-2 py-0.5">{q.shift_count} shifts</span>{q.has_solution ? <span className="text-emerald-400">{'\u2705'} AI</span> : <span className="text-[rgb(var(--muted-foreground))]">No AI</span>}</div>
        </div>
      ))}</div>
      {totalPages > 0 && <TablePagination page={page} totalPages={totalPages} perPage={perPage} setPerPage={setPerPage} setPage={setPage} />}
    </div>
  );
}

// ─── PARSED DATA ──────────────────────────────────────────────────────
function ParsedData() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchParsed(); }, [search]);

  const fetchParsed = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/results?page=1&per_page=50&search=${encodeURIComponent(search)}`); const data = await res.json(); setResults(Array.isArray(data.results) ? data.results : []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const openDetail = async id => { try { const res = await fetch(`${API}/results/${id}`); const data = await res.json(); setSelected(data); } catch (e) { console.error(e); } };

  return (
    <div>
      <PageHeader title="Parsed Data" subtitle="HTML parser candidate + question payloads" />
      <div className="card p-3 mb-4"><FaSearch className="absolute ml-3 mt-2.5 text-[rgb(var(--muted-foreground))] w-4 h-4" /><input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search roll / name / subject..." /></div>
      {selected ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <button onClick={() => setSelected(null)} className="btn-ghost btn-sm"><FaArrowLeft className="mr-1" /> Back</button>
          <div className="card p-4"><h2 className="text-sm font-semibold mb-3">Candidate Metadata</h2><pre className="text-xs whitespace-pre-wrap break-all text-[rgb(var(--muted-foreground))]">{JSON.stringify(selected.result, null, 2)}</pre></div>
          <div className="card p-4"><h2 className="text-sm font-semibold mb-3">Question Payloads</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pr-1">{selected.questions?.map((q, i) => (
              <div key={q.id} className="border border-[rgb(var(--border))] rounded-lg p-3"><p className="text-xs font-medium text-indigo-300">Q{q.question_no}</p><p className="text-xs mt-1">{q.question_text}</p><pre className="text-[10px] mt-1.5 whitespace-pre-wrap break-all text-[rgb(var(--muted-foreground))]">{JSON.stringify(q.parsed_payload || {}, null, 2)}</pre></div>
            ))}</div>
          </div>
        </motion.div>
      ) : (
        <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[rgb(var(--border))]"><th className="table-header">Roll</th><th className="table-header">Candidate</th><th className="table-header">Subject</th><th className="table-header">Photo</th><th className="table-header">Parser</th><th className="table-header">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">Loading...</td></tr> : results.map(r => (
          <tr key={r.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))/0.3] transition-colors"><td className="table-cell font-mono text-xs">{r.roll_number}</td><td className="table-cell">{r.candidate_name || '—'}</td><td className="table-cell">{r.subject || '—'}</td><td className="table-cell">{r.application_photograph ? '\u2705' : '—'}</td><td className="table-cell text-xs text-[rgb(var(--muted-foreground))]">{r.parser_version || '—'}</td><td className="table-cell"><button onClick={() => openDetail(r.id)} className="btn-ghost btn-sm">View</button></td></tr>
        ))}</tbody></table></div>
      )}
    </div>
  );
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────
function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userId, setUserId] = useState('');

  useEffect(() => { fetchTransactions(); }, [page, userId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try { let url = `${API}/transactions?page=${page}&per_page=20`; if (userId) url += `&user_id=${userId}`; const res = await fetch(url); const data = await res.json(); setTransactions(data.transactions); setTotalPages(data.pages); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Points transaction history" />
      <div className="card p-3 mb-4"><FaSearch className="absolute ml-3 mt-2.5 text-[rgb(var(--muted-foreground))] w-4 h-4" /><input value={userId} onChange={e => { setUserId(e.target.value); setPage(1); }} className="input pl-9" placeholder="Filter by User ID..." /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[rgb(var(--border))]"><th className="table-header">ID</th><th className="table-header">User</th><th className="table-header">Type</th><th className="table-header">Amount</th><th className="table-header">Description</th><th className="table-header">Date</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">Loading...</td></tr> : transactions.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-sm text-[rgb(var(--muted-foreground))]">No transactions found.</td></tr> : transactions.map(t => (
        <tr key={t.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))/0.3] transition-colors"><td className="table-cell text-[rgb(var(--muted-foreground))] font-mono">#{t.id}</td><td className="table-cell font-mono text-xs">{t.user_id}</td><td className="table-cell"><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', (t.type === 'earn' || t.type === 'recharge') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>{t.type}</span></td><td className={cn('table-cell font-semibold', (t.type === 'earn' || t.type === 'recharge') ? 'text-emerald-400' : 'text-red-400')}>{(t.type === 'earn' || t.type === 'recharge') ? '+' : '-'}{t.amount}</td><td className="table-cell text-[rgb(var(--muted-foreground))]">{t.description || '—'}</td><td className="table-cell text-xs text-[rgb(var(--muted-foreground))]">{new Date(t.created_at).toLocaleDateString()}</td></tr>
      ))}</tbody></table></div>
      {totalPages > 0 && <TablePagination page={page} totalPages={totalPages} perPage={20} setPerPage={() => {}} setPage={setPage} />}
    </div>
  );
}

// ─── POINTS PACKS ─────────────────────────────────────────────────────
function PointsPacks() {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: 0, points: 0, description: '', is_active: true });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchPacks(); }, []);

  const fetchPacks = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/points-packs`); const d = await res.json(); setPacks(Array.isArray(d.packs) ? d.packs : []); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Points Packs" subtitle="Redeemable points packages" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <form onSubmit={async e => { e.preventDefault(); setSubmitting(true); try { const url = editingId ? `${API}/points-packs/${editingId}` : `${API}/points-packs`; const method = editingId ? 'PUT' : 'POST'; const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await res.json(); if (data.success) { setForm({ name: '', price: 0, points: 0, description: '', is_active: true }); setEditingId(null); fetchPacks(); } else alert(data.error || 'Failed'); } catch (e) { alert('Network error'); } finally { setSubmitting(false); } }} className="xl:col-span-2 card p-4 space-y-4">
          <h2 className="text-sm font-semibold">{editingId ? 'Edit Points Pack' : 'New Points Pack'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input h-9" placeholder="Name" required /><input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="input h-9" placeholder="Price (INR)" required /><input type="number" min="1" value={form.points} onChange={e => setForm({ ...form, points: Number(e.target.value) })} className="input h-9" placeholder="Points" required /></div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="textarea" placeholder="Description..." />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))]" /> Active</label>
          <div className="flex gap-2"><button type="submit" disabled={submitting} className="btn-primary btn-sm">{submitting ? '...' : editingId ? 'Update' : 'Create'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', price: 0, points: 0, description: '', is_active: true }); }} className="btn-ghost btn-sm">Cancel</button>}</div>
        </form>
        <div className="card p-4"><h2 className="text-sm font-semibold mb-3">Existing Packs</h2>
          {loading ? <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-lg" />)}</div> : packs.length === 0 ? <div className="text-center py-8 text-sm text-[rgb(var(--muted-foreground))]">No packs.</div> : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">{packs.map(p => (
              <div key={p.id} className="rounded-lg border border-[rgb(var(--border))] p-3 hover:border-[rgb(var(--muted-foreground))/0.3] transition-colors">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{p.name}</p><p className="text-xs text-[rgb(var(--muted-foreground))] truncate">{p.description || ''}</p></div><div className="flex gap-1 shrink-0"><button onClick={() => { setEditingId(p.id); setForm({ name: p.name, price: p.price, points: p.points, description: p.description || '', is_active: p.is_active !== false }); }} className="btn-ghost p-1"><FaEdit size={12} /></button><button onClick={async () => { if (!confirm('Delete?')) return; try { await fetch(`${API}/points-packs/${p.id}`, { method: 'DELETE' }); fetchPacks(); } catch (e) { console.error(e); } }} className="btn-ghost p-1 text-red-400"><FaTrash size={12} /></button></div></div>
                <div className="mt-2 flex items-center gap-2 text-xs"><span className="text-emerald-400 font-semibold">\u20B9{p.price}</span><span className="text-indigo-400 font-semibold">{p.points} pts</span><span className={p.is_active ? 'badge-success' : 'badge-destructive'}>{p.is_active ? 'Active' : 'Inactive'}</span></div>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}
