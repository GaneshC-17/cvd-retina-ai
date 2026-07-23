import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatientProfile } from '../services/api';
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
  User, 
  Calendar, 
  ShieldAlert, 
  FileDown, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Activity,
  Heart,
  PlusCircle
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

const PatientProfile = () => {
  const { patientId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await getPatientProfile(patientId);
        setProfile(res.data);
      } catch (err) {
        console.error("Error fetching patient profile:", err);
        setErrorMsg("Failed to retrieve patient profile. The patient record may not exist or you do not have permission to view it.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [patientId]);

  const handleDownloadHistoryReport = async () => {
    if (!profile?.patient) return;
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/patients/${profile.patient.patient_id}/export`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to export patient history PDF.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HISTORY-${profile.patient.patient_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error exporting patient history. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingleReport = async (predictionId, reportName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/report/${predictionId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to download report PDF.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = reportName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error downloading report PDF.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="min-h-[calc(100vh-10rem)] py-12 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-md">
          <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Accessing Profile</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{errorMsg || "Record not found"}</p>
          <Link
            to="/history"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 shadow"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span>Back to Scan History</span>
          </Link>
        </div>
      </div>
    );
  }

  const { patient, scans, timeline, trend, reports } = profile;

  // Chart JS Config
  const chartData = {
    labels: trend.map((t) => t.date),
    datasets: [
      {
        label: 'Classifier Confidence (%)',
        data: trend.map((t) => t.confidence),
        borderColor: '#0d9488', // Teal-600
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#0f766e',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        pointRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            return `Result: ${trend[index].prediction}`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Healthy':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'Low Risk':
        return 'text-blue-600 dark:text-blue-400';
      case 'Moderate Risk':
        return 'text-amber-600 dark:text-amber-400';
      case 'High Risk':
        return 'text-rose-600 dark:text-rose-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
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

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-2xl text-teal-600 dark:text-teal-400">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{patient.full_name}</h1>
                <span className="text-sm font-semibold text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200/50 dark:border-slate-700/50">{patient.patient_id}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Patient lifecycle profile, diagnostic timelines, and history records.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {scans.length > 0 && (
              <button
                onClick={handleDownloadHistoryReport}
                disabled={isExporting}
                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md transition disabled:opacity-50"
              >
                <FileDown className="mr-2 h-4 w-4" />
                <span>{isExporting ? 'Generating Report...' : 'Download Patient History'}</span>
              </button>
            )}
            <Link
              to="/predict"
              className="inline-flex items-center px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-sm font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition"
            >
              <PlusCircle className="mr-2 h-4 w-4 text-teal-600" />
              <span>New Scan</span>
            </Link>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Demographics & Analytics */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Demographics Grid Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                Patient Demographics & Medical Data
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Age</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{patient.age} years</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gender</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{patient.gender}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">BMI & Category</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {patient.bmi} <span className="text-xs font-semibold text-slate-400">({patient.bmi_category})</span>
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Height</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{patient.height} cm</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Weight</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{patient.weight} kg</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Register Date</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact Details</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    Phone: {patient.phone}
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                    Email: {patient.email}
                  </span>
                </div>
              </div>
              
              {patient.notes && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Remarks</span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                    {patient.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Longitudinal Trend Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                Confidence Trend Analytics
              </h2>
              
              {trend.length > 0 ? (
                <div className="h-80 w-full relative">
                  <Line data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 italic">
                  Not enough screening points to plot trend details. Run predictions first.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Timeline & Reports */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                Scans Timeline
              </h2>
              
              {timeline.length > 0 ? (
                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                  {timeline.map((event, i) => (
                    <div key={i} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-teal-600"></span>
                      <div>
                        <span className="text-xs font-semibold text-slate-400 block">{event.date}</span>
                        <span className={`text-sm font-bold block ${event.prediction === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {event.prediction}
                        </span>
                        <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getRiskBadgeStyles(event.risk_level)}`}>
                          {event.risk_level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No scans history registered.</p>
              )}
            </div>

            {/* Reports List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-teal-600 dark:text-teal-400" />
                PDF Scan Reports
              </h2>
              
              {reports.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {reports.map((rep) => (
                    <div key={rep.report_id} className="py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/scan/${rep.scan_id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 block truncate">
                          {rep.report_id}
                        </Link>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Scan: {rep.scan_id} | {rep.date}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadSingleReport(rep.scan_id, `${rep.report_id}.pdf`)}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                        title="Download Report PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No PDF reports generated yet.</p>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default PatientProfile;
