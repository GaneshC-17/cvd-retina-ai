import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authUpdateProfile, authChangePassword } from '../services/api';
import { User, Mail, Shield, Calendar, AlertCircle, CheckCircle, Lock, Check, X } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  
  // Profile Update State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isPwdLoading, setIsPwdLoading] = useState(false);

  // Password requirements checklist
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName || !username || !email) {
      setProfileError('Fields cannot be empty.');
      return;
    }

    setIsProfileLoading(true);
    try {
      const res = await authUpdateProfile({ 
        full_name: fullName, 
        username, 
        email 
      });
      updateUser(res.data);
      setProfileSuccess('Profile metadata updated successfully.');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Profile update failed.';
      setProfileError(errMsg);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdError('Please fill in all fields.');
      return;
    }

    const missingRequirement = getMissingRequirement(newPassword);
    if (missingRequirement) {
      setPwdError(missingRequirement);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setIsPwdLoading(true);
    try {
      await authChangePassword({ old_password: oldPassword, new_password: newPassword });
      setPwdSuccess('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'Failed to change password.';
      setPwdError(errMsg);
    } finally {
      setIsPwdLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-[calc(100vh-10rem)] py-8 animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">
          Account Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Summary Info Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 h-fit transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">User Profile Card</h3>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Full Name</p>
                  <p className="font-semibold text-slate-950 dark:text-white">{user?.full_name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                  <User className="h-5 w-5 opacity-60" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Username</p>
                  <p className="font-semibold text-slate-950 dark:text-white">{user?.username}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Email Address</p>
                  <p className="font-semibold text-slate-950 dark:text-white truncate max-w-[200px]">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Access Level</p>
                  <p className="font-semibold text-slate-950 dark:text-white capitalize">{user?.role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                <div className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Joined Date</p>
                  <p className="font-semibold text-slate-950 dark:text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Update Profile & Change Password */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Update Profile Metadata Form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Profile Metadata</h3>
              
              {profileError && (
                <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isProfileLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition"
                >
                  {isProfileLoading ? 'Saving...' : 'Save Updates'}
                </button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 transition-all duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Change Secure Password</h3>
              
              {pwdError && (
                <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Old Password</label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                {newPassword.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">New Password Requirements:</span>
                    {passwordRequirements.map((req, idx) => {
                      const isMet = req.test(newPassword);
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

                <button
                  type="submit"
                  disabled={isPwdLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition"
                >
                  {isPwdLoading ? 'Processing...' : 'Update Password'}
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
