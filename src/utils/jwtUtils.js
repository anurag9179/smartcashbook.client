// JWT utility functions for token management
export const jwtUtils = {
  // Decode JWT token payload
  decodeToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    const payload = jwtUtils.decodeToken(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  },

  // Get token expiration time in milliseconds
  getTokenExpirationTime: (token) => {
    const payload = jwtUtils.decodeToken(token);
    if (!payload || !payload.exp) return null;

    return payload.exp * 1000; // Convert to milliseconds
  },

  // Check if token will expire within specified minutes
  willExpireSoon: (token, minutes = 5) => {
    const expirationTime = jwtUtils.getTokenExpirationTime(token);
    if (!expirationTime) return false;

    const now = Date.now();
    const warningTime = now + (minutes * 60 * 1000);
    return expirationTime <= warningTime;
  },

  // Get time until expiration in minutes
  getTimeUntilExpiration: (token) => {
    const expirationTime = jwtUtils.getTokenExpirationTime(token);
    if (!expirationTime) return 0;

    const now = Date.now();
    const timeLeft = expirationTime - now;
    return Math.max(0, Math.floor(timeLeft / (1000 * 60))); // Convert to minutes
  }
};

// User permission utilities
export const userPermissions = {
  // Check if user can read data
  canRead: (role) => {
    return ['Admin', 'DataEntryUser', 'Observer'].includes(role);
  },

  // Check if user can write/create data
  canWrite: (role) => {
    return ['Admin', 'DataEntryUser'].includes(role);
  },

  // Check if user can update data
  canUpdate: (role) => {
    return ['Admin', 'DataEntryUser'].includes(role);
  },

  // Check if user can delete data
  canDelete: (role) => {
    return ['Admin', 'DataEntryUser'].includes(role);
  },

  // Check if user can manage users (Admin only)
  canManageUsers: (role) => {
    return role === 'Admin';
  },

  // Check if user is observer (read-only)
  isObserver: (role) => {
    return role === 'Observer';
  },

  // Check if user is data entry user
  isDataEntryUser: (role) => {
    return role === 'DataEntryUser';
  },

  // Check if user is admin
  isAdmin: (role) => {
    return role === 'Admin';
  },

  // Get role display name
  getRoleDisplayName: (role) => {
    switch (role) {
      case 'Admin':
        return 'Administrator';
      case 'DataEntryUser':
        return 'Data Entry User';
      case 'Observer':
        return 'Observer';
      default:
        return role;
    }
  }
};