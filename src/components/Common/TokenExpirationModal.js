import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Warning,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { jwtUtils } from '../../utils/jwtUtils';

const TokenExpirationModal = () => {
  const { isTokenExpiring, timeUntilExpiration, refreshToken, logout, token } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(timeUntilExpiration);

  // Update countdown every second for better UX
  useEffect(() => {
    if (!isTokenExpiring) return;

    const updateCountdown = () => {
      const currentTimeUntilExpiration = jwtUtils.getTimeUntilExpiration(token);
      setCountdown(currentTimeUntilExpiration);

      if (currentTimeUntilExpiration <= 0) {
        // Auto logout when countdown reaches 0
        logout();
        return;
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second for smooth countdown
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [isTokenExpiring, logout, token]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError('');

    const result = await refreshToken();

    if (result.success) {
      // Token refreshed successfully, modal will close automatically
    } else {
      setError(result.error);
    }

    setIsRefreshing(false);
  };

  const handleLogout = () => {
    logout();
  };

  if (!isTokenExpiring) return null;

  return (
    <Dialog
      open={isTokenExpiring}
      onClose={() => {}} // Prevent closing by clicking outside
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: 'warning.main'
      }}>
        <Warning />
        Session Expiring Soon
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your session will expire in <strong>{countdown} minute{countdown !== 1 ? 's' : ''}</strong>.
            Please refresh your session to continue using the application.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            If you don't refresh now, you'll be automatically logged out to protect your account security.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 2,
          bgcolor: 'warning.light',
          borderRadius: 1,
          color: 'warning.contrastText'
        }}>
          <CircularProgress size={16} color="inherit" />
          <Typography variant="body2">
            Time remaining: {countdown} minute{countdown !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleLogout}
          color="inherit"
          disabled={isRefreshing}
          sx={{ mr: 1 }}
        >
          Logout Now
        </Button>

        <Button
          onClick={handleRefresh}
          variant="contained"
          color="primary"
          disabled={isRefreshing}
          startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TokenExpirationModal;