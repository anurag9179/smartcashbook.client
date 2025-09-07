import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface UserProfileProps {
  user: {
    userName: string;
    email: string;
    roleName: string;
  } | null;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  if (!user) return null;
  return (
    <Paper elevation={3} sx={{ p: 3, minWidth: 300 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1976d2' }}>Profile</Typography>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body1"><strong>Username:</strong> {user.userName}</Typography>
      </Box>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body1"><strong>Email:</strong> {user.email}</Typography>
      </Box>
      <Box sx={{ mb: 1 }}>
        <Typography variant="body1"><strong>Role:</strong> {user.roleName}</Typography>
      </Box>
    </Paper>
  );
};

export default UserProfile;
