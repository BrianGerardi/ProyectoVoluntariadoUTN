import { createTheme } from '@mui/material/styles';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/500.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#b90014', // From DESIGN.md primary
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#49607c', // From DESIGN.md secondary
      contrastText: '#ffffff',
    },
    error: {
      main: '#ba1a1a',
    },
    background: {
      default: '#f7f9ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#001d32',
      secondary: '#5d3f3c',
    },
  },
  typography: {
    fontFamily: '"Public Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '32px',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '24px',
      fontWeight: 700,
      lineHeight: 1.33,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '18px',
      lineHeight: 1.55,
    },
    body2: {
      fontSize: '16px',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 4, // 0.25rem as per DESIGN.md
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Cards and primary buttons use 8px as per "Soft" shapes
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 4px rgba(16, 42, 67, 0.08)', // Level 1 Shadow
        },
      },
    },
  },
});
