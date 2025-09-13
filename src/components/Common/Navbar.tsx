import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Chip,
  Tooltip,
  Badge,
  Switch
} from '@mui/material';
import {
  AccountBalanceWallet,
  Dashboard,
  Receipt,
  People,
  AccountCircle,
  Logout,
  Settings,
  Person,
  Help,
  Feedback,
  Brightness4,
  Brightness7,
  Notifications,
  Search,
  AdminPanelSettings
} from '@mui/icons-material';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { userPermissions } from '../../utils/jwtUtils';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications] = useState(3); // Mock notification count
  const open = Boolean(anchorEl);

  // Get theme context
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  // Get auth context
  const { user, logout } = useAuth();

  // Get user data from JWT token
  useEffect(() => {
    // User data is now managed by AuthContext
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleProfileMenuClose();
  };

  const handleHelpClick = () => {
    // Could open help documentation or support
    window.open('https://github.com/anurag9179/smartcashbook', '_blank');
    handleProfileMenuClose();
  };

  const handleFeedbackClick = () => {
    // Could open feedback form
    alert('Feedback feature coming soon!');
    handleProfileMenuClose();
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return '#d93025';
      case 'manager':
        return '#fbbc04';
      default:
        return '#34a853';
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ minHeight: '64px' }}>
        {/* Logo/Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
          <AccountBalanceWallet
            sx={{
              color: 'primary.main',
              mr: 1.5,
              fontSize: '28px'
            }}
          />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 500,
              fontSize: '20px',
              color: 'primary.main',
              textDecoration: 'none'
            }}
          >
            SmartCashbook
          </Typography>
        </Box>

        {/* Navigation Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            component={Link}
            to="/dashboard"
            startIcon={<Dashboard />}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'text.primary'
              }
            }}
          >
            Dashboard
          </Button>

          <Button
            component={Link}
            to="/transactions"
            startIcon={<Receipt />}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover',
                color: 'text.primary'
              }
            }}
          >
            Transactions
          </Button>

          {userPermissions.canManageUsers(user?.role) && (
            <Button
              component={Link}
              to="/users"
              startIcon={<People />}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontSize: '14px',
                fontWeight: 500,
                px: 2,
                py: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                  color: 'text.primary'
                }
              }}
            >
              Users
            </Button>
          )}
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Right Side Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          {/* Search Button */}
          <Tooltip title="Search">
            <IconButton
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Search />
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Badge badgeContent={notifications} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
            <IconButton
              onClick={handleThemeToggle}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              {darkMode ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* User Info - Hidden on very small screens */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: 1.2
              }}
            >
              {user?.username || 'User'}
            </Typography>
            {userPermissions.isAdmin(user?.role) && (
              <Chip
                label="Admin"
                size="small"
                sx={{
                  height: '16px',
                  fontSize: '10px',
                  backgroundColor: getRoleColor(user.role),
                  color: 'white',
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            )}
          </Box>

          {/* Profile Avatar */}
          <Tooltip title="Account">
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.25,
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: user?.role === 'Admin' ? '2px solid' : 'none',
                  borderColor: user?.role === 'Admin' ? 'error.main' : 'transparent'
                }}
              >
                {getInitials(user?.username || 'User')}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Enhanced Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 280,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 6px rgba(32,33,36,.28)'
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info Header */}
          <Box sx={{ px: 2, py: 2, backgroundColor: 'action.hover' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.main',
                  fontSize: '18px',
                  fontWeight: 500
                }}
              >
                {getInitials(user?.username || 'User')}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    fontSize: '16px',
                    lineHeight: 1.2
                  }}
                >
                  {user?.username || 'User'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '14px'
                  }}
                >
                  {user?.email || ''}
                </Typography>
                {user?.role && (
                  <Chip
                    label={userPermissions.getRoleDisplayName(user.role)}
                    size="small"
                    sx={{
                      mt: 0.5,
                      height: '18px',
                      fontSize: '11px',
                      backgroundColor: getRoleColor(user.role),
                      color: 'white',
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 0 }} />

          {/* Menu Items */}
          <MenuItem onClick={handleProfileClick} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: '40px' }}>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Your Profile"
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500
              }}
            />
          </MenuItem>

          <MenuItem onClick={handleSettingsClick} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: '40px' }}>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500
              }}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          {/* Theme Toggle in Menu */}
          <Box sx={{ px: 2, py: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={handleThemeToggle}
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {darkMode ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
                  <Typography variant="body2" sx={{ fontSize: '14px' }}>
                    Dark theme
                  </Typography>
                </Box>
              }
              sx={{
                margin: 0,
                width: '100%',
                '& .MuiFormControlLabel-label': {
                  display: 'flex',
                  alignItems: 'center'
                }
              }}
            />
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem onClick={handleHelpClick} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: '40px' }}>
              <Help fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Help & Support"
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500
              }}
            />
          </MenuItem>

          <MenuItem onClick={handleFeedbackClick} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: '40px' }}>
              <Feedback fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Send Feedback"
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500
              }}
            />
          </MenuItem>

          <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2 }}>
            <ListItemIcon sx={{ color: 'error.main', minWidth: '40px' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sign out"
              primaryTypographyProps={{
                fontSize: '14px',
                fontWeight: 500,
                color: 'error.main'
              }}
            />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
