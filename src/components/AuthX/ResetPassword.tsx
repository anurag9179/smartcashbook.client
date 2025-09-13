import React, { useState } from 'react';
import axios from 'axios';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await axios.post('/api/Auth/reset-password', { email, token, newPassword });
      setMessage((response.data as any).message || 'Password reset successful.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: 'center', color: '#1976d2' }}>
          Reset Password
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Reset Token"
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          {message && <Typography color="primary" sx={{ mb: 2 }}>{message}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1, fontWeight: 600 }}>
            Reset Password
          </Button>
        </form>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          <a href="/login" style={{ color: '#1976d2', fontWeight: 500 }}>
            Back to Login
          </a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
