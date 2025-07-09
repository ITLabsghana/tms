import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        setError('');
        try {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, district_name')
            .eq('user_id', user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 'exactPostgrestError' - row not found
            throw profileError;
          }

          if (data) {
            setProfile(data);
            setFullName(data.full_name || '');
            setDistrictName(data.district_name || '');
          } else {
            // Profile might not exist yet if not created on signup
            setFullName(''); // Or from user.user_metadata.full_name if available
            setDistrictName('');
          }
        } catch (err) {
          setError('Failed to load profile: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updates = {
        user_id: user.id, // Ensure user_id is part of the update for upsert
        full_name: fullName,
        district_name: districtName,
        updated_at: new Date(),
      };

      // Using upsert to handle cases where profile might not exist yet
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'user_id' });

      if (updateError) {
        throw updateError;
      }
      setSuccess('Profile updated successfully!');
      // Optionally re-fetch profile or update state if needed
      setProfile(updates);

    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) { // Show loading only on initial load
    return <Typography>Loading profile...</Typography>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, margin: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom component="h1">
          User Profile
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleUpdateProfile} sx={{ mt: 2 }}>
          <TextField
            label="Email Address"
            type="email"
            value={user?.email || ''}
            disabled
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Full Name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="District Name"
            type="text"
            value={districtName}
            onChange={(e) => setDistrictName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
