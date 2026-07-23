import React, { useState, useEffect } from 'react';
import { adminGetUsers, adminDeleteUser, adminGetPredictions, adminDeletePrediction } from '../services/api';
import { Users, FileText, Trash2, Shield, Calendar, Search, AlertCircle, CheckCircle } from 'lucide-react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'scans'
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const res = await adminGetUsers();
        setUsers(res.data);
      } else {
        const res = await adminGetPredictions();
        setScans(res.data);
      }
    } catch (err) {
      console.error("Admin data load error:", err);
      setError("Failed to fetch system logs. Make sure you have administrator privileges.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDeleteUser = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}? This will erase all their scan history permanently.`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await adminDeleteUser(userId);
      setSuccess(`User ${email} deleted successfully.`);
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to delete user.";
      setError(errMsg);
    }
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan prediction record?")) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await adminDeletePrediction(scanId);
      setSuccess("Scan log deleted successfully.");
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.detail || "Failed to delete scan log.";
      setError(errMsg);
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
  });

  const filteredScans = scans.filter(s => {
    const term = searchTerm.toLowerCase();
    return s.image_name.toLowerCase().includes(term) || s.prediction.toLowerCase().includes(term) || String(s.user_id).includes(term);
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="flex items-center space-x-3 mb-8">
          <Shield className="h-8 w-8 text-emerald-600 animate-pulse" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Management Panel</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage registered user accounts and audit retinal image scan logs.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 rounded-xl mb-6 flex items-center space-x-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl mb-6 flex items-center space-x-3 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Controls and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <div className="flex space-x-2 border-b border-transparent">
            <button
              onClick={() => {
                setActiveTab('users');
                setSearchTerm('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === 'users'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>User Accounts</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('scans');
                setSearchTerm('');
              }}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg transition ${
                activeTab === 'scans'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Retina Scan Logs</span>
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Tab Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              
              {activeTab === 'users' ? (
                /* Users Table */
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Predictions Run</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{u.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 capitalize">{u.role}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{new Date(u.created_at).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-bold">{u.prediction_count}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              disabled={u.role === 'admin'}
                              className="text-red-600 hover:text-red-900 disabled:opacity-30 p-1 bg-red-50 dark:bg-red-950/20 rounded transition"
                              title={u.role === 'admin' ? "Cannot delete admin account" : "Delete Account"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                /* Scan logs Table */
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Image Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prediction</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredScans.length > 0 ? (
                      filteredScans.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-mono">User #{s.user_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 max-w-[200px] truncate" title={s.image_name}>{s.image_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              s.prediction === "Healthy"
                                ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                            }`}>
                              {s.prediction}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-bold">{s.confidence}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span>{new Date(s.timestamp).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteScan(s.id)}
                              className="text-red-600 hover:text-red-900 p-1 bg-red-50 dark:bg-red-950/20 rounded transition"
                              title="Delete Scan Log"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">No scan records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
