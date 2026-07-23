import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authForgotPassword } from '../services/api';
import { Activity, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authForgotPassword({ email });
      setSuccess(res.data.message || 'If that email exists in our system, password reset instructions have been sent.');
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      const errMsg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(errMsg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Activity className="h-12 w-12 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Enter your email address and we'll send you a password reset link/token.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-200 dark:border-slate-700">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex flex-col space-y-2 text-emerald-600 dark:text-emerald-400 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-semibold">Reset Email Sent</span>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {success}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold border-t border-slate-100 dark:border-slate-700 pt-2 mt-2">
                Note: For testing/academic demonstration, please check the FastAPI backend terminal logs where the generated token is printed!
              </span>
            </div>
          )}

          {!success && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition duration-150"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-6">
            <Link to="/login" className="flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
