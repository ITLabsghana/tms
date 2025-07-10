import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  Box, Button, Typography, Paper, Grid, CircularProgress, Alert, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { format, parseISO } from 'date-fns'; // For formatting created_at

const UserManagementPage = () => {
  const { user: currentUser, profile: currentUserProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'teacher',
    district: '',
  });
  const [addUserLoading, setAddUserLoading] = useState(false);

  const roles = ['admin', 'supervisor', 'teacher'];

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Call the RPC function to get all users with their profile info
      const { data, error: rpcError } = await supabase.rpc('get_all_application_users');

      if (rpcError) {
        // If the error is specifically about the function not existing, guide the user.
        if (rpcError.code === '42883') { // "42883": undefined_function
             throw new Error("RPC function 'get_all_application_users' not found. Please ensure it's created in your Supabase SQL Editor.");
        }
        throw rpcError;
      }
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Failed to load users. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserProfile?.role === 'admin') {
      fetchUsers();
    } else if (currentUserProfile) { // Profile loaded but not admin
      setError("You are not authorized to view this page.");
      setLoading(false);
    }
    // If currentUserProfile is null (still loading), the loading state from useAuth handles it higher up.
  }, [currentUserProfile]);

  const handleAddUserDialogOpen = () => {
    setNewUser({ email: '', password: '', fullName: '', role: 'teacher', district: '' });
    setSuccess('');
    setError(''); // Clear previous dialog errors
    setOpenAddUserDialog(true);
  };

  const handleAddUserDialogClose = () => {
    setOpenAddUserDialog(false);
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.fullName || !newUser.role) {
      setError("Please fill in all required fields: Email, Password, Full Name, and Role.");
      return;
    }
    setAddUserLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data, error: edgeError } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUser.email,
          password: newUser.password,
          fullName: newUser.fullName,
          role: newUser.role,
          district: newUser.district || null,
        }
      });

      if (edgeError) { // Network error or function invocation error
        if (edgeError.message.includes('Function not found')) {
            throw new Error("Edge Function 'create-user' not found. Please ensure it's deployed correctly.");
        }
        throw edgeError;
      }
      if (data && data.error) { // Error from within the Edge Function's logic
        throw new Error(data.error);
      }

      setSuccess(`User ${newUser.email} created successfully!`);
      fetchUsers();
      handleAddUserDialogClose();
    } catch (err) {
      console.error("Error adding new user:", err);
      setError('Failed to add user: ' + err.message); // Display error in the dialog
    } finally {
      setAddUserLoading(false);
    }
  };

  if (!currentUserProfile && !loading) { // Auth context done loading, but no profile (shouldn't happen if logged in)
      return <Alert severity="warning" sx={{m:3}}>User profile not available. Please re-login.</Alert>;
  }

  if (currentUserProfile?.role !== 'admin' && !loading) { // Auth context done, profile loaded, not admin
    return <Alert severity="error" sx={{m:3}}>Access Denied: You do not have permission to manage users.</Alert>;
  }

  // Show main loading spinner if users haven't been fetched yet and current user is admin
  if (loading && currentUserProfile?.role === 'admin' && users.length === 0) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUserDialogOpen}
          disabled={currentUserProfile?.role !== 'admin'} // Disable if not admin
        >
          Add New User
        </Button>
      </Box>

      {/* Display general page errors/success here, not dialog-specific ones */}
      {error && !openAddUserDialog && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && !openAddUserDialog && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{fontWeight: 'bold'}}>Full Name</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Email</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Role</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>District</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Created At</TableCell>
                <TableCell sx={{fontWeight: 'bold'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((userRow) => (
                <TableRow hover key={userRow.user_id}>
                  <TableCell>{userRow.full_name || 'N/A'}</TableCell>
                  <TableCell>{userRow.email}</TableCell>
                  <TableCell sx={{textTransform: 'capitalize'}}>{userRow.role}</TableCell>
                  <TableCell>{userRow.district_name || 'N/A'}</TableCell>
                  <TableCell>{userRow.created_at ? format(parseISO(userRow.created_at), 'MMM d, yyyy') : 'N/A'}</TableCell>
                  <TableCell>
                    <Button size="small" disabled>Edit</Button>
                    <Button size="small" color="error" disabled>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !loading && (
                <TableRow><TableCell colSpan={6} align="center">No users found.</TableCell></TableRow>
              )}
               {loading && (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openAddUserDialog} onClose={handleAddUserDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{mb:1}}>
            Enter the details for the new user. An initial password will be set.
          </DialogContentText>
          {/* Dialog-specific error is now shown here */}
          {error && openAddUserDialog && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            name="fullName"
            label="Full Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.fullName}
            onChange={handleNewUserChange}
            required
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={handleNewUserChange}
            required
          />
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newUser.password}
            onChange={handleNewUserChange}
            required
            helperText="Min 8 characters."
          />
          <FormControl fullWidth margin="dense" required>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={newUser.role}
              label="Role"
              onChange={handleNewUserChange}
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role} sx={{textTransform: 'capitalize'}}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="district"
            label="District (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={newUser.district}
            onChange={handleNewUserChange}
          />
        </DialogContent>
        <DialogActions sx={{p: '16px 24px'}}>
          <Button onClick={handleAddUserDialogClose} disabled={addUserLoading}>Cancel</Button>
          <Button onClick={handleAddNewUser} variant="contained" disabled={addUserLoading}>
            {addUserLoading ? <CircularProgress size={24} /> : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
