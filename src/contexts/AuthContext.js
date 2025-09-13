import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jwtUtils } from '../utils/jwtUtils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTokenExpiring, setIsTokenExpiring] = useState(false);
  const [timeUntilExpiration, setTimeUntilExpiration] = useState(0);

  // Decode user info from token
  const decodeUserFromToken = useCallback((token) => {
    if (!token) return null;

    try {
      const payload = jwtUtils.decodeToken(token);
      if (payload) {
        return {
          userId: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.userId,
          username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.username,
          email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || payload.email,
          role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || payload.role,
          exp: payload.exp
        };
      }
    } catch (error) {
      console.error('Error decoding user from token:', error);
    }
    return null;
  }, []);

  // Update authentication state
  const updateAuthState = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      const userInfo = decodeUserFromToken(newToken);
      setUser(userInfo);
      setIsAuthenticated(true);

      // Check if token will expire soon (within 5 minutes)
      const willExpire = jwtUtils.willExpireSoon(newToken, 5);
      setIsTokenExpiring(willExpire);
      setTimeUntilExpiration(jwtUtils.getTimeUntilExpiration(newToken));
    } else {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsTokenExpiring(false);
      setTimeUntilExpiration(0);
    }
  }, [decodeUserFromToken]);

  // Login function
  const login = useCallback(async (identifier, password) => {
    try {
      const response = await axios.post('/api/Auth/login', {
        identifier,
        password
      });

      if (response.data && response.data.token) {
        updateAuthState(response.data.token);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  }, [updateAuthState]);

  // Logout function
  const logout = useCallback(() => {
    updateAuthState(null);
  }, [updateAuthState]);

  // Refresh token function - extends current token expiration
  const refreshToken = useCallback(async () => {
    if (!token) return { success: false, error: 'No token to refresh' };

    try {
      // Decode the current token
      const payload = jwtUtils.decodeToken(token);
      if (!payload) {
        return { success: false, error: 'Invalid token format' };
      }

      // Extend expiration by 30 minutes
      const newExpiration = Math.floor(Date.now() / 1000) + (30 * 60); // 30 minutes from now
      const extendedPayload = {
        ...payload,
        exp: newExpiration
      };

      // Create a new token with extended expiration
      // Note: In a real application, this would be done on the server
      // For demo purposes, we'll simulate token extension
      const header = JSON.parse(atob(token.split('.')[0]));
      const newToken = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(extendedPayload))}.${token.split('.')[2]}`;

      // Update auth state with the "refreshed" token
      updateAuthState(newToken);

      return { success: true };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh token'
      };
    }
  }, [token, updateAuthState]);

  // Check token expiration periodically
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiration = () => {
      if (jwtUtils.isTokenExpired(token)) {
        logout();
        return;
      }

      const willExpire = jwtUtils.willExpireSoon(token, 5);
      setIsTokenExpiring(willExpire);
      setTimeUntilExpiration(jwtUtils.getTimeUntilExpiration(token));
    };

    // Check immediately
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [token, logout]);

  // Initialize auth state on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !jwtUtils.isTokenExpired(storedToken)) {
      updateAuthState(storedToken);
    } else if (storedToken) {
      // Token exists but is expired
      localStorage.removeItem('token');
    }
  }, [updateAuthState]);

  const value = {
    token,
    user,
    isAuthenticated,
    isTokenExpiring,
    timeUntilExpiration,
    login,
    logout,
    refreshToken,
    updateAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};