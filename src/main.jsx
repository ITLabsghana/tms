import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css'; // You can create this file for global styles
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// A basic theme can be defined here. You can customize it extensively.
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example primary color (Material-UI blue)
    },
    secondary: {
      main: '#dc004e', // Example secondary color (Material-UI pink)
    },
    background: {
      default: '#f4f6f8', // A light grey background
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
        fontWeight: 500,
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Buttons with normal casing
        },
      },
    },
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS and apply background color from theme */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
