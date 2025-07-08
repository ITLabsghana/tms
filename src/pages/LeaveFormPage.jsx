import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLeaveRecordById, addLeaveRecord, updateLeaveRecord, leaveTypes, leaveStatuses } from '../services/leaveService';
import { getTeachers } from '../services/teacherService'; // To select a teacher
import {
  Box, Button, TextField, Typography, Paper, Grid, CircularProgress, Alert,
  MenuItem, FormControl, InputLabel, Select, Autocomplete
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { parseISO, format } from 'date-fns';

const LeaveFormPage = () => {
  const { id: leaveId } = useParams(); // For editing
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEditMode = Boolean(leaveId);
  const [leaveRecord, setLeaveRecord] = useState({
    teacher_id: null,
    leave_type: '',
    start_date: null,
    end_date: null,
    reason: '',
    status: 'Pending', // Default status
  });

  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch teachers for the dropdown/autocomplete
        const teachersData = await getTeachers();
        setAllTeachers(teachersData.map(t => ({ ...t, full_name: `${t.first_name} ${t.surname} (${t.staff_id})` })) || []);

        if (isEditMode) {
          const existingRecord = await getLeaveRecordById(leaveId);
          if (existingRecord) {
            const formattedRecord = { ...existingRecord };
            // Convert date strings from DB to Date objects for DatePicker
            if (formattedRecord.start_date) formattedRecord.start_date = parseISO(formattedRecord.start_date);
            if (formattedRecord.end_date) formattedRecord.end_date = parseISO(formattedRecord.end_date);
            setLeaveRecord(formattedRecord);
          } else {
            setFormError('Leave record not found.');
          }
        }
      } catch (err) {
        setFormError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [leaveId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveRecord(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setLeaveRecord(prev => ({ ...prev, [name]: date }));
  };

  const handleTeacherChange = (event, newValue) => {
    setLeaveRecord(prev => ({ ...prev, teacher_id: newValue ? newValue.teacher_id : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setFormSuccess('');

    if (!leaveRecord.teacher_id) {
        setFormError('Please select a teacher.');
        setLoading(false);
        return;
    }
     if (!leaveRecord.start_date || !leaveRecord.end_date) {
        setFormError('Please select start and end dates.');
        setLoading(false);
        return;
    }
    if (leaveRecord.end_date < leaveRecord.start_date) {
        setFormError('End date cannot be before start date.');
        setLoading(false);
        return;
    }


    const submissionData = {
      ...leaveRecord,
      created_by_user_id: user?.id, // Assuming this field exists or is handled by DB
    };

    // Remove teacher object if it was part of leaveRecord from fetching
    delete submissionData.teachers;
    delete submissionData.teacher_name;


    try {
      if (isEditMode) {
        await updateLeaveRecord(leaveId, submissionData);
        setFormSuccess('Leave record updated successfully!');
      } else {
        await addLeaveRecord(submissionData);
        setFormSuccess('Leave record added successfully! Redirecting to leave list...');
        setTimeout(() => navigate('/leave'), 2000);
      }
    } catch (err) {
      setFormError('Operation failed: ' + (err.message || 'Unknown error'));
      console.error("Submit error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditMode && allTeachers.length === 0) {
    return <CircularProgress />;
  }
   if (isEditMode && loading && !leaveRecord.teacher_id) {
      return <CircularProgress />;
  }


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: '700px', margin: 'auto' }}>
        <Typography variant="h4" gutterBottom component="h1">
          {isEditMode ? 'Edit Leave Record' : 'Add New Leave Record'}
        </Typography>

        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

        <Paper elevation={2} sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  options={allTeachers}
                  getOptionLabel={(option) => option.full_name || ''}
                  value={allTeachers.find(t => t.teacher_id === leaveRecord.teacher_id) || null}
                  onChange={handleTeacherChange}
                  isOptionEqualToValue={(option, value) => option.teacher_id === value.teacher_id}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Teacher" required fullWidth />
                  )}
                  disabled={isEditMode} // Usually teacher is not changed when editing a leave record
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    name="leave_type"
                    value={leaveRecord.leave_type}
                    label="Leave Type"
                    onChange={handleChange}
                  >
                    {leaveTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={leaveRecord.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    {leaveStatuses.map(status => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={leaveRecord.start_date}
                  onChange={(date) => handleDateChange('start_date', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={leaveRecord.end_date}
                  onChange={(date) => handleDateChange('end_date', date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  minDate={leaveRecord.start_date || undefined}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="reason"
                  label="Reason for Leave"
                  value={leaveRecord.reason}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" color="secondary" onClick={() => navigate('/leave')}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Add Record')}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default LeaveFormPage;
