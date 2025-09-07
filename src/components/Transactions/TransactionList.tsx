import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TransactionForm from './TransactionForm';
import { Paper, Table, TableHead, TableRow, TableCell, TableBody, Box, Typography, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

interface Transaction {
  transactionId: number;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  categoryId?: number;
  categoryName?: string;
}

interface Category {
  categoryId: number;
  name: string;
  type: string;
}

const TransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get<Transaction[]>('/api/Transaction', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTransactions(response.data);
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#1976d2', textAlign: 'left' }}>
        Expense Tracker
      </Typography>
      <TransactionForm
        transaction={editTransaction || undefined}
        onSuccess={() => {
          setEditTransaction(null);
          fetchTransactions();
        }}
      />
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Expense Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map(tx => (
              <TableRow key={tx.transactionId}>
                <TableCell>{tx.description}</TableCell>
                <TableCell>${Number(tx.amount).toFixed(2)}</TableCell>
                <TableCell>{categories.find(cat => cat.categoryId === tx.categoryId)?.name || '-'}</TableCell>
                <TableCell>{tx.date}</TableCell>
                <TableCell>
                  <Button variant="outlined" color="primary" size="small" sx={{ mr: 1 }} onClick={() => setEditTransaction(tx)}>Edit</Button>
                  <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(tx.transactionId)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#388e3c' }}>Total: ${total.toFixed(2)}</Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={filterCategory}
            label="Filter by Category"
            onChange={e => setFilterCategory(e.target.value)}
          >
            <MenuItem value="All">All</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat.categoryId} value={cat.categoryId}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default TransactionList;
