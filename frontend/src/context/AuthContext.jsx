import React, { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authGetMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        setToken(storedToken);
        const res = await authGetMe();
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Session validation failed:", err);
        logout();
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authLogin({ email, password });
      const { access_token } = res.data;
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Load user profile details
      const userRes = await authGetMe();
      setUser(userRes.data);
      setIsAuthenticated(true);
      setIsLoading(false);
      return { success: true };
    } catch (err) {
      setIsLoading(false);
      const errMsg = err.response?.data?.detail || "Login failed. Please check credentials.";
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
