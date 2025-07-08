import React from 'react';
import LoginForm from '../components/Auth/LoginForm';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

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
        {/* You can add a logo here if you have one */}
        {/* <img src="/path-to-your-logo.png" alt="Logo" style={{ marginBottom: '20px', width: '100px' }} /> */}
        <LoginForm />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account?{' '}
          <Link component={RouterLink} to="/signup">
            Sign Up
          </Link>
        </Typography>
        {/* Optional: Link to password reset page */}
        {/*
        <Typography variant="body2" sx={{ mt: 1 }}>
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
