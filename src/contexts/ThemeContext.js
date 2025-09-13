import React from 'react';

// Create theme context
export const ThemeContext = React.createContext();

// Theme component that provides theme switching
export function ThemeProviderWrapper({ children }) {
  const [darkMode, setDarkMode] = React.useState(() => {
    // Get theme preference from localStorage or default to light
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}