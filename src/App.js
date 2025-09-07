import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import TransactionList from './components/Transactions/TransactionList';
import UserList from './components/Users/UserList';
import Login from './components/AuthX/Login';
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';

function AppContent() {
  const location = useLocation();
  const hideAppBar = location.pathname === '/login' || location.pathname === '/logout';
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
            <Button component={Link} to="/users" color="primary" sx={{ textTransform: 'none', fontWeight: 500 }}>
              Users
            </Button>
            <Button component={Link} to="/logout" color="primary" sx={{ textTransform: 'none', fontWeight: 500 }}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>
      )}
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionList />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Box>
    </Box>
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
