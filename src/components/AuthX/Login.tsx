import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  AccountCircle,
  Lock,
  Visibility,
  VisibilityOff,
  AccountBalanceWallet
} from '@mui/icons-material';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { identifier, password: '***' });

      const response = await axios.post('/api/Auth/login', {
        identifier,
        password
      });

      console.log('Login response:', response.data);

      if (response.data && (response.data as any).token) {
        localStorage.setItem('token', (response.data as any).token);
        console.log('Token stored, navigating to dashboard...');
        navigate('/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.response) {
        // Server responded with error
        if (err.response.status === 401) {
          setError('Invalid username/email or password');
        } else if (err.response.status === 400) {
          setError('Please check your input and try again');
        } else if (err.response.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Login failed. Please try again.');
        }
      } else if (err.request) {
        // Network error
        setError('Unable to connect to server. Please check your connection.');
      } else {
        // Other error
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        padding: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        {/* Logo/Brand Section */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <AccountBalanceWallet
            sx={{
              width: 60,
              height: 60,
              color: 'primary.main',
              mb: 2
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 400,
              color: 'text.primary',
              fontSize: '24px',
              mb: 1
            }}
          >
            SmartCashbook
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: '16px'
            }}
          >
            Sign in to continue
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            label="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            variant="outlined"
            disabled={loading}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                backgroundColor: 'background.paper',
                '& input': {
                  backgroundColor: 'background.paper',
                  WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset`,
                  '&::-webkit-autofill': {
                    WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                    backgroundColor: 'background.paper !important',
                  },
                },
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'divider',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              },
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
                '&.Mui-focused': {
                  color: 'primary.main',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            disabled={loading}
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                backgroundColor: 'background.paper',
                '& input': {
                  backgroundColor: 'background.paper',
                  WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset`,
                  '&::-webkit-autofill': {
                    WebkitBoxShadow: (theme) => `0 0 0 100px ${theme.palette.background.paper} inset !important`,
                    backgroundColor: 'background.paper !important',
                  },
                },
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'divider',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              },
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
                '&.Mui-focused': {
                  color: 'primary.main',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                    disabled={loading}
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Sign In Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: '14px',
              fontWeight: 500,
              textTransform: 'none',
              borderRadius: 1,
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&:disabled': {
                backgroundColor: 'action.disabledBackground',
                color: 'action.disabled',
              },
              mb: 3
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'primary.contrastText' }} />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </Box>

        {/* Sign Up Link */}
        <Box sx={{ textAlign: 'center', borderTop: '1px solid', borderTopColor: 'divider', pt: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Create account
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
