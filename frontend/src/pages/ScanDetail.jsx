import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getScanDetails } from '../services/api';
import { ChevronLeft, FileDown, Calendar, User, Shield, Info, Activity, ZoomIn } from 'lucide-react';

const ScanDetail = () => {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Sync-Zoom State
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const [zoomScale, setZoomScale] = useState(2.2);

  const containerRef = useRef(null);

  useEffect(() => {
    const fetchScanDetails = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const res = await getScanDetails(scanId);
        setScan(res.data);
      } catch (err) {
        console.error("Error fetching scan details:", err);
        setErrorMsg("Failed to retrieve scan details. The record may not exist or you may not have permission to view it.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchScanDetails();
  }, [scanId]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    // Get mouse position relative to the element that triggered it (or the container)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomCoords({ x, y });
  };

  const handleMouseEnter = () => {
    setIsZoomed(true);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (errorMsg || !scan) {
    return (
      <div className="min-h-[calc(100vh-10rem)] py-12 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-md">
          <Info className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error Accessing Scan</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{errorMsg || "Record not found"}</p>
          <Link
            to="/history"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 shadow"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span>Back to History</span>
          </Link>
        </div>
      </div>
    );
  }

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

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/50';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50 animate-pulse';
      case 'Failed':
        return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50';
      default:
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50';
    }
  };

  const originalImgUrl = scan.image_path ? `http://localhost:8000/${scan.image_path}` : null;
  const gradcamImgUrl = scan.gradcam_image ? `http://localhost:8000/${scan.gradcam_image}` : null;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
              title="Go Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Scan Analysis: {scan.scan_id || `SCAN-${scan.id}`}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeStyles(scan.status || 'Completed')}`}>
                  {scan.status || 'Completed'}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span>Screened on {new Date(scan.scan_date || scan.timestamp).toLocaleString()}</span>
              </p>
            </div>
          </div>
          
          {scan.report_path && scan.status === 'Completed' && (
            <a
              href={`http://localhost:8000/report/${scan.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-colors"
            >
              <FileDown className="mr-2 h-4 w-4" />
              <span>Download PDF Report</span>
            </a>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Diagnostics & Patient details */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Diagnostic Outcome */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
                <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Diagnostic Outcome</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Classification</span>
                  <span className={`text-xl font-black ${scan.prediction === 'Healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {scan.prediction}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Category</span>
                    <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getRiskBadgeStyles(scan.risk_level)}`}>
                      {scan.risk_level || 'Healthy'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {scan.confidence.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>Diagnostic Logic:</strong> This model maps retinal vasculature markers using transfer learning on a MobileNetV2 architecture. Risk assessment represents the softmax probability mapped to standardized cardiovascular screening ranges.
                </div>
              </div>
            </div>

            {/* Patient Demographics */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6">
              <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
                <User className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Patient Information</h2>
              </div>
              
              {scan.patient ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Patient ID</span>
                    <Link to={`/patients/${scan.patient.patient_id}`} className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                      {scan.patient.patient_id}
                    </Link>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Full Name</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{scan.patient.full_name}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Age / Gender</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{scan.patient.age} years / {scan.patient.gender}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Height / Weight</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{scan.patient.height} cm / {scan.patient.weight} kg</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">BMI / Classification</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {scan.patient.bmi} ({scan.patient.bmi_category})
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Contact Phone</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{scan.patient.phone}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Email Address</span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[200px]" title={scan.patient.email}>{scan.patient.email}</span>
                  </div>

                  {scan.patient.notes && (
                    <div className="pt-2">
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Clinical Remarks</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
                        {scan.patient.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No patient record linked to this scan.</p>
              )}
            </div>

          </div>

          {/* Right Column: Sync-Zoom Images */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Sync-Zoom Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/80 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-700 pb-3 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <ZoomIn className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Interactive Sync-Zoom Comparison</h2>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="hidden sm:inline">Hover over either image to zoom both in sync</span>
                  <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span>Scale:</span>
                    <input
                      type="range"
                      min="1.5"
                      max="3.5"
                      step="0.1"
                      value={zoomScale}
                      onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                      className="w-16 accent-teal-600"
                    />
                    <span className="font-semibold w-7">{zoomScale}x</span>
                  </div>
                </div>
              </div>

              {scan.status === 'Completed' && originalImgUrl && gradcamImgUrl ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={containerRef}>
                  
                  {/* Original Image */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Original Retinal Scan</span>
                    <div
                      className="relative overflow-hidden w-full aspect-square bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-crosshair group shadow-inner"
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <img
                        src={originalImgUrl}
                        alt="Original retinal scan"
                        className="w-full h-full object-cover transition-transform duration-75 select-none"
                        style={{
                          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
                          transformOrigin: isZoomed ? `${zoomCoords.x}% ${zoomCoords.y}%` : '50% 50%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Heatmap Image */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">AI Attention (Grad-CAM)</span>
                    <div
                      className="relative overflow-hidden w-full aspect-square bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-crosshair group shadow-inner"
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <img
                        src={gradcamImgUrl}
                        alt="Grad-CAM visual heatmap"
                        className="w-full h-full object-cover transition-transform duration-75 select-none"
                        style={{
                          transform: isZoomed ? `scale(${zoomScale})` : 'scale(1)',
                          transformOrigin: isZoomed ? `${zoomCoords.x}% ${zoomCoords.y}%` : '50% 50%'
                        }}
                      />
                    </div>
                  </div>

                </div>
              ) : (
                <div className="aspect-[2/1] w-full bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-slate-500">
                  <Activity className="h-10 w-10 mb-2 animate-pulse" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">Retinal scan images are not available</p>
                  <p className="text-xs mt-1 max-w-xs">If this scan is currently processing, please wait. If it failed, check the errors in details.</p>
                </div>
              )}

              {/* Attention Map Legend */}
              {scan.status === 'Completed' && gradcamImgUrl && (
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1.5 text-teal-600" />
                    Heatmap Attention Spectrum Legend
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                      Grad-CAM maps gradients of the target class in the final convolutional layer. Colors show relative pixel contributions to model weights.
                    </p>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low</span>
                      <div className="h-3 w-40 rounded bg-gradient-to-r from-blue-600 via-green-400 via-yellow-300 to-red-600 border border-slate-200 dark:border-slate-700"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">High</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ScanDetail;
