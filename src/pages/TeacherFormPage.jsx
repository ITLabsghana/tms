import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTeacherById, addTeacher, updateTeacher, getSchools } from '../services/teacherService';
import {
  Box, Button, TextField, Typography, Paper, Grid, CircularProgress, Alert,
  MenuItem, FormControl, InputLabel, Select, Autocomplete
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3' // Using v3 adapter
import { parseISO, format } from 'date-fns';


const genderOptions = ['Male', 'Female', 'Other'];
// TODO: Potentially fetch teacher unions from a dedicated table or a predefined list
const teacherUnionOptions = ['GNAT', 'NAGRAT', 'CCT-GH', 'Other'];


const TeacherFormPage = () => {
  const { id: teacherId } = useParams(); // For editing
  const navigate = useNavigate();
  const { user } = useAuth(); // To set created_by_user_id or last_modified_by_user_id

  const isEditMode = Boolean(teacherId);
  const [teacher, setTeacher] = useState({
    staff_id: '',
    first_name: '',
    surname: '',
    other_names: '',
    date_of_birth: null,
    age: '', // Added age to state
    gender: '',
    registered_no: '',
    ghana_card_no: '',
    ssnit_no: '',
    tin: '',
    phone_no: '',
    email: '',
    home_town: '',
    address: '',
    academic_qualification: '',
    professional_qualification: '',
    rank: '',
    job_title: '',
    leadership_position: '',
    area_of_specialization: '',
    last_promotion_date: null,
    previous_school_id: null,
    current_school_id: null,
    date_posted_to_current_school: null,
    licensure_no: '',
    first_appointment_date: null,
    date_confirmed: null,
    teacher_union: '',
    // photo_url: '', // Handle photo upload separately
    name_of_bank: '',
    bank_branch: '',
    account_number: '',
    salary_scale: '',
  });

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const schoolsData = await getSchools();
        setSchools(schoolsData || []);

        if (isEditMode) {
          const existingTeacher = await getTeacherById(teacherId);
          if (existingTeacher) {
            // Convert date strings from DB to Date objects for DatePicker
            const formattedTeacher = { ...existingTeacher };
            ['date_of_birth', 'last_promotion_date', 'date_posted_to_current_school', 'first_appointment_date', 'date_confirmed'].forEach(field => {
              if (formattedTeacher[field]) {
                formattedTeacher[field] = parseISO(formattedTeacher[field]);
              } else {
                formattedTeacher[field] = null;
              }
            });
            setTeacher(formattedTeacher);
          } else {
            setFormError('Teacher not found.');
          }
        }
      } catch (err) {
        setFormError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [teacherId, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTeacher(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setTeacher(prev => ({ ...prev, [name]: date }));
  };

  // useEffect for age calculation
  useEffect(() => {
    if (teacher.date_of_birth) {
      try {
        const birthDate = new Date(teacher.date_of_birth);
        if (isNaN(birthDate.getTime())) {
          setTeacher(prev => ({ ...prev, age: '' })); // Invalid date
          return;
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        setTeacher(prev => ({ ...prev, age: age >= 0 ? age.toString() : '' }));
      } catch (error) {
        console.error("Error calculating age:", error);
        setTeacher(prev => ({ ...prev, age: '' })); // Reset age on error
      }
    } else {
      setTeacher(prev => ({ ...prev, age: '' })); // Reset age if date_of_birth is cleared
    }
  }, [teacher.date_of_birth]);

  const handleSchoolChange = (name, newValue) => {
    setTeacher(prev => ({ ...prev, [name]: newValue ? newValue.school_id : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    setFormSuccess('');

    // Prepare data for submission (e.g., format dates back to string if necessary for DB)
    const submissionData = { ...teacher };
    ['date_of_birth', 'last_promotion_date', 'date_posted_to_current_school', 'first_appointment_date', 'date_confirmed'].forEach(field => {
        if (submissionData[field] instanceof Date && !isNaN(submissionData[field])) {
            submissionData[field] = format(submissionData[field], 'yyyy-MM-dd');
        } else {
            submissionData[field] = null; // Ensure invalid or null dates are sent as null
        }
    });

    // Remove school name properties if they exist from previous fetches to avoid sending them
    delete submissionData.current_school_name;
    delete submissionData.previous_school_name;
    delete submissionData.current_school; // remove the object join
    delete submissionData.previous_school; // remove the object join


    try {
      if (isEditMode) {
        submissionData.last_modified_by_user_id = user?.id;
        submissionData.updated_at = new Date().toISOString();
        await updateTeacher(teacherId, submissionData);
        setFormSuccess('Teacher updated successfully!');
      } else {
        submissionData.created_by_user_id = user?.id;
        await addTeacher(submissionData);
        setFormSuccess('Teacher added successfully! Redirecting to teachers list...');
        setTimeout(() => navigate('/teachers'), 2000); // Redirect after a short delay
      }
    } catch (err) {
      setFormError('Operation failed: ' + (err.message || 'Unknown error'));
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isEditMode && schools.length === 0) { // Initial load for add mode
    return <CircularProgress />;
  }
  if (isEditMode && loading && !teacher.staff_id) { // Initial load for edit mode
      return <CircularProgress />;
  }


  const personalInfoFields = [
    { name: 'staff_id', label: 'Staff ID', required: true },
    { name: 'first_name', label: 'First Name', required: true },
    { name: 'surname', label: 'Surname', required: true },
    { name: 'other_names', label: 'Other Names' },
    { name: 'date_of_birth', label: 'Date Of Birth', type: 'date' },
    { name: 'age', label: 'Age', readOnly: true }, // Added Age field
    { name: 'gender', label: 'Gender', type: 'select', options: genderOptions },
    { name: 'registered_no', label: 'Registered No.' },
    { name: 'ghana_card_no', label: 'Ghana Card No.' },
    { name: 'ssnit_no', label: 'SSNIT No.' },
    { name: 'tin', label: 'TIN' },
    { name: 'phone_no', label: 'Phone No.' },
    { name: 'email', label: 'E-Mail', type: 'email' },
    { name: 'home_town', label: 'Home Town' },
    { name: 'address', label: 'Address', multiline: true, rows: 2 },
  ];

  const professionalInfoFields = [
    { name: 'academic_qualification', label: 'Academic Qualification' },
    { name: 'professional_qualification', label: 'Professional Qualification' },
    { name: 'rank', label: 'Rank' },
    { name: 'job_title', label: 'Job Title' },
    { name: 'leadership_position', label: 'Leadership Position' },
    { name: 'area_of_specialization', label: 'Area Of Specialization' },
    { name: 'last_promotion_date', label: 'Last Promotion Date', type: 'date' },
    { name: 'previous_school_id', label: 'Previous School', type: 'school_autocomplete' },
    { name: 'current_school_id', label: 'Current School', type: 'school_autocomplete' },
    { name: 'date_posted_to_current_school', label: 'Date Posted To Current School', type: 'date' },
    { name: 'licensure_no', label: 'Licensure No.' },
    { name: 'first_appointment_date', label: 'First Appointment Date', type: 'date' },
    { name: 'date_confirmed', label: 'Date Confirmed', type: 'date' },
    { name: 'teacher_union', label: 'Teacher Union', type: 'select', options: teacherUnionOptions },
  ];

  const bankInfoFields = [
    { name: 'name_of_bank', label: 'Name Of Bank' },
    { name: 'bank_branch', label: 'Branch' },
    { name: 'account_number', label: 'Account Number' },
    { name: 'salary_scale', label: 'Salary Scale' },
  ];

  const renderField = (field) => {
    if (field.type === 'date') {
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label={field.label}
            value={teacher[field.name] ? new Date(teacher[field.name]) : null}
            onChange={(date) => handleDateChange(field.name, date)}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" required={field.required} />
            )}
            inputFormat="yyyy-MM-dd" // Display format
            mask="____-__-__"
          />
        </LocalizationProvider>
      );
    }
    if (field.type === 'select') {
      return (
        <FormControl fullWidth margin="normal" required={field.required}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            name={field.name}
            value={teacher[field.name] || ''}
            label={field.label}
            onChange={handleChange}
          >
            {field.options.map(option => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    if (field.type === 'school_autocomplete') {
        const schoolValue = schools.find(s => s.school_id === teacher[field.name]) || null;
        return (
          <Autocomplete
            options={schools}
            getOptionLabel={(option) => option.name || ''}
            value={schoolValue}
            onChange={(event, newValue) => handleSchoolChange(field.name, newValue)}
            isOptionEqualToValue={(option, value) => option.school_id === value.school_id}
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                fullWidth
                margin="normal"
                required={field.required}
              />
            )}
          />
        );
      }
    return (
      <TextField
        name={field.name}
        label={field.label}
        value={teacher[field.name] || ''}
        onChange={handleChange}
        fullWidth
        margin="normal"
        required={field.required}
        type={field.type || 'text'}
        multiline={field.multiline}
        rows={field.rows}
        InputProps={{
            readOnly: field.readOnly,
          }}
      />
    );
  };

  const renderSection = (title, fields) => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Grid container spacing={2}>
        {fields.map(field => (
          <Grid item xs={12} sm={field.multiline ? 12 : 6} key={field.name}>
            {renderField(field)}
          </Grid>
        ))}
      </Grid>
    </Paper>
  );

  return (
    <Box sx={{ p: 3, maxWidth: '900px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom component="h1">
        {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
      </Typography>

      {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
      {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}

      <Box component="form" onSubmit={handleSubmit}>
        {renderSection("Personal Information", personalInfoFields)}
        {/* TODO: Photo Identification Section - requires file upload component */}
        {renderSection("Professional & School Information", professionalInfoFields)}
        {renderSection("Bank and Salary Information", bankInfoFields)}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/teachers')}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Save Changes' : 'Add Teacher')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TeacherFormPage;
