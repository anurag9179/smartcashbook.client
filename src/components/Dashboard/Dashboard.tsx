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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
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
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

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

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
};

const getDateRange = (type: 'daily' | 'weekly' | 'monthly') => {
  const today = new Date();
  if (type === 'daily') {
    const start = formatDate(today);
    const end = formatDate(today);
    return { startDate: start, endDate: end };
  }
  if (type === 'weekly') {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    return { startDate: formatDate(weekStart), endDate: formatDate(weekEnd) };
  }
  // monthly
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { startDate: formatDate(monthStart), endDate: formatDate(monthEnd) };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [trendChartData, setTrendChartData] = useState<{ label: string; income: number; expenses: number }[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch transactions and categories in parallel
      const [transactionsResponse, categoriesResponse] = await Promise.all([
        axios.get('/api/Transaction/all-records', {
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
  }, [fetchDashboardData]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const { startDate, endDate } = getDateRange(reportType);
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('/api/Transaction/all-records', {
          params: { startDate, endDate },
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data as Transaction[];
        setReportData(Array.isArray(data) ? data : []);
      } catch (err) {
        setReportData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportType]);

  useEffect(() => {
    setChartData(groupTransactions(transactions, reportType));
    setTrendChartData(groupIncomeExpenses(transactions, reportType));
  }, [transactions, reportType]);

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

  const handleAddTransaction = () => {
    navigate('/transactions');
  };

  const handleViewReports = () => {
    navigate('/transactions');
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.get('/api/Transaction/all-records', {
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

  const totalAmount = reportData.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const getExpenseSum = (start: Date, end: Date) =>
    transactions
      .filter(tx =>
        tx.type === 'Debit' &&
        new Date(tx.date) >= start &&
        new Date(tx.date) <= end
      )
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const todayExpense = getExpenseSum(
    new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  );

  const yesterdayExpense = getExpenseSum(
    new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
    new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
  );

  const last7DaysExpense = getExpenseSum(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6),
    today
  );

  const last30DaysExpense = getExpenseSum(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    today
  );

  const currentYearExpense = getExpenseSum(
    new Date(today.getFullYear(), 0, 1),
    today
  );

  const totalExpense = transactions
    .filter(tx => tx.type === 'Debit')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

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

      {/* Report Type Selection - Already Present */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Report Type</InputLabel>
          <Select
            value={reportType}
            onChange={e => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Add this block to show the report summary */}
      {/* <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
        </Typography>
        <Typography>
          Total Transactions: {reportData.length}
        </Typography>
        <Typography>
          Total Amount: ₹{reportData.reduce((sum, tx) => sum + Number(tx.amount), 0).toLocaleString('en-IN')}
        </Typography>
      </Paper> */}

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
                        {formatDate(new Date(transaction.date))}
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

      {/* New Expense Summary Section */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
        gap: 2,
        mb: 3
      }}>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="subtitle2">Today's Expense</Typography>
          <Typography variant="h5" color="primary">{todayExpense}</Typography>
        </Card>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="subtitle2">Yesterday's Expense</Typography>
          <Typography variant="h5" color="orange">{yesterdayExpense}</Typography>
        </Card>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="subtitle2">Last 7 Days Expense</Typography>
          <Typography variant="h5" color="teal">{last7DaysExpense}</Typography>
        </Card>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="subtitle2">Last 30 Days Expense</Typography>
          <Typography variant="h5" color="red">{last30DaysExpense}</Typography>
        </Card>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="subtitle2">Current Year Expenses</Typography>
          <Typography variant="h5" color="red">{currentYearExpense}</Typography>
        </Card>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <Typography variant="subtitle2">Total Expenses</Typography>
          <Typography variant="h5" color="red">{totalExpense}</Typography>
        </Card>
      </Box>

      {/* YourChartComponent - New Addition */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📈 Transaction Trends
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="income" fill="#4caf50" />
              <Bar dataKey="expenses" fill="#f44336" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;

function groupTransactions(
  transactions: Transaction[],
  reportType: 'daily' | 'weekly' | 'monthly'
): { label: string; value: number }[] {
  const groups: { [key: string]: number } = {};

  transactions.forEach((tx) => {
    let key = '';
    if (reportType === 'daily') {
      key = dayjs(tx.date).format('YYYY-MM-DD');
    } else if (reportType === 'weekly') {
      const week = dayjs(tx.date).week();
      const year = dayjs(tx.date).year();
      key = `Week ${week}, ${year}`;
    } else if (reportType === 'monthly') {
      key = dayjs(tx.date).format('MMM YYYY');
    }
    if (!groups[key]) groups[key] = 0;
    groups[key] += Number(tx.amount);
  });

  return Object.entries(groups).map(([label, value]) => ({ label, value }));
}

function groupIncomeExpenses(
  transactions: Transaction[],
  reportType: 'daily' | 'weekly' | 'monthly'
): { label: string; income: number; expenses: number }[] {
  const groups: { [key: string]: { income: number; expenses: number } } = {};

  transactions.forEach((tx) => {
    let key = '';
    if (reportType === 'daily') {
      key = dayjs(tx.date).format('YYYY-MM-DD');
    } else if (reportType === 'weekly') {
      const week = dayjs(tx.date).week();
      const year = dayjs(tx.date).year();
      key = `Week ${week}, ${year}`;
    } else if (reportType === 'monthly') {
      key = dayjs(tx.date).format('MMM YYYY');
    }
    if (!groups[key]) groups[key] = { income: 0, expenses: 0 };
    if (tx.type === 'Credit') {
      groups[key].income += Number(tx.amount);
    } else if (tx.type === 'Debit') {
      groups[key].expenses += Number(tx.amount);
    }
  });

  // Sort by label (date order)
  return Object.entries(groups)
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
