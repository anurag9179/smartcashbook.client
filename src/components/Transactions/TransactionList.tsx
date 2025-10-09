import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TransactionForm from './TransactionForm';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Box, Typography, Button, Select, MenuItem, FormControl, InputLabel, Alert, TextField, Pagination } from '@mui/material';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { userPermissions } from '../../utils/jwtUtils';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const [pageSize, setPageSize] = useState(10); // Match backend default

  const fetchTransactions = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.paymentMode) params.append('paymentMode', filters.paymentMode);
    params.append('page', currentPage.toString());
    params.append('pageSize', pageSize.toString());
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/Transaction', { params, headers: { Authorization: `Bearer ${token}` } });
      const data = response.data as ApiResponse;
      setTransactions(data.items || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
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

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, pageSize]);

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

  const totalExpense = filteredTransactions
    .filter(tx => tx.type === 'Debit')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'Credit')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netTotal = totalIncome - totalExpense;

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
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Rows</InputLabel>
          <Select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            label="Rows"
          >
            {[5, 10, 20, 50].map(size => (
              <MenuItem key={size} value={size}>{size}</MenuItem>
            ))}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: 'success.main'
            }}
          >
            +{formatCurrency(totalIncome)}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: 'error.main'
            }}
          >
            -{formatCurrency(totalExpense)}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: netTotal < 0 ? 'error.main' : 'success.main',
              ml: 2
            }}
          >
            Total: {formatCurrency(netTotal)}
          </Typography>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ mb: 3, backgroundColor: 'background.paper' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Expense Name</TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}
              >
                Amount
              </TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>Date</TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}
              >
                File
              </TableCell>
              {(canWriteTransactions || canDeleteTransactions) && (
                <TableCell
                  align="center"
                  sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}
                >
                  Action
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map(tx => (
              <TableRow key={tx.transactionId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                <TableCell sx={{ color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>{tx.description}</TableCell>
                <TableCell
                  align="center"
                  sx={{
                    color: tx.type === 'Credit' ? 'success.main' : 'error.main',
                    fontWeight: 600,
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider'
                  }}
                >
                  {tx.type === 'Credit' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell sx={{ color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>{categories.find(cat => cat.categoryId === tx.categoryId)?.name || '-'}</TableCell>
                <TableCell sx={{ color: 'text.primary', borderBottom: '1px solid', borderBottomColor: 'divider' }}>{tx.date}</TableCell>
                <TableCell align="center" sx={{ borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                  {tx.filePath ? (
                    <>
                      <Tooltip title="Download">
                        <IconButton
                          color="secondary"
                          size="small"
                          onClick={() => handleDownload(tx.transactionId, tx.filePath?.split('_').slice(1).join('_'))}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Preview">
                        <IconButton
                          color="info"
                          size="small"
                          onClick={() => handlePreview(tx.transactionId, tx.filePath?.split('_').slice(1).join('_'))}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <span style={{ color: '#aaa' }}>No file</span>
                  )}
                </TableCell>
                {/* Only show action buttons if user has permissions */}
                {(canWriteTransactions || canDeleteTransactions) && (
                  <TableCell align="center" sx={{ borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                    {canWriteTransactions && (
                      <Tooltip title="Edit">
                        <IconButton color="primary" size="small" onClick={() => setEditTransaction(tx)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDeleteTransactions && (
                      <Tooltip title="Delete">
                        <IconButton color="error" size="small" onClick={() => handleDelete(tx.transactionId)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(e, value) => setCurrentPage(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setPreviewOpen(false)}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 2,
              minWidth: 320,
              maxWidth: '90vw',
              maxHeight: '90vh',
              boxShadow: 24,
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>{previewName}</Typography>
            <Button
              onClick={() => setPreviewOpen(false)}
              sx={{ position: 'absolute', top: 8, right: 8 }}
              color="error"
              variant="outlined"
              size="small"
            >
              Close
            </Button>
            {previewType === 'image' && (
              <img src={previewUrl} alt={previewName} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
            )}
            {previewType === 'pdf' && (
              <iframe
                src={previewUrl}
                title={previewName}
                width="100%"
                height="500px"
                style={{ border: 'none' }}
              />
            )}
            {previewType === 'other' && (
              <Typography>No preview available for this file type.</Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TransactionList;
