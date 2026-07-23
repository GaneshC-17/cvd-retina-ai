import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPredictionHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Calendar, ChevronLeft, ChevronRight, FileDown, PlusCircle, Filter, RotateCcw, Eye, ShieldAlert } from 'lucide-react';

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filter States
  const [scanId, setScanId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [prediction, setPrediction] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchHistory = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = {};
      if (scanId.trim()) params.scan_id = scanId.trim();
      if (patientId.trim()) params.patient_id = patientId.trim();
      if (patientName.trim()) params.patient_name = patientName.trim();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (riskLevel) params.risk_level = riskLevel;
      if (prediction) params.prediction = prediction;

      const res = await getPredictionHistory(params);
      setHistory(res.data);
      setCurrentPage(1); // Reset page to 1 when filters are applied
    } catch (err) {
      console.error("Error fetching history:", err);
      setErrorMsg("Failed to retrieve scan records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleResetFilters = () => {
    setScanId('');
    setPatientId('');
    setPatientName('');
    setStartDate('');
    setEndDate('');
    setRiskLevel('');
    setPrediction('');
    // Trigger fetch with empty params
    setTimeout(() => {
      fetchHistory();
    }, 0);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  // Pagination Logic
  const totalPages = Math.ceil(history.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = history.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getRiskBadgeStyles = (level) => {
    switch (level) {
      case 'Healthy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
      case 'Low Risk':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';
      case 'Moderate Risk':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
      case 'High Risk':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-950/40 dark:text-slate-400 border border-slate-200 dark:border-slate-900/50';
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/50 dark:border-green-900/30';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 animate-pulse';
      case 'Failed':
        return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Patient Scan History
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Access and manage all historical retinal scans, AI diagnostic outcomes, and medical report history.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link
              to="/predict"
              className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-colors duration-150"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              <span>Launch New Scan</span>
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
            <ShieldAlert className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Search & Advanced Filters Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Filter className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filter Screening Records</h2>
          </div>
          
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Scan ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Scan ID</label>
                <input
                  type="text"
                  placeholder="e.g. SCAN-2026-0001"
                  value={scanId}
                  onChange={(e) => setScanId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {user?.role !== 'patient' && (
                <>
                  {/* Patient ID */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Patient ID</label>
                    <input
                      type="text"
                      placeholder="e.g. PAT-2026-0001"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  {/* Patient Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Patient Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Jane Doe"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Prediction */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">AI Prediction</label>
                <select
                  value={prediction}
                  onChange={(e) => setPrediction(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">All Results</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Cardiovascular Disease Risk">Cardiovascular Disease Risk</option>
                </select>
              </div>

              {/* Risk Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                >
                  <option value="">All Risks</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Low Risk">Low Risk</option>
                  <option value="Moderate Risk">Moderate Risk</option>
                  <option value="High Risk">High Risk</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-grow inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 transition"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  disabled={isLoading}
                  className="inline-flex justify-center items-center p-2 border border-slate-300 dark:border-slate-700 text-sm font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                  title="Reset Filters"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Container */}
        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600"></div>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading screening logs...</span>
            </div>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-900/40">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scan ID</th>
                      {user?.role !== 'patient' && (
                        <>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Patient Name</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Demographics</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">AI Classification</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Risk Level</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scan Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {currentItems.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-700/10 transition-colors">
                        {/* Scan ID */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-600 dark:text-teal-400">
                          <Link to={`/scan/${p.scan_id || p.id}`} className="hover:underline">
                            {p.scan_id || `SCAN-${p.id}`}
                          </Link>
                        </td>
                        
                        {user?.role !== 'patient' && (
                          <>
                            {/* Patient ID */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                              {p.patient ? (
                                <Link to={`/patients/${p.patient.patient_id}`} className="font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 hover:underline">
                                  {p.patient.patient_id}
                                </Link>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">None</span>
                              )}
                            </td>
                            
                            {/* Patient Name */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              {p.patient ? p.patient.full_name : <span className="text-slate-400 dark:text-slate-500 italic">Anonymous</span>}
                            </td>
                          </>
                        )}
                        
                        {/* Demographics */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {p.patient ? `${p.patient.age} / ${p.patient.gender}` : '-'}
                        </td>
                        
                        {/* AI Classification */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.prediction === 'Healthy'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50'
                          }`}>
                            {p.prediction}
                          </span>
                        </td>
                        
                        {/* Risk Level */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRiskBadgeStyles(p.risk_level)}`}>
                            {p.risk_level || 'Healthy'}
                          </span>
                        </td>
                        
                        {/* Confidence */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-semibold">
                          {p.confidence.toFixed(1)}%
                        </td>
                        
                        {/* Scan Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(p.scan_date || p.timestamp).toLocaleDateString()}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(p.status || 'Completed')}`}>
                            {p.status || 'Completed'}
                          </span>
                        </td>
                        
                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/scan/${p.scan_id || p.id}`}
                              className="text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {p.report_path && p.status === 'Completed' && (
                              <a
                                href={`http://localhost:8000/report/${p.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                title="Download Report PDF"
                              >
                                <FileDown className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-slate-800 py-16 px-4 shadow rounded-2xl border border-slate-200 dark:border-slate-700 text-center max-w-xl mx-auto">
            <Filter className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Matching Records</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              No screening scans match the filter criteria you provided. Check the inputs or add a new patient scan.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              <span>Clear Filter Criteria</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default History;
