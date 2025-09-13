import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import UserList from './components/Users/UserList';
import Login from './components/AuthX/Login';
import Register from './components/AuthX/Register';
import ForgotPassword from './components/AuthX/ForgotPassword';
import ResetPassword from './components/AuthX/ResetPassword';
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import UserProfile from './components/Users/UserProfile';

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
  const location = useLocation();
  const hideAppBar = location.pathname === '/login' || location.pathname === '/logout';
  // Check for Admin role in JWT
  const token = localStorage.getItem('token');
  let isAdmin = false;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      isAdmin = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'Admin';
    }
  } catch {}

  const [profileOpen, setProfileOpen] = React.useState(false);
  // Get user info from JWT
  let userProfile = null;
  try {
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userProfile = {
        userName: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
        email: payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
        roleName: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '',
      };
    }
  } catch {}

  return (
    <Box sx={{ flexGrow: 1 }}>
      {!hideAppBar && (
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar sx={{ justifyContent: 'flex-start', gap: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 0, fontWeight: 700, color: '#1976d2', mr: 2 }}>
              SmartCashbook
            </Typography>
            <Button component={Link} to="/dashboard" color="primary" sx={{ textTransform: 'none', fontWeight: 500 }}>
              Dashboard
            </Button>
            <Button component={Link} to="/transactions" color="primary" sx={{ textTransform: 'none', fontWeight: 500 }}>
              Transactions
            </Button>
            {isAdmin && (
              <Button component={Link} to="/users" color="primary" sx={{ textTransform: 'none', fontWeight: 500 }}>
                Users
              </Button>
            )}
            {/* Profile Icon */}
            {userProfile && (
              <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => setProfileOpen(true)} sx={{ minWidth: 0, p: 0 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                    {userProfile.userName.charAt(0).toUpperCase()}
                  </Box>
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      )}
      {/* Profile Modal/Popup */}
      {profileOpen && (
        <Box sx={{ position: 'fixed', top: 70, right: 30, zIndex: 1300 }}>
          <Box sx={{ position: 'relative' }}>
            <Button onClick={() => setProfileOpen(false)} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>X</Button>
            <UserProfile user={userProfile} />
            <Button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              variant="contained"
              color="error"
              sx={{ mt: 2, width: '100%' }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      )}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Routes>
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/transactions" element={<RequireAuth><TransactionList /></RequireAuth>} />
          <Route path="/users" element={<RequireAuth><UserList /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
        </Routes>
      </Box>
    </Box>
  );
}
function Logout() {
  React.useEffect(() => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }, []);
  return null;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;