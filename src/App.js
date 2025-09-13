import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import UserList from './components/Users/UserList';
import Login from './components/AuthX/Login';
import Register from './components/AuthX/Register';
import ForgotPassword from './components/AuthX/ForgotPassword';
import ResetPassword from './components/AuthX/ResetPassword';
import Navbar from './components/Common/Navbar';

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Check JWT expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
      }
    }
  } catch {
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppContent() {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  const location = useLocation();

  // Hide navbar on auth pages (login, register, forgot-password, reset-password)
  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  const shouldShowNavbar = isAuthenticated && !isAuthPage;

  return (
    <div>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/transactions" element={<RequireAuth><TransactionList /></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><UserList /></RequireAuth>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;