import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, TextField, Select, MenuItem, Button, Paper, InputLabel, FormControl, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { userPermissions } from '../../utils/jwtUtils';

interface TransactionFormProps {
  transaction?: {
    transactionId: number;
    date: string;
    description: string;
    amount: number;
    type: 'Credit' | 'Debit';
    categoryId?: number;
  };
  onSuccess: () => void;
}

interface Category {
  categoryId: number;
  name: string;
  type: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ transaction, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<'Credit' | 'Debit'>('Debit');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string>('');

  // Get auth context and permissions
  const { user } = useAuth();
  const canWriteTransactions = userPermissions.canWrite(user?.role);
  const isObserver = userPermissions.isObserver(user?.role);

  useEffect(() => {
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
    fetchCategories();
  }, []);

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || '');
      setAmount(transaction.amount || '');
      setDate(transaction.date || '');
      setType(transaction.type || 'Debit');
      setCategoryId(transaction.categoryId || '');
      setFilePath((transaction as any).filePath || ''); // Add this line
    } else {
      setDescription('');
      setAmount('');
      setDate('');
      setType('Debit');
      setCategoryId('');
      setFilePath(''); // Add this line
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('description', description);
      formData.append('amount', String(amount));
      formData.append('date', date);
      formData.append('type', type);
      if (categoryId !== '') formData.append('categoryId', String(categoryId));
      // Get userId from JWT
      let userId = '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      }
      formData.append('userId', userId);

      if (transaction) {
        formData.append('transactionId', String(transaction.transactionId));
        if (file) {
          formData.append('file', file);
        } else if (filePath) {
          formData.append('filePath', filePath); // Preserve existing file
        }
        await axios.put(`/api/Transaction/${transaction.transactionId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        if (file) formData.append('file', file);
        await axios.post('/api/Transaction', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSuccess();
      setDescription('');
      setAmount('');
      setDate('');
      setType('Debit');
      setCategoryId('');
      setFile(null);
      setFilePath('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      {/* Show read-only message for Observer users */}
      {isObserver && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access. This form is disabled.
        </Alert>
      )}
      
      {/* Show permission warning for users who cannot write */}
      {!canWriteTransactions && !isObserver && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You do not have permission to create or modify transactions.
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <TextField
            label="Expense Name"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            size="small"
            sx={{ minWidth: 120, maxWidth: 200 }}
            disabled={!canWriteTransactions}
            InputProps={{
              readOnly: !canWriteTransactions,
            }}
          />
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            required
            size="small"
            sx={{ minWidth: 120, maxWidth: 200 }}
            disabled={!canWriteTransactions}
            InputProps={{
              readOnly: !canWriteTransactions,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120, maxWidth: 200 }} disabled={!canWriteTransactions}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={e => setCategoryId(Number(e.target.value))}
              required
              readOnly={!canWriteTransactions}
            >
              <MenuItem value="">Select Category</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 120, maxWidth: 200 }}
            disabled={!canWriteTransactions}
            InputProps={{
              readOnly: !canWriteTransactions,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120, maxWidth: 200 }} disabled={!canWriteTransactions}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={e => setType(e.target.value as 'Credit' | 'Debit')}
              required
              readOnly={!canWriteTransactions}
            >
              <MenuItem value="Debit">Debit</MenuItem>
              <MenuItem value="Credit">Credit</MenuItem>
            </Select>
          </FormControl>
          <Button
            component="label"
            variant="outlined"
            color="primary"
            size="medium"
            sx={{ minWidth: 120, maxWidth: 200 }}
            disabled={!canWriteTransactions}
          >
            {file ? file.name : 'Upload File'}
            <input
              type="file"
              hidden
              accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.xls,.xlsx"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  const allowedExts = ["jpg","jpeg","png","gif","bmp","webp","pdf","xls","xlsx"];
                  const fileObj = e.target.files[0];
                  const ext = fileObj.name.split('.').pop()?.toLowerCase();
                  if (ext && allowedExts.includes(ext)) {
                    setFile(fileObj);
                  } else {
                    setError('Invalid file type. Only images, PDF, and Excel files are allowed.');
                  }
                }
              }}
              disabled={!canWriteTransactions}
            />
          </Button>
          {filePath && !file && (
            <span style={{ color: '#666', fontSize: 12, marginLeft: 8 }}>
              Existing file: {filePath.split('\\').pop()}
            </span>
          )}
          <Button
            type="submit"
            variant="contained"
            color="success"
            size="medium"
            disabled={loading || !canWriteTransactions}
            sx={{ minWidth: 120, maxWidth: 200 }}
          >
            {loading ? 'Saving...' : transaction ? 'Update' : 'Add Expense'}
          </Button>
        </Box>
        {error && <div style={{ color: '#d32f2f', marginTop: '0.7rem', fontWeight: 500 }}>{error}</div>}
      </form>
    </Paper>
  );
};

export default TransactionForm;
