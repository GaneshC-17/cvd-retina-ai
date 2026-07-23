import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} CVD-Retina AI. Final Year College Project Demonstration.
        </p>
        <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-2 max-w-2xl mx-auto font-medium">
          ⚠️ Disclaimer: This application is an academic demonstration project using deep learning. The generated predictions are not clinical diagnoses, do not replace expert medical advice, and should not be used for patient treatment decisions.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
