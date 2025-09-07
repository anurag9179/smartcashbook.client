import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, TextField, Select, MenuItem, Button, Paper, InputLabel, FormControl } from '@mui/material';

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
    } else {
      setDescription('');
      setAmount('');
      setDate('');
      setType('Debit');
      setCategoryId('');
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        description,
        amount,
        date,
        type,
        categoryId: categoryId === '' ? undefined : categoryId,
      };
      if (transaction) {
        await axios.put(`/api/Transaction/${transaction.transactionId}`, { ...payload, transactionId: transaction.transactionId }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post('/api/Transaction', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      onSuccess();
      setDescription('');
      setAmount('');
      setDate('');
      setType('Debit');
      setCategoryId('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
          <TextField
            label="Expense Name"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            size="small"
            sx={{ minWidth: 120, maxWidth: 200 }}
          />
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            required
            size="small"
            sx={{ minWidth: 120, maxWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120, maxWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={e => setCategoryId(Number(e.target.value))}
              required
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
          />
          <FormControl size="small" sx={{ minWidth: 120, maxWidth: 200 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={e => setType(e.target.value as 'Credit' | 'Debit')}
              required
            >
              <MenuItem value="Debit">Debit</MenuItem>
              <MenuItem value="Credit">Credit</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            color="success"
            size="medium"
            disabled={loading}
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
