import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Add,
  Visibility,
  GetApp
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

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

interface DashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  monthlyData: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  categoryBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch transactions and categories in parallel
      const [transactionsResponse, categoriesResponse] = await Promise.all([
        axios.get('/api/Transaction', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/Category', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const transactionsData = transactionsResponse.data as Transaction[];
      const categoriesData = categoriesResponse.data as Category[];

      // Create a category lookup map for joining
      const categoryMap = new Map<number, string>();
      categoriesData.forEach(category => {
        categoryMap.set(category.categoryId, category.name);
      });

      // Join transactions with category names
      const transactionsWithCategories = transactionsData.map(transaction => ({
        ...transaction,
        categoryName: transaction.categoryId ? categoryMap.get(transaction.categoryId) : undefined
      }));

      setTransactions(transactionsWithCategories);

      // Calculate dashboard metrics
      const calculatedMetrics = calculateMetrics(transactionsWithCategories, categoriesData);
      setMetrics(calculatedMetrics);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const calculateMetrics = (transactions: Transaction[], categories: Category[]): DashboardMetrics => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate totals
    const totalIncome = transactions
      .filter(t => t.type === 'Credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'Debit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Monthly data for the last 6 months
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() &&
               transactionDate.getFullYear() === date.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'Credit')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'Debit')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({ month: monthName, income, expenses });
    }

    // Category breakdown for expenses
    const categoryTotals: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'Debit')
      .forEach(t => {
        const categoryName = t.categoryName || 'Uncategorized';
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + t.amount;
      });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      monthlyData,
      categoryBreakdown
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleAddTransaction = () => {
    navigate('/transactions');
  };

  const handleViewReports = () => {
    // For now, navigate to transactions page - can be enhanced later with dedicated reports
    navigate('/transactions');
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.get('/api/Transaction', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create a CSV-like export
      const csvContent = "data:text/csv;charset=utf-8," +
        "Date,Description,Amount,Type,Category\n" +
        transactions.map(t =>
          `${t.date},"${t.description}",${t.amount},${t.type},"${t.categoryName || ''}"`
        ).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading your financial dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 0.5, sm: 1, md: 1.5 } }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          mb: 1.5,
          fontWeight: 'bold',
          color: 'primary.main',
          fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' }
        }}
      >
        📊 Financial Dashboard
      </Typography>

      {/* Key Metrics Cards - Fully Responsive */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',           // Mobile: 1 column
          sm: '1fr 1fr',       // Tablet: 2 columns
          md: 'repeat(4, 1fr)' // Desktop: 4 columns
        },
        gap: { xs: 0.5, sm: 1, md: 1.5 },
        mb: { xs: 1, sm: 1.5, md: 2 }
      }}>
        <Card sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: { xs: 60, sm: 70, md: 80 }
        }}>
          <CardContent sx={{
            py: { xs: 0.5, sm: 1, md: 1.5 },
            px: { xs: 1, sm: 1.5, md: 1.5 },
            '&:last-child': { pb: { xs: 0.5, sm: 1, md: 1.5 } }
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                    mb: 0.25
                  }}
                >
                  Total Income
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' }
                  }}
                >
                  {formatCurrency(metrics?.totalIncome || 0)}
                </Typography>
              </Box>
              <TrendingUp sx={{
                fontSize: { xs: 18, sm: 20, md: 24 },
                opacity: 0.8
              }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          minHeight: { xs: 60, sm: 70, md: 80 }
        }}>
          <CardContent sx={{
            py: { xs: 0.5, sm: 1, md: 1.5 },
            px: { xs: 1, sm: 1.5, md: 1.5 },
            '&:last-child': { pb: { xs: 0.5, sm: 1, md: 1.5 } }
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                    mb: 0.25
                  }}
                >
                  Total Expenses
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' }
                  }}
                >
                  {formatCurrency(metrics?.totalExpenses || 0)}
                </Typography>
              </Box>
              <TrendingDown sx={{
                fontSize: { xs: 18, sm: 20, md: 24 },
                opacity: 0.8
              }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{
          background: metrics?.netIncome && metrics.netIncome >= 0
            ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            : 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
          color: 'white',
          minHeight: { xs: 60, sm: 70, md: 80 }
        }}>
          <CardContent sx={{
            py: { xs: 0.5, sm: 1, md: 1.5 },
            px: { xs: 1, sm: 1.5, md: 1.5 },
            '&:last-child': { pb: { xs: 0.5, sm: 1, md: 1.5 } }
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                    mb: 0.25
                  }}
                >
                  Net Income
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' }
                  }}
                >
                  {formatCurrency(metrics?.netIncome || 0)}
                </Typography>
              </Box>
              <AccountBalance sx={{
                fontSize: { xs: 18, sm: 20, md: 24 },
                opacity: 0.8
              }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          color: '#333',
          minHeight: { xs: 60, sm: 70, md: 80 }
        }}>
          <CardContent sx={{
            py: { xs: 0.5, sm: 1, md: 1.5 },
            px: { xs: 1, sm: 1.5, md: 1.5 },
            '&:last-child': { pb: { xs: 0.5, sm: 1, md: 1.5 } }
          }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.8rem' },
                    mb: 0.25
                  }}
                >
                  Transactions
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' }
                  }}
                >
                  {metrics?.transactionCount || 0}
                </Typography>
              </Box>
              <Receipt sx={{
                fontSize: { xs: 18, sm: 20, md: 24 },
                opacity: 0.8
              }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Charts Section - Responsive */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        gap: { xs: 1, sm: 1.5, md: 2 },
        mb: { xs: 1.5, sm: 2, md: 2.5 }
      }}>
        {/* Income vs Expenses Trend */}
        <Card>
          <CardContent sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 1.5 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                mb: 1
              }}
            >
              💰 Income vs Expenses Trend
            </Typography>
            <Box sx={{
              height: { xs: 150, sm: 180, md: 200 },
              width: '100%'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    fontSize={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={(value) => `₹${value/1000}k`}
                    fontSize={10}
                    width={50}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ color: '#333' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stackId="1"
                    stroke="#4caf50"
                    fill="#4caf50"
                    fillOpacity={0.6}
                    name="Income"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#f44336"
                    fill="#f44336"
                    fillOpacity={0.6}
                    name="Expenses"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Expense Categories Breakdown */}
        <Card>
          <CardContent sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 1.5 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                mb: 1
              }}
            >
              🥧 Expense Breakdown
            </Typography>
            <Box sx={{
              height: { xs: 150, sm: 180, md: 200 },
              width: '100%'
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={window.innerWidth < 600 ? 45 : window.innerWidth < 960 ? 55 : 60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics?.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Recent Transactions and Quick Actions - Responsive */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: { xs: 1, sm: 1.5, md: 2 }
      }}>
        {/* Recent Transactions */}
        <Card>
          <CardContent sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 1.5 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 0.5, sm: 1 } }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                }}
              >
                📋 Recent Transactions
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/transactions')}
                sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, py: 0.25, px: 1 }}
              >
                View All
              </Button>
            </Box>
            <Box sx={{
              maxHeight: { xs: 180, sm: 220, md: 250 },
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: '2px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#c1c1c1',
                borderRadius: '2px',
                '&:hover': {
                  backgroundColor: '#a8a8a8',
                },
              },
            }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      py: { xs: 0.25, sm: 0.5 },
                      px: { xs: 0.25, sm: 0.5 }
                    }}>
                      Date
                    </TableCell>
                    <TableCell sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      py: { xs: 0.25, sm: 0.5 },
                      px: { xs: 0.25, sm: 0.5 },
                      display: { xs: 'none', sm: 'table-cell' }
                    }}>
                      Description
                    </TableCell>
                    <TableCell sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      py: { xs: 0.25, sm: 0.5 },
                      px: { xs: 0.25, sm: 0.5 }
                    }}>
                      Category
                    </TableCell>
                    <TableCell sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      py: { xs: 0.25, sm: 0.5 },
                      px: { xs: 0.25, sm: 0.5 }
                    }}>
                      Type
                    </TableCell>
                    <TableCell sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '0.6rem', sm: '0.7rem' },
                      py: { xs: 0.25, sm: 0.5 },
                      px: { xs: 0.25, sm: 0.5 }
                    }} align="right">
                      Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTransactions.slice(0, window.innerWidth < 600 ? 2 : 4).map((transaction) => (
                    <TableRow key={transaction.transactionId} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        py: { xs: 0.25, sm: 0.5 },
                        px: { xs: 0.25, sm: 0.5 }
                      }}>
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell sx={{
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        py: { xs: 0.25, sm: 0.5 },
                        px: { xs: 0.25, sm: 0.5 },
                        maxWidth: { xs: 60, sm: 100 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: { xs: 'none', sm: 'table-cell' }
                      }}>
                        {transaction.description}
                      </TableCell>
                      <TableCell sx={{
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        py: { xs: 0.25, sm: 0.5 },
                        px: { xs: 0.25, sm: 0.5 }
                      }}>
                        <Chip
                          label={transaction.categoryName || 'Uncategorized'}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            height: { xs: 14, sm: 16 },
                            '& .MuiChip-label': {
                              px: { xs: 0.25, sm: 0.5 }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        py: { xs: 0.25, sm: 0.5 },
                        px: { xs: 0.25, sm: 0.5 }
                      }}>
                        <Chip
                          label={transaction.type}
                          size="small"
                          color={transaction.type === 'Credit' ? 'success' : 'error'}
                          variant="filled"
                          sx={{
                            fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            height: { xs: 14, sm: 16 },
                            '& .MuiChip-label': {
                              px: { xs: 0.25, sm: 0.5 }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{
                        fontWeight: 'bold',
                        color: transaction.type === 'Credit' ? 'green' : 'red',
                        fontSize: { xs: '0.6rem', sm: '0.7rem' },
                        py: { xs: 0.25, sm: 0.5 },
                        px: { xs: 0.25, sm: 0.5 }
                      }}>
                        {transaction.type === 'Credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent sx={{ py: { xs: 1, sm: 1.5 }, px: { xs: 1, sm: 1.5 } }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                mb: 1
              }}
            >
              ⚡ Quick Actions
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: { xs: 0.5, sm: 1 },
              mb: 1
            }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                fullWidth
                sx={{
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  minHeight: { xs: 32, sm: 36 }
                }}
                onClick={handleAddTransaction}
              >
                Add Transaction
              </Button>
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                fullWidth
                sx={{
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  minHeight: { xs: 32, sm: 36 }
                }}
                onClick={handleViewReports}
              >
                View Reports
              </Button>
              <Button
                variant="outlined"
                startIcon={<GetApp />}
                fullWidth
                sx={{
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  minHeight: { xs: 32, sm: 36 }
                }}
                onClick={handleExportData}
              >
                Export Data
              </Button>
              <Button
                variant="outlined"
                startIcon={<Receipt />}
                fullWidth
                sx={{
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  minHeight: { xs: 32, sm: 36 }
                }}
                onClick={() => navigate('/transactions')}
              >
                All Transactions
              </Button>
            </Box>

            <Box sx={{
              p: { xs: 1, sm: 1.5 },
              bgcolor: '#f8f9fa',
              borderRadius: 1
            }}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  mb: 0.5
                }}
              >
                💡 Financial Health Score
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 'bold',
                    fontSize: { xs: '1rem', sm: '1.2rem', md: '1.5rem' }
                  }}
                >
                  {metrics ? Math.min(100, Math.max(0, Math.round((metrics.totalIncome / (metrics.totalExpenses + 1)) * 50))) : 0}%
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
                >
                  Based on income-to-expense ratio
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
