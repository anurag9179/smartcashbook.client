import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Paper, Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, MenuItem, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { userPermissions } from '../../utils/jwtUtils';

interface User {
  userId: number;
  userName: string;
  email: string;
  roleId: number;
}

interface Roles {
  roleId: number;
  roleName: string;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Roles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ userName: '', email: '', roleId: '', password: '' });
  const [isEdit, setIsEdit] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);

  // Get auth context and permissions
  const { user } = useAuth();
  const canManageUsers = userPermissions.canManageUsers(user?.role);

  // Ensure form is always empty and in 'Add' mode on initial load
  useEffect(() => {
    setIsEdit(false);
    setEditUser(null);
    setForm({ userName: '', email: '', roleId: '', password: '' });
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<User[]>('/api/User', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Move fetchRoles outside useEffect so it's not redefined every render
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Roles[]>('/api/Roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data);
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Always reset form to empty when not editing
  useEffect(() => {
    if (!isEdit) {
      setEditUser(null);
      setForm({ userName: '', email: '', roleId: '', password: '' });
    }
  }, [isEdit]);

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/User/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEdit = (user: User) => {
    setIsEdit(true);
    setEditUser(user);
    setForm({ userName: user.userName, email: user.email, roleId: String(user.roleId), password: '' });
  };

  const handleAdd = () => {
    setIsEdit(false);
    setEditUser(null);
    setForm({ userName: '', email: '', roleId: '', password: '' });
  };

  const handleCancel = () => {
    setIsEdit(false);
    setEditUser(null);
    setForm({ userName: '', email: '', roleId: '', password: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForm(true);
    try {
      const token = localStorage.getItem('token');
      let payload: any = {
        userName: form.userName,
        email: form.email,
        roleId: Number(form.roleId)
      };
      if (form.password) {
        payload.password = form.password;
      }
      if (isEdit && editUser) {
        // Include userId in payload for update
        payload = { ...payload, userId: editUser.userId };
        await axios.put(`/api/User/${editUser.userId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('/api/User', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      fetchUsers();
      handleCancel();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoadingForm(false);
    }
  };

  if (loading) return <Typography sx={{ mt: 3 }}>Loading users...</Typography>;
  if (error) return <Typography color="error" sx={{ mt: 3 }}>{error}</Typography>;

  // Check if user can manage users (Admin only)
  if (!canManageUsers) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Access Denied
        </Alert>
        <Typography>You do not have permission to view this page. Only administrators can manage users.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#1976d2', textAlign: 'left' }}>
        User Management
      </Typography>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleFormSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            <TextField
              label="Username"
              name="userName"
              value={form.userName}
              onChange={handleFormChange}
              required
              size="small"
              sx={{ minWidth: 120, maxWidth: 200 }}
              autoComplete="off"
            />
            <TextField
              label="Email"
              name="email"
              value={form.email}
              onChange={handleFormChange}
              required
              size="small"
              sx={{ minWidth: 120, maxWidth: 200 }}
              autoComplete="off"
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleFormChange}
              size="small"
              sx={{ minWidth: 120, maxWidth: 200 }}
              autoComplete="new-password"
              required
            />
            <TextField
              select
              label="Role"
              name="roleId"
              value={form.roleId}
              onChange={handleFormChange}
              required
              size="small"
              sx={{ minWidth: 120, maxWidth: 200 }}
            >
              <MenuItem value="">Select Role</MenuItem>
              {roles.map(role => (
                <MenuItem key={role.roleId} value={role.roleId}>{role.roleName}</MenuItem>
              ))}
            </TextField>
            <Button
              type="submit"
              variant="contained"
              color="success"
              size="medium"
              disabled={loadingForm}
              sx={{ minWidth: 120, maxWidth: 200 }}
            >
              {loadingForm ? 'Saving...' : isEdit ? 'Update' : 'Add User'}
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                size="medium"
                onClick={handleCancel}
                sx={{ minWidth: 120, maxWidth: 200 }}
              >
                Cancel
              </Button>
            )}
          </Box>
          {error && <div style={{ color: '#d32f2f', marginTop: '0.7rem', fontWeight: 500 }}>{error}</div>}
        </form>
      </Paper>
      <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.userId}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roles.find(r => r.roleId === user.roleId)?.roleName || '-'}</TableCell>
                <TableCell>
                  <Button variant="outlined" color="primary" size="small" sx={{ mr: 1 }} onClick={() => handleEdit(user)}>Edit</Button>
                  <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(user.userId)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default UserList;
