import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaChartLine, FaDownload, FaFilePdf, FaFilter, FaUsers, FaTrophy, FaCalendarAlt, FaBriefcase, FaEdit, FaSave
} from 'react-icons/fa';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('rv_token');
      const u = localStorage.getItem('rv_user');
      if (t) setToken(t);
      if (u) try { setUser(JSON.parse(u)); } catch {}
    }
  }, []);
  return { user, token };
}

export default function PackAnalysis() {
  const router = useRouter();
  const { id } = router.query;
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [orgInput, setOrgInput] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);

  // Data
  const [stats, setStats] = useState({
    total_candidates: 0,
    average_score: 0,
    highest_score: 0,
    lowest_score: 0,
    category_stats: []
  });
  const [candidates, setCandidates] = useState([]);
  const [examsList, setExamsList] = useState([]);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState('students');

  // Filters State
  const [filters, setFilters] = useState({
    exam_id: '',
    category: '',
    shift_date: '',
    shift_time: '',
    subject: '',
    min_score: '',
    max_score: '',
    search: ''
  });
  const [questionFilters, setQuestionFilters] = useState({
    exam_id: '',
    shift_date: '',
    shift_time: '',
    subject: '',
    chapter: '',
    difficulty: '',
    question_type: '',
    search: ''
  });
  const [packQuestionsPreview, setPackQuestionsPreview] = useState([]);
  const [packQuestionsLoading, setPackQuestionsLoading] = useState(false);
  const [packQuestionsPage, setPackQuestionsPage] = useState(1);
  const [packQuestionsPages, setPackQuestionsPages] = useState(1);
  const [packQuestionsTotal, setPackQuestionsTotal] = useState(0);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  // Fetch analysis data
  const fetchAnalysis = async (pageNumber = 1, isDownload = false) => {
    if (!id || !token) return;
    if (!isDownload) setLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: pageNumber,
        per_page: 50,
        ...filters
      });

      if (isDownload) {
        queryParams.set('download', 'all');
      }

      const res = await fetch(`${API}/api/marketplace/packs/${id}/analysis?${queryParams.toString()}`, {
        headers: authHeaders
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (isDownload) {
          return data.candidates;
        } else {
          setStats(data.stats);
          setCandidates(data.candidates);
          setExamsList(data.exams_list || []);
          setOrgName(data.org_name || '');
          setOrgInput(data.org_name || '');
          setTotalItems(data.total || 0);
          setTotalPages(data.pages || 1);
          setPage(data.page || 1);
        }
      } else {
        if (!isDownload) setError(data.error || 'Failed to load Marks Analysis');
      }
    } catch (err) {
      console.error(err);
      if (!isDownload) setError('Network error while loading analysis');
    } finally {
      if (!isDownload) setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) {
      fetchAnalysis(1);
    }
  }, [id, token]);

  useEffect(() => {
    if (examsList.length === 1) {
      const defaultExamId = examsList[0].id;
      setQuestionFilters((prev) => ({ ...prev, exam_id: prev.exam_id || defaultExamId }));
      setFilters((prev) => ({ ...prev, exam_id: prev.exam_id || defaultExamId }));
    }
  }, [examsList]);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    fetchAnalysis(1);
  };

  const handleResetFilters = () => {
    setFilters({
      exam_id: '',
      category: '',
      shift_date: '',
      shift_time: '',
      subject: '',
      min_score: '',
      max_score: '',
      search: ''
    });
    // Triggers refetch since states reset
    setTimeout(() => fetchAnalysis(1), 50);
  };

  const fetchPackQuestions = async (pageNumber = 1) => {
    if (!id || !token) return;
    setPackQuestionsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNumber,
        per_page: 100,
        ...questionFilters,
      });

      const res = await fetch(`${API}/api/marketplace/packs/${id}/questions?${queryParams.toString()}`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        setPackQuestionsPreview(Array.isArray(data.questions) ? data.questions : []);
        setPackQuestionsTotal(data.total || 0);
        setPackQuestionsPage(data.page || 1);
        setPackQuestionsPages(data.pages || 1);
      } else {
        alert(data.error || 'Failed to load pack questions preview');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while loading pack questions');
    } finally {
      setPackQuestionsLoading(false);
    }
  };

  const handleExportPackQuestions = async () => {
    if (!id || !token) return;
    const queryParams = new URLSearchParams({
      export: 'csv',
      ...questionFilters,
      per_page: 1000,
    });

    try {
      const res = await fetch(`${API}/api/marketplace/packs/${id}/questions?${queryParams.toString()}`, {
        headers: authHeaders,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to export pack questions');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pack_${id}_questions_export.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Network error while exporting questions');
    }
  };

  const saveOrgName = async () => {
    if (!id || !token) return;
    setSavingOrg(true);
    try {
      const res = await fetch(`${API}/api/marketplace/packs/${id}/org-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ org_name: orgInput })
      });
      const data = await res.json();
      if (data.success) {
        setOrgName(data.org_name);
        setIsEditingOrg(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingOrg(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    const allData = await fetchAnalysis(1, true);
    if (!allData || allData.length === 0) {
      alert('No data to export');
      return;
    }

    const csvHeaders = ['Rank', 'Candidate Name', 'Roll Number', 'Category', 'Exam', 'Subject', 'Date', 'Time', 'Score', 'Percentile'];
    const csvRows = [csvHeaders.join(',')];

    allData.forEach(row => {
      csvRows.push([
        row.rank,
        `"${row.candidate_name}"`,
        `"${row.roll_number}"`,
        row.category,
        `"${row.exam_name}"`,
        `"${row.subject || ''}"`,
        `"${row.test_date || ''}"`,
        `"${row.test_time || ''}"`,
        row.score,
        row.percentile
      ].join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `marks_report_pack_${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPDFPrint = () => {
    window.print();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-gray-400 mb-4">Please login to access the Marks Analysis portal.</p>
        <Link href="/login" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading && candidates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <p className="text-red-400 text-lg font-semibold mb-3">⚠️ Access Denied</p>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/marketplace" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Marks Analysis Portal | RankResult B2B</title>
      </Head>

      {/* Styles for print styling report */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-header {
            display: block !important;
            border-bottom: 2px solid #1f2937;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .print-card {
            border: 1px solid #e5e7eb !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
          .print-table th {
            background-color: #f3f4f6 !important;
            color: black !important;
            border-bottom: 2px solid #d1d5db !important;
          }
          .print-table td {
            color: black !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-950 text-white pb-16">
        
        {/* Header Bar */}
        <nav className="no-print border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/marketplace" className="text-gray-400 hover:text-white transition">
                <FaArrowLeft />
              </Link>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                RankResult
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-800 font-medium">
                Marks Analysis Portal
              </span>
            </div>
          </div>
        </nav>

        {/* Print Only Header Branding */}
        <div className="hidden print-header max-w-6xl mx-auto px-4 text-black">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold">EXAM MARKS ANALYSIS REPORT</h1>
              <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleDateString()}</p>
            </div>
            {orgName && (
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold">ORGANIZATION BRAND</p>
                <p className="text-lg font-black text-indigo-600">{orgName}</p>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-6">

          {/* Org Branding Header */}
          <div className="no-print bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <FaBriefcase className="text-indigo-400" /> B2B Portal Branding
              </span>
              {orgName ? (
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-xl font-bold text-white">{orgName}</h2>
                  <button onClick={() => setIsEditingOrg(true)} className="text-xs text-gray-500 hover:text-white p-1">
                    <FaEdit />
                  </button>
                </div>
              ) : (
                <p className="text-gray-400 text-sm mt-1">Set your coaching center or academy name to brand generated PDFs.</p>
              )}
            </div>

            {isEditingOrg ? (
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={orgInput}
                  onChange={(e) => setOrgInput(e.target.value)}
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 w-full md:w-56"
                  placeholder="e.g. Career Power Academy"
                />
                <button
                  onClick={saveOrgName}
                  disabled={savingOrg}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shrink-0"
                >
                  <FaSave /> {savingOrg ? 'Saving...' : 'Save'}
                </button>
              </div>
            ) : (
              !orgName && (
                <button
                  onClick={() => setIsEditingOrg(true)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold"
                >
                  Configure Brand Name
                </button>
              )
            )}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="print-card bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-950 flex items-center justify-center text-indigo-400">
                <FaUsers className="text-xl" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Candidates</p>
                <p className="text-2xl font-bold">{stats.total_candidates}</p>
              </div>
            </div>

            <div className="print-card bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 flex items-center justify-center text-emerald-400">
                <FaChartLine className="text-xl" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average Score</p>
                <p className="text-2xl font-bold">{stats.average_score}</p>
              </div>
            </div>

            <div className="print-card bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-950 flex items-center justify-center text-purple-400">
                <FaTrophy className="text-xl" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Highest Score</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.highest_score}</p>
              </div>
            </div>

            <div className="print-card bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-950 flex items-center justify-center text-red-400">
                <FaCalendarAlt className="text-xl" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Lowest Score</p>
                <p className="text-2xl font-bold">{stats.lowest_score}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-2 inline-flex">
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'students' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                Student Data
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('questions')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeTab === 'questions' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                Pack Questions
              </button>
            </div>
          </div>

          {activeTab === 'students' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column: Filter Panel (no-print) */}
              <div className="no-print lg:col-span-1 space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <FaFilter className="text-indigo-400" /> Filter Candidates
                  </h3>
                  <form onSubmit={handleApplyFilters} className="space-y-4">
                    
                    {/* Filter by Exam */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Target Exam</label>
                      <select
                        value={filters.exam_id}
                        onChange={(e) => setFilters({ ...filters, exam_id: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">All Exams in Pack</option>
                        {examsList.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter by Category */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">All Categories</option>
                        <option value="UR">UR</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="EWS">EWS</option>
                      </select>
                    </div>

                    {/* Marks Ranges */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Min Marks</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={filters.min_score}
                          onChange={(e) => setFilters({ ...filters, min_score: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Max Marks</label>
                        <input
                          type="number"
                          placeholder="200"
                          value={filters.max_score}
                          onChange={(e) => setFilters({ ...filters, max_score: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Date & Shifts */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Shift Subject / Keyword</label>
                      <input
                        type="text"
                        placeholder="e.g. English, General..."
                        value={filters.subject}
                        onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* Search Candidate */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Search Candidate</label>
                      <input
                        type="text"
                        placeholder="Search name or roll..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>

                {/* Category-wise Averages Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-sm font-semibold mb-4">📊 Category breakdown</h3>
                  {stats.category_stats.length === 0 ? (
                    <p className="text-gray-500 text-xs">No statistics available.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.category_stats.map(c => (
                        <div key={c.category} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-400">{c.category}</span>
                          <div className="flex gap-3">
                            <span className="text-gray-500">{c.count} students</span>
                            <span className="text-indigo-400 font-bold">Avg: {c.average_score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                
                {/* Leaderboard Table Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg print-card">
                  <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">Rankings Leaderboard</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{totalItems} results found</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FaDownload className="text-[10px]" /> Export CSV/Excel
                      </button>
                      <button
                        onClick={triggerPDFPrint}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                      >
                        <FaFilePdf className="text-[10px]" /> Print branded PDF
                      </button>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left print-table">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 font-medium">
                          <th className="py-3 px-3">Rank</th>
                          <th className="py-3 px-3">Candidate Name</th>
                          <th className="py-3 px-3">Roll Number</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">Shift Details</th>
                          <th className="py-3 px-3 text-right">Score</th>
                          <th className="py-3 px-3 text-right">Percentile</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-10 text-center text-gray-500">
                              No candidate data found matching the selected filters.
                            </td>
                          </tr>
                        ) : (
                          candidates.map((cand, idx) => (
                            <tr key={idx} className="border-b border-gray-800/60 hover:bg-gray-800/10 text-gray-300">
                              <td className="py-2.5 px-3 font-semibold text-indigo-400">#{cand.rank}</td>
                              <td className="py-2.5 px-3 font-medium text-white">{cand.candidate_name}</td>
                              <td className="py-2.5 px-3 font-mono text-gray-500">{cand.roll_number}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-gray-800/80 text-gray-300 text-[10px] uppercase font-bold">
                                  {cand.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <p className="font-semibold text-[10px] text-gray-400 truncate max-w-[120px]">{cand.subject || '—'}</p>
                                <p className="text-[10px] text-gray-600">{cand.test_date} · {cand.test_time}</p>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-white">{cand.score}</td>
                              <td className="py-2.5 px-3 text-right text-gray-400">{cand.percentile}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="no-print mt-5 flex justify-center gap-2">
                      <button
                        onClick={() => fetchAnalysis(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm"
                      >
                        ‹
                      </button>
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => fetchAnalysis(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${page === p ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => fetchAnalysis(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">📦 Pack Question Export</h3>
                      <p className="text-xs text-gray-500">Choose the exam and question filters, then preview or export.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchPackQuestions(1)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Preview
                      </button>
                      <button
                        onClick={handleExportPackQuestions}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Target Exam</label>
                      <select
                        value={questionFilters.exam_id}
                        onChange={(e) => setQuestionFilters({ ...questionFilters, exam_id: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">{examsList.length > 1 ? 'Choose exam' : 'All Exams'}</option>
                        {examsList.map((e) => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Shift Subject</label>
                        <input
                          type="text"
                          placeholder="e.g. English"
                          value={questionFilters.subject}
                          onChange={(e) => setQuestionFilters({ ...questionFilters, subject: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Shift Date</label>
                        <input
                          type="date"
                          value={questionFilters.shift_date}
                          onChange={(e) => setQuestionFilters({ ...questionFilters, shift_date: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Shift Time</label>
                        <input
                          type="time"
                          value={questionFilters.shift_time}
                          onChange={(e) => setQuestionFilters({ ...questionFilters, shift_time: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Chapter</label>
                        <input
                          type="text"
                          placeholder="Chapter name"
                          value={questionFilters.chapter}
                          onChange={(e) => setQuestionFilters({ ...questionFilters, chapter: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Difficulty</label>
                        <select
                          value={questionFilters.difficulty}
                          onChange={(e) => setQuestionFilters({ ...questionFilters, difficulty: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Any</option>
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Question Type</label>
                        <select
                          value={questionFilters.question_type}
                          onChange={(e) => setQuestionFilters({ ...questionFilters, question_type: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Any</option>
                          <option value="MCQ">MCQ</option>
                          <option value="Fill in the blank">Fill in the blank</option>
                          <option value="True/False">True/False</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Search Question</label>
                      <input
                        type="text"
                        placeholder="Keyword in question"
                        value={questionFilters.search}
                        onChange={(e) => setQuestionFilters({ ...questionFilters, search: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg print-card">
                  <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">Question Preview</h3>
                      <p className="text-xs text-gray-500">Showing up to 100 questions per page with pagination.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchPackQuestions(1)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={handleExportPackQuestions}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left print-table">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 font-medium">
                          <th className="py-3 px-3">ID</th>
                          <th className="py-3 px-3">Question</th>
                          <th className="py-3 px-3">Subject</th>
                          <th className="py-3 px-3">Chapter</th>
                          <th className="py-3 px-3">Difficulty</th>
                          <th className="py-3 px-3">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packQuestionsLoading ? (
                          <tr>
                            <td colSpan="6" className="py-10 text-center text-gray-400">Loading questions...</td>
                          </tr>
                        ) : packQuestionsPreview.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-10 text-center text-gray-500">Preview pack questions after applying filters.</td>
                          </tr>
                        ) : (
                          packQuestionsPreview.map((q) => (
                            <tr key={q.id} className="border-b border-gray-800/60 hover:bg-gray-800/10 text-gray-300">
                              <td className="py-2.5 px-3 font-semibold text-indigo-400">{q.id}</td>
                              <td className="py-2.5 px-3 text-sm text-white max-w-xl truncate">{q.question_text}</td>
                              <td className="py-2.5 px-3 text-gray-300">{q.subject || '—'}</td>
                              <td className="py-2.5 px-3 text-gray-300">{q.chapter || '—'}</td>
                              <td className="py-2.5 px-3 text-gray-300">{q.difficulty || '—'}</td>
                              <td className="py-2.5 px-3 text-gray-300">{q.question_type || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {packQuestionsPages > 1 && (
                    <div className="no-print mt-5 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-gray-400">Page {packQuestionsPage} of {packQuestionsPages}, {packQuestionsTotal} questions total</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchPackQuestions(Math.max(1, packQuestionsPage - 1))}
                          disabled={packQuestionsPage <= 1}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm"
                        >
                          ‹ Prev
                        </button>
                        {Array.from({ length: Math.min(packQuestionsPages, 5) }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => fetchPackQuestions(p)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${packQuestionsPage === p ? 'bg-indigo-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                          >
                            {p}
                          </button>
                        ))}
                        <button
                          onClick={() => fetchPackQuestions(Math.min(packQuestionsPages, packQuestionsPage + 1))}
                          disabled={packQuestionsPage >= packQuestionsPages}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-sm"
                        >
                          Next ›
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </>
  );
}
