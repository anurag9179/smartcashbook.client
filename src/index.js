import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProviderWrapper, ThemeContext } from './contexts/ThemeContext';

// Theme component that provides theme switching
function AppThemeProvider({ children }) {
  const { darkMode } = React.useContext(ThemeContext);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          background: {
            default: darkMode ? '#121212' : '#ffffff',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#202124',
                borderBottom: darkMode ? '1px solid #333' : '1px solid #dadce0',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                color: darkMode ? '#ffffff' : '#202124',
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                backgroundColor: 'transparent !important',
                '& .MuiTableRow-root': {
                  backgroundColor: 'transparent !important',
                },
                '& tr': {
                  backgroundColor: 'transparent !important',
                },
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                '&.MuiTableRow-head': {
                  backgroundColor: 'transparent !important',
                  '&:hover': {
                    backgroundColor: 'transparent !important',
                  },
                },
              },
            },
          },
        },
      }),
    [darkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProviderWrapper>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </ThemeProviderWrapper>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
