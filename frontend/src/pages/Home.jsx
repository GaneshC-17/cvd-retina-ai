import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Brain, FileText, ArrowRight, CheckCircle } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)]">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Prediction of Cardiovascular Disease <br/>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Using Retinal Fundus Classification
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-500 dark:text-slate-400">
              An advanced deep learning framework utilizing MobileNetV2 transfer learning to identify cardiovascular risk factors through microvascular analysis of retinal fundus scans.
            </p>
            
            <div className="mt-10 flex justify-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-emerald-600 hover:bg-emerald-700 transition duration-150 ease-in-out"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-emerald-600 hover:bg-emerald-700 transition duration-150 ease-in-out"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-6 py-3 border border-slate-300 dark:border-slate-700 text-base font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-150 ease-in-out"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative background blurs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      </div>

      {/* Research Background */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Retinal Biomarkers</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              The retina is the only place in the human body where blood vessels can be directly observed. Microvascular abnormalities (e.g., vessel narrowing, exudates) serve as indicators of systemic cardiovascular pathology.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">MobileNetV2 CNN</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Utilizing a convolutional neural network pre-trained on ImageNet and customized via transfer learning to identify fine-grained geometric features, vascular branching, and lesions in retinal fundus scans.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="h-12 w-12 rounded-lg bg-emerald-50 dark:bg-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Non-Invasive Screening</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              This technology serves as an accessible, rapid, and non-invasive preliminary screening option. It helps flag high-risk individuals for thorough diagnostic testing (e.g., ECG, echocardiograms).
            </p>
          </div>
        </div>
      </div>

      {/* Methodology Section */}
      <div className="bg-white dark:bg-slate-800/50 py-16 border-t border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase">System Architecture</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              How the Classification Pipeline Works
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow">1</div>
                <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Image Upload</h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">User uploads a high-resolution retinal fundus camera image.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow">2</div>
                <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Preprocessing</h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Inference engine crops, resizes to 224x224, and normalizes pixels.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow">3</div>
                <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Inference</h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Model runs deep feature extraction and predicts healthy/risk classes.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow">4</div>
                <h4 className="mt-4 font-bold text-slate-900 dark:text-white">Results & Logs</h4>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Dashboard displays findings and saves logs for medical records auditing.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
