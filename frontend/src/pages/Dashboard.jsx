import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  FileText, 
  Activity, 
  Heart, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  Eye,
  Download,
  Users
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const handleDownloadReport = async (predictionId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/report/${predictionId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to download report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `report_${predictionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report. Please try again.');
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load dashboard metrics. Please reload.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-6 rounded-xl text-center max-w-md">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Database Connection Failed</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const {
    total_predictions,
    healthy_predictions,
    risk_predictions,
    reports_generated,
    total_patients,
    total_scans,
    average_patient_age,
    average_confidence,
    most_common_prediction,
    confidence_trend,
    recent_predictions
  } = stats;

  // Chart configuration
  const chartData = {
    labels: confidence_trend.map(item => {
      const d = new Date(item.date);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }),
    datasets: [
      {
        fill: true,
        label: 'Prediction Confidence (%)',
        data: confidence_trend.map(item => item.confidence),
        borderColor: '#10b981', // Emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        pointBackgroundColor: '#10b981',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const pred = confidence_trend[index]?.prediction;
            return `Confidence: ${context.raw}% (${pred})`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 50,
        max: 100,
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
        ticks: {
          callback: value => `${value}%`
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Welcome back, {user?.username}!
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Here is the analytical overview of your retinal scans and health indicators.
            </p>
          </div>
          {user?.role === 'admin' && (
            <div className="mt-4 md:mt-0 bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4" />
              <span>Platform Administration Mode (Showing Global Database Metrics)</span>
            </div>
          )}
        </div>

        {/* Analytics Grid */}
        {user?.role === 'patient' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Card 1: Total Scans */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 mr-4">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">My Scans</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{total_scans}</p>
              </div>
            </div>

            {/* Card 2: Reports Generated */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 mr-4">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Reports Generated</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reports_generated}</p>
              </div>
            </div>

            {/* Card 3: Average Confidence */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 mr-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Avg. Confidence</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{average_confidence}%</p>
              </div>
            </div>

            {/* Card 4: My Patient Details */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-slate-700 text-teal-600 dark:text-teal-400 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div className="truncate w-full">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">My Details</p>
                {user?.patient ? (
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.patient.age} yrs | {user.patient.gender} | BMI: {user.patient.bmi}
                  </p>
                ) : (
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Profile Loaded</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
            {/* Card 1: Total Patients */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-slate-700 text-teal-600 dark:text-teal-400 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Patients</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{total_patients}</p>
              </div>
            </div>

            {/* Card 2: Total Scans */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 mr-4">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Total Scans</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{total_scans}</p>
              </div>
            </div>

            {/* Card 3: Reports Generated */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 mr-4">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Reports Generated</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{reports_generated}</p>
              </div>
            </div>

            {/* Card 4: Avg Patient Age */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 mr-4">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Avg. Patient Age</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{average_patient_age} yrs</p>
              </div>
            </div>

            {/* Card 5: Average Confidence */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-slate-700 text-yellow-600 dark:text-yellow-400 mr-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Avg. Confidence</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{average_confidence}%</p>
              </div>
            </div>

            {/* Card 6: Most Common Prediction */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-slate-700 text-purple-600 dark:text-purple-400 mr-4">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Primary Diagnosis</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[150px]" title={most_common_prediction}>{most_common_prediction}</p>
              </div>
            </div>

            {/* Card 7: Healthy Cases */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-slate-700 text-green-600 dark:text-green-400 mr-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">Healthy Cases</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{healthy_predictions}</p>
              </div>
            </div>

            {/* Card 8: CVD Risk Cases */}
            <div className="bg-white dark:bg-slate-800 overflow-hidden shadow sm:rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center">
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-slate-700 text-rose-600 dark:text-rose-400 mr-4">
                <Heart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">CVD Risk Cases</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{risk_predictions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Main Visual Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <span>Confidence Trend over Scans</span>
              </h3>
            </div>
            <div className="h-80 relative">
              {confidence_trend.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                  No prediction data available. Perform your first scan to populate chart.
                </div>
              )}
            </div>
          </div>

          {/* Action Panel & Latest Prediction */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                <span>Latest Scan Result</span>
              </h3>
              {stats.latest_prediction ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-[120px] truncate" title={stats.latest_prediction.image_name}>
                      {stats.latest_prediction.image_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(stats.latest_prediction.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Inference Findings:</p>
                  <p className={`text-lg font-extrabold mt-1 ${
                    stats.latest_prediction.prediction === "Healthy"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {stats.latest_prediction.prediction}
                  </p>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Confidence:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{stats.latest_prediction.confidence}%</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 text-sm italic">
                  No prediction runs found.
                </p>
              )}
            </div>
            <div className="mt-6">
              <Link
                to="/predict"
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow transition duration-150"
              >
                <span>Launch New Scan</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Reports</h3>
            <Link to="/history" className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 flex items-center space-x-1">
              <span>View Full History</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Report Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prediction Result</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Generated</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {recent_predictions.length > 0 ? (
                  recent_predictions.map((p) => {
                    const reportName = p.report_path ? p.report_path.split('/').pop() : `report_${p.id}.pdf`;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400 max-w-[200px] truncate" title={reportName}>
                          <Link to={`/scan/${p.scan_id || p.id}`} className="hover:underline">
                            {reportName}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            p.prediction === "Healthy"
                              ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400"
                          }`}>
                            {p.prediction}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 font-bold">
                          {p.confidence}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {new Date(p.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/scan/${p.scan_id || p.id}`}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-md transition"
                              title="View Scan Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <a
                              href={`http://localhost:8000/report/${p.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-md transition"
                              title="View Report PDF"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                            <button
                              onClick={() => handleDownloadReport(p.id, reportName)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md transition"
                              title="Download Report PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-400 dark:text-slate-500 italic">
                      No recent scans. Upload an image to view reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
