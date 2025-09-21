import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TransactionForm from './TransactionForm';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Alert, TextField } from '@mui/material';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { userPermissions } from '../../utils/jwtUtils';


interface Transaction {
  transactionId: number;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  categoryId?: number;
  categoryName?: string;
  filePath?: string;
}

interface Category {
  categoryId: number;
  name: string;
  type: string;
}

// Add this interface at the top of your file:
interface ApiResponse {
  items: Transaction[];
  totalCount: number;
  totalPages: number;
}

const TransactionList: React.FC = () => {
  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'other' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewName, setPreviewName] = useState<string>('');

  // Get theme context
  const { darkMode } = React.useContext(ThemeContext);
  
  // Get auth context
  const { user } = useAuth();
  
  // Check user permissions
  const canWriteTransactions = userPermissions.canWrite(user?.role);
  const canDeleteTransactions = userPermissions.canDelete(user?.role);
  const isObserver = userPermissions.isObserver(user?.role);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // File preview handler
  const handlePreview = async (transactionId: number, filePath?: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`/api/Transaction/download/${transactionId}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = response.data as Blob;
      const ext = filePath?.split('.').pop()?.toLowerCase();
      let type: 'image' | 'pdf' | 'other' = 'other';
      if (ext && ['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) type = 'image';
      else if (ext === 'pdf') type = 'pdf';
      setPreviewType(type);
      setPreviewName(filePath || 'Preview');
      setPreviewUrl(window.URL.createObjectURL(blob));
      setPreviewOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to preview file');
    }
  };
  // Download file with JWT
  const handleDownload = async (transactionId: number, fileName?: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`/api/Transaction/download/${transactionId}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `file_${transactionId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download file');
    }
  };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filters, setFilters] = useState({
    categoryId: '',
    startDate: '',
    endDate: '',
    paymentMode: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async () => {
    const params = new URLSearchParams();
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.paymentMode) params.append('paymentMode', filters.paymentMode);
    params.append('page', currentPage.toString());
    params.append('pageSize', '20');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/Transaction', { params, headers: { Authorization: `Bearer ${token}` } });
      const data = response.data as ApiResponse | Transaction[];
      if (Array.isArray(data)) {
        setTransactions(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setTransactions(data.items || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Category[]>('/api/Category', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data);
    } catch (err) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const handleDelete = async (transactionId: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/Transaction/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  const filteredTransactions = filterCategory === 'All'
    ? transactions
    : transactions.filter(tx => tx.categoryId === Number(filterCategory));

  const total = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div className="error">{error}</div>;

  const handleClearFilters = () => {
  setFilters({
    categoryId: '',
    startDate: '',
    endDate: '',
    paymentMode: ''
  });
  setCurrentPage(1);
  fetchTransactions();
};

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: 'primary.main', textAlign: 'left' }}>
        Expense Tracker
      </Typography>

      {/* Alerts for permissions */}
      {isObserver && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access. You can view transactions but cannot create, edit, or delete them.
        </Alert>
      )}
      {!canWriteTransactions && !isObserver && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to create or modify transactions.
        </Alert>
      )}

      {/* Filter controls - visually grouped and aligned */}
      <Box sx={{
  mb: 3,
  p: 2,
  backgroundColor: 'background.paper',
  borderRadius: 2,
  boxShadow: 1,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
  alignItems: 'center'
}}>
  <FormControl size="small" fullWidth sx={{ minWidth: 150, maxWidth: 200 }}>
    <InputLabel>Category</InputLabel>
    <Select
      value={filters.categoryId}
      onChange={e => setFilters(f => ({ ...f, categoryId: e.target.value }))}
      label="Category"
    >
      <MenuItem value="">All</MenuItem>
      {categories.map(cat => (
        <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>
      ))}
    </Select>
  </FormControl>
  <TextField
    label="Start Date"
    type="date"
    value={filters.startDate}
    onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
    InputLabelProps={{ shrink: true }}
    size="small"
    fullWidth
    sx={{ minWidth: 150, maxWidth: 200 }}
  />
  <TextField
    label="End Date"
    type="date"
    value={filters.endDate}
    onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
    InputLabelProps={{ shrink: true }}
    size="small"
    fullWidth
    sx={{ minWidth: 150, maxWidth: 200 }}
  />
  <FormControl size="small" fullWidth sx={{ minWidth: 150, maxWidth: 200 }}>
    <InputLabel>Payment Mode</InputLabel>
    <Select
      value={filters.paymentMode}
      onChange={e => setFilters(f => ({ ...f, paymentMode: e.target.value }))}
      label="Payment Mode"
    >
      <MenuItem value="">All</MenuItem>
      <MenuItem value="Cash">Cash</MenuItem>
      <MenuItem value="Card">Card</MenuItem>
      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
      <MenuItem value="UPI">UPI</MenuItem>
      <MenuItem value="Cheque">Cheque</MenuItem>
      <MenuItem value="Other">Other</MenuItem>
    </Select>
  </FormControl>
  <Button
    variant="outlined"
    onClick={handleClearFilters}
    sx={{ minWidth: 120, height: 40 }}
  >
    Clear Filters
  </Button>
  <Button
    variant="contained"
    onClick={() => fetchTransactions()}
    sx={{ minWidth: 120, height: 40 }}
  >
    Apply Filters
  </Button>
</Box>

      {/* Transaction form - for adding/editing transactions */}
      {canWriteTransactions && (
        <Box sx={{ mb: 2 }}>
          <TransactionForm
            transaction={editTransaction || undefined}
            onSuccess={() => {
              setEditTransaction(null);
              fetchTransactions();
            }}
          />
        </Box>
      )}

      {/* Summary and table */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="textSecondary">
          Showing {transactions.length} of {totalCount} transactions (Page {currentPage} of {totalPages})
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'success.main' }}>
          Total: {formatCurrency(total)}
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Expense Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Download</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Preview</TableCell>
              {/* Only show Actions column if user can perform actions */}
              {(canWriteTransactions || canDeleteTransactions) && (
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Action</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map(tx => (
              <TableRow key={tx.transactionId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                <TableCell sx={{ color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>{tx.description}</TableCell>
                <TableCell sx={{ color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>{formatCurrency(tx.amount)}</TableCell>
                <TableCell sx={{ color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>{categories.find(cat => cat.categoryId === tx.categoryId)?.name || '-'}</TableCell>
                <TableCell sx={{ color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>{tx.date}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                  {tx.filePath ? (
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="small"
                      onClick={() => handleDownload(tx.transactionId, tx.filePath?.split('_').slice(1).join('_'))}
                    >
                      Download
                    </Button>
                  ) : (
                    <span style={{ color: 'text.secondary' }}>No file</span>
                  )}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                  {tx.filePath ? (
                    <Button
                      variant="outlined"
                      color="info"
                      size="small"
                      onClick={() => handlePreview(tx.transactionId, tx.filePath?.split('_').slice(1).join('_'))}
                    >
                      Preview
                    </Button>
                  ) : (
                    <span style={{ color: '#aaa' }}>No file</span>
                  )}
                </TableCell>
                {/* Only show action buttons if user has permissions */}
                {(canWriteTransactions || canDeleteTransactions) && (
                  <TableCell sx={{ borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                    {canWriteTransactions && (
                      <Button variant="outlined" color="primary" size="small" sx={{ mr: 1 }} onClick={() => setEditTransaction(tx)}>Edit</Button>
                    )}
                    {canDeleteTransactions && (
                      <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(tx.transactionId)}>Delete</Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ...rest of code (pagination, preview modal, etc.)... */}
    </Box>
  );
};

export default TransactionList;
