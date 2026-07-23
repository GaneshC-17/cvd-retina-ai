import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Shield, LogOut, Menu, X, User } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const activeStyle = "text-emerald-600 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400 pb-1";
  const inactiveStyle = "text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-150 pb-1";

  const mobileActiveStyle = "block pl-3 pr-4 py-2 border-l-4 border-emerald-500 text-base font-medium text-emerald-700 bg-emerald-50 dark:bg-slate-800 dark:text-emerald-300";
  const mobileInactiveStyle = "block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 hover:text-slate-800 dark:hover:text-white";

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-emerald-600 animate-pulse" />
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                CVD-Retina AI
              </span>
            </Link>
            
            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                  Dashboard
                </NavLink>
                <NavLink to="/predict" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                  Scan Retina
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                  Scan History
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                  Profile
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" className={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                    Admin Panel
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Side Panel */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize flex items-center justify-end space-x-1">
                    {user?.role === 'admin' && <Shield className="h-3 w-3 text-red-500" />}
                    <span>{user?.role}</span>
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition duration-150 ease-in-out"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Link
                  to="/login"
                  className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle}>
                  Dashboard
                </NavLink>
                <NavLink to="/predict" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle}>
                  Scan Retina
                </NavLink>
                <NavLink to="/history" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle}>
                  Scan History
                </NavLink>
                <NavLink to="/profile" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle}>
                  Profile
                </NavLink>
                {user?.role === 'admin' && (
                  <NavLink to="/admin" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle}>
                    Admin Panel
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle}>
                  Login
                </NavLink>
                <NavLink to="/register" onClick={() => setIsOpen(false)} className={({ isActive }) => isActive ? mobileActiveStyle : mobileInactiveStyle}>
                  Register
                </NavLink>
              </>
            )}
          </div>
          {isAuthenticated && (
            <div className="pt-4 pb-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-500 dark:text-slate-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-slate-800 dark:text-white">{user?.full_name || user?.username}</div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400 capitalize">{user?.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
