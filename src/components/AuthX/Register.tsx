import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Paper, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Remove role selection; always assign default role
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/Auth/signup', { userName: username, email, password });
      navigate('/'); // Redirect to landing page after successful registration
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, textAlign: 'center', color: '#1976d2' }}>
          Register
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
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
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            fullWidth
            sx={{ mb: 2 }}
          />
          {/* Role selection removed. Role will be assigned by backend. */}
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          {success && <Typography color="primary" sx={{ mb: 2 }}>{success}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1, fontWeight: 600 }}>
            Register
          </Button>
        </form>
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          <a href="/login" style={{ color: '#1976d2', fontWeight: 500 }}>
            Already have an account? Login
          </a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;
