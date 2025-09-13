import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProviderWrapper } from './contexts/ThemeContext';

// Theme component that provides theme switching
function AppThemeProvider({ children }) {
  const [darkMode, setDarkMode] = React.useState(() => {
    // Get theme preference from localStorage or default to light
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

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
        },
      }),
    [darkMode]
  );

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return (
    <ThemeProviderWrapper>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeProviderWrapper>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
