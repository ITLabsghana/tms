import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // For fetching users, and invoking edge function
import { useAuth } from '../contexts/AuthContext';
import {
  Box, Button, Typography, Paper, Grid, CircularProgress, Alert, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const UserManagementPage = () => {
  const { user: currentUser, profile: currentUserProfile } = useAuth(); // Assuming profile is loaded with role
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openAddUserDialog, setOpenAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'teacher', // Default role for new users
    district: '', // Optional: district for the new user
  });
  const [addUserLoading, setAddUserLoading] = useState(false);

  const roles = ['admin', 'supervisor', 'teacher'];

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // Note: Listing all auth.users might require admin privileges or a specific view/RPC
      // For now, let's try fetching profiles and join with auth info if possible,
      // or just list profiles assuming they represent users.
      // A better approach for a full user list is an RPC or Edge Function accessible by admins.
      // This is a simplified client-side fetch for profiles for now.
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          role,
          district_name,
          users:auth_users_table_via_user_id (email)
        `)
        // The above join syntax might need adjustment based on your actual foreign key setup if 'users' is not the actual table name for auth.users
        // Or, more simply, fetch profiles and then separately get auth.users if needed (less ideal)
        // A proper way would be:
        // const { data, error: fetchError } = await supabase.rpc('get_all_app_users');
        // where 'get_all_app_users' is an RPC that joins auth.users and profiles.
        // For now, let's assume a simplified fetch from profiles that has an email (if you added it) or just shows profile data.
        // A common pattern is to have an 'email' column in 'profiles' table too, populated by trigger or manually.
        // For this example, I'll simulate fetching profiles and manually adding email for display if available via Supabase Auth list users (which is admin only).
        // The most secure way for a list is an Edge Function.
        // Let's just fetch profiles for now and show what we have.
        .order('full_name', { ascending: true });


      if (fetchError) throw fetchError;
      // To get email, we'd ideally join or have it in profiles.
      // This is a placeholder as client-side directly listing auth.users is problematic.
      // An admin-only Edge function would be better for a full user list.
      // For now, we'll just use profile data.
       const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
       if (authUsersError && authUsersError.message !== "No admin permission") { // Ignore "No admin permission" if client-side, this call won't work here.
         // This listUsers call will FAIL on client-side without admin API key.
         // This is just to illustrate what an admin backend would do.
         // console.warn("Client-side listUsers failed as expected, use Edge Function for this.", authUsersError);
       }

      // Simple mapping for display if email is not directly in profiles:
      const combinedUsers = data.map(p => {
        const authUser = authUsers?.users?.find(u => u.id === p.user_id);
        return {
            ...p,
            email: authUser?.email || 'N/A (direct fetch needed)', // Indicate if email isn't in profile
        };
      });

      setUsers(combinedUsers || []);

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
    } else {
      setError("You are not authorized to view this page.");
      setLoading(false);
    }
  }, [currentUserProfile]);

  const handleAddUserDialogOpen = () => {
    setNewUser({ email: '', password: '', fullName: '', role: 'teacher', district: '' });
    setSuccess('');
    setError('');
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
          district: newUser.district || null, // Pass district or null
        }
      });

      if (edgeError) throw edgeError;
      if (data && data.error) throw new Error(data.error); // Error from within the Edge Function logic

      setSuccess(`User ${newUser.email} created successfully!`);
      fetchUsers(); // Refresh the list
      handleAddUserDialogClose();
    } catch (err) {
      console.error("Error adding new user:", err);
      setError('Failed to add user: ' + err.message);
    } finally {
      setAddUserLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
  }

  if (currentUserProfile?.role !== 'admin') {
    return <Alert severity="error" sx={{m:3}}>Access Denied: You do not have permission to manage users.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUserDialogOpen}
        >
          Add New User
        </Button>
      </Box>

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
                <TableCell sx={{fontWeight: 'bold'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((userRow) => (
                <TableRow hover key={userRow.user_id}>
                  <TableCell>{userRow.full_name}</TableCell>
                  <TableCell>{userRow.email}</TableCell>
                  <TableCell>{userRow.role}</TableCell>
                  <TableCell>{userRow.district_name || 'N/A'}</TableCell>
                  <TableCell>
                    {/* Placeholder for Edit/Delete actions */}
                    <Button size="small" disabled>Edit</Button>
                    <Button size="small" color="error" disabled>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} align="center">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* TODO: Add pagination if user list becomes long */}
      </Paper>

      {/* Add User Dialog */}
      <Dialog open={openAddUserDialog} onClose={handleAddUserDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{mb:1}}>
            Enter the details for the new user. An initial password will be set.
          </DialogContentText>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
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
            helperText="Min 8 characters. User should change this on first login if possible."
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
