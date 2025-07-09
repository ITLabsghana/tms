import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
// import { Link as RouterLink } from 'react-router-dom'; // No longer needed for Sign Up
// import Link from '@mui/material/Link'; // No longer needed for Sign Up
import Typography from '@mui/material/Typography'; // Still used for title potentially

const LoginPage = () => {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Optional: Add a logo here */}
        {/* <img src="/path-to-your-logo.png" alt="Logo" style={{ marginBottom: '20px', width: '100px' }} /> */}

        {/* The LoginForm component itself will have a "Login" title */}
        <LoginForm />

        {/* Removed "Don't have an account? Sign Up" link */}

        {/* Optional: Link to password reset page can still be here if desired */}
        {/*
        <Typography variant="body2" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/forgot-password">
            Forgot password?
          </Link>
        </Typography>
        */}
      </Box>
    </Container>
  );
};

export default LoginPage;
