import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
// It's good practice to also call createProfileForNewUser from authService
// after successful signup to ensure the profiles table is populated.
import { createProfileForNewUser } from '../../services/authService';


const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState(''); // For the profiles table
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data: { user }, error: signUpError } = await signUp({
        email,
        password,
        options: {
          data: { full_name: fullName } // This goes to Supabase Auth user_metadata
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (user) {
        // After successful Supabase auth sign up, create a profile entry.
        // Consider what district_name to use, or make it editable later in a profile page.
        await createProfileForNewUser(user.id, fullName, '');
        // Or, if you have a trigger in Supabase to create the profile, this call might not be needed from client-side.
        // However, explicit call gives more control and immediate feedback/error handling.
      }

      // Potentially navigate to a "please confirm your email page" or directly to login/dashboard
      // depending on your Supabase email verification settings.
      navigate('/login');
      alert('Sign up successful! Please check your email to verify your account if email confirmation is enabled.');

    } catch (err) {
      setError(err.message || 'Failed to sign up. Please try again.');
    }
    setLoading(false);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        Create Account
      </Typography>
      {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
      <TextField
        label="Full Name"
        type="text"
        variant="outlined"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Email Address"
        type="email"
        variant="outlined"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        fullWidth
        helperText="Password should be at least 6 characters."
      />
      <TextField
        label="Confirm Password"
        type="password"
        variant="outlined"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        fullWidth
        sx={{ mt: 2 }}
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
      </Button>
    </Box>
  );
};

export default SignUpForm;
