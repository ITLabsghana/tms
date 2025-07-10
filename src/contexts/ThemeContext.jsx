import React, { createContext, useState, useMemo, useContext } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('light'); // Default mode is light

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      // Add or remove the dark-mode class from the body
      if (newMode === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      return newMode;
    });
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                // Light mode palette
                primary: {
                  main: '#1976d2', // Example primary color for light mode
                },
                background: {
                  default: '#ffffff', // Light background
                  paper: '#f5f5f5',   // Light paper background
                },
                text: {
                  primary: '#000000', // Black text for light mode
                },
              }
            : {
                // Dark mode palette
                primary: {
                  main: '#90caf9', // Example primary color for dark mode
                },
                background: {
                  default: '#121212', // Dark background
                  paper: '#1e1e1e',   // Dark paper background
                },
                text: {
                  primary: '#ffffff', // White text for dark mode
                },
              }),
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Ensures consistent baseline styling and applies background color */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
