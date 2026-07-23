import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authRegister } from '../services/api';
import { Activity, User, Mail, Lock, AlertCircle, CheckCircle, Check, X } from 'lucide-react';

const Register = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [role, setRole] = useState('user'); // 'user' (Clinician) or 'patient' (Normal User)
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [bmi, setBmi] = useState('');
  const [bmiCategory, setBmiCategory] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto BMI calculation effect
  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const heightM = h / 100.0;
      const bmiVal = w / (heightM * heightM);
      const roundedBmi = bmiVal.toFixed(2);
      setBmi(roundedBmi);
      
      if (bmiVal < 18.5) setBmiCategory('Underweight');
      else if (bmiVal < 25.0) setBmiCategory('Normal');
      else if (bmiVal < 30.0) setBmiCategory('Overweight');
      else setBmiCategory('Obese');
    } else {
      setBmi('');
      setBmiCategory('');
    }
  }, [height, weight]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

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

    // Validations
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (role === 'patient') {
      if (!age || !gender || !phone || !height || !weight) {
        setError('Please fill in all patient demographics fields.');
        return;
      }
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
    // Derive a unique username from email
    const username = email.split('@')[0];

    try {
      const payload = {
        full_name: fullName,
        username: username,
        email: email,
        password: password,
        role: role
      };

      if (role === 'patient') {
        payload.age = parseInt(age, 10);
        payload.gender = gender;
        payload.phone = phone;
        payload.height = parseFloat(height);
        payload.weight = parseFloat(weight);
        if (notes.trim()) payload.notes = notes;
      }

      await authRegister(payload);
      setSuccess('Account registered successfully! Redirecting to login page...');
      setIsLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setIsLoading(false);
      const errMsg = err.response?.data?.detail || 'Registration failed. Try again.';
      setError(errMsg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Activity className="h-12 w-12 text-emerald-600 animate-pulse" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white animate-fade-in">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Or{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 transition-colors">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-800 py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-200 dark:border-slate-700 transition-all duration-300">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm animate-shake">
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
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`py-2 px-4 rounded-lg text-sm font-semibold border text-center transition-all ${
                    role === 'user'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Clinic / Professional
                </button>
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-2 px-4 rounded-lg text-sm font-semibold border text-center transition-all ${
                    role === 'patient'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Patient / Personal
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-150"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-150"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {role === 'patient' && (
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Demographics</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Age
                    </label>
                    <input
                      id="age"
                      type="number"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-xs focus:outline-none focus:ring-emerald-500"
                      placeholder="e.g. 45"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Gender
                    </label>
                    <select
                      id="gender"
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-xs focus:outline-none focus:ring-emerald-500"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-xs focus:outline-none focus:ring-emerald-500"
                    placeholder="e.g. +12345678"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="height" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Height (cm)
                    </label>
                    <input
                      id="height"
                      type="number"
                      required
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-xs focus:outline-none focus:ring-emerald-500"
                      placeholder="170"
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Weight (kg)
                    </label>
                    <input
                      id="weight"
                      type="number"
                      required
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-xs focus:outline-none focus:ring-emerald-500"
                      placeholder="70"
                    />
                  </div>
                </div>

                {bmi && (
                  <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-semibold text-slate-500">BMI: <strong className="text-slate-800 dark:text-slate-200">{bmi}</strong></span>
                    <span className="font-semibold text-slate-500">Category: <strong className="text-slate-800 dark:text-slate-200">{bmiCategory}</strong></span>
                  </div>
                )}

                <div>
                  <label htmlFor="notes" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Medical Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-xs focus:outline-none focus:ring-emerald-500"
                    placeholder="Any relevant medical history..."
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
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
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-150"
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm Password
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
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all duration-150"
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
                  'Register'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
