import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authResetPassword } from '../services/api';
import { Activity, Lock, AlertCircle, CheckCircle, Check, X, Key } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Extract token from query param on mount
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  // Password requirements state
  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'At least one uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'At least one lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'At least one number (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'At least one special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const getMissingRequirement = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'Password must contain at least one special character';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Please provide a valid password reset token.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    const missingRequirement = getMissingRequirement(password);
    if (missingRequirement) {
      setError(missingRequirement);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authResetPassword({ 
        token: token.trim(), 
        new_password: password 
      });
      setSuccess(res.data.message || 'Password has been reset successfully!');
      setIsLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setIsLoading(false);
      const errMsg = err.response?.data?.detail || 'Reset failed. The token may be invalid or expired.';
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
          Choose a New Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Enter the reset token printed in your backend console and select a secure new password.
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
            <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-sm">
              <CheckCircle className="h-5 w-5 flex-shrink-0 animate-bounce" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Reset Token
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Paste the JWT token here"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password font-medium" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
              
              {/* Dynamic Password Strength Checklist */}
              {password.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Password Requirements:</span>
                  {passwordRequirements.map((req, idx) => {
                    const isMet = req.test(password);
                    return (
                      <div key={idx} className="flex items-center space-x-2">
                        {isMet ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                        )}
                        <span className={isMet ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword font-medium" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
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
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-700 pt-6">
            <Link to="/login" className="text-sm font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
