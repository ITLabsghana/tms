import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { leaveStatuses } from '../services/leaveService'; // Import leaveStatuses

const ReportsPage = () => {
  const theme = useTheme();
  const [teachersPerSchool, setTeachersPerSchool] = useState([]);
  const [teachersByQualification, setTeachersByQualification] = useState([]);
  const [teachersOnLeaveByType, setTeachersOnLeaveByType] = useState([]);

  const [loadingTps, setLoadingTps] = useState(true);
  const [loadingTbq, setLoadingTbq] = useState(true);
  const [loadingTol, setLoadingTol] = useState(true); // Loading for Teachers On Leave

  const [errorTps, setErrorTps] = useState('');
  const [errorTbq, setErrorTbq] = useState('');
  const [errorTol, setErrorTol] = useState('');

  const [leaveStatusFilter, setLeaveStatusFilter] = useState('Approved'); // Default filter for leave report

  useEffect(() => {
    const fetchTeachersPerSchoolReport = async () => {
      setLoadingTps(true);
      setErrorTps('');
      try {
        const { data, error: rpcError } = await supabase.rpc('get_teachers_per_school_report');
        if (rpcError) throw rpcError;
        setTeachersPerSchool(data || []);
      } catch (err) {
        console.error("Error fetching teachers per school report:", err);
        setErrorTps('Failed to load "Teachers per School" report. ' + err.message);
      } finally {
        setLoadingTps(false);
      }
    };

    const fetchTeachersByQualificationReport = async () => {
      setLoadingTbq(true);
      setErrorTbq('');
      try {
        const { data, error: rpcError } = await supabase.rpc('get_teachers_by_qualification_report');
        if (rpcError) throw rpcError;
        setTeachersByQualification(data || []);
      } catch (err) {
        console.error("Error fetching teachers by qualification report:", err);
        setErrorTbq('Failed to load "Teachers by Qualification" report. ' + err.message);
      } finally {
        setLoadingTbq(false);
      }
    };

    fetchTeachersPerSchoolReport();
    fetchTeachersByQualificationReport();
  }, []);

  // Fetch Teachers on Leave report separately as it depends on leaveStatusFilter
  useEffect(() => {
    const fetchTeachersOnLeaveReport = async () => {
      setLoadingTol(true);
      setErrorTol('');
      try {
        const { data, error: rpcError } = await supabase.rpc('get_teachers_on_leave_by_type_report', {
          leave_status_filter: leaveStatusFilter
        });
        if (rpcError) throw rpcError;
        setTeachersOnLeaveByType(data || []);
      } catch (err) {
        console.error("Error fetching teachers on leave report:", err);
        setErrorTol(`Failed to load "Teachers on Leave (${leaveStatusFilter})" report. ` + err.message);
      } finally {
        setLoadingTol(false);
      }
    };
    fetchTeachersOnLeaveReport();
  }, [leaveStatusFilter]);


  const PIE_CHART_COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#FFBB28', '#FF8042', '#00C49F', '#FFC0CB', '#8A2BE2', '#A52A2A', '#DEB887'
  ];


  const renderTeachersPerSchool = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Teachers per School</Typography>
      {loadingTps && <CircularProgress size={24} sx={{my:1}} />}
      {!loadingTps && errorTps && <Alert severity="error">{errorTps}</Alert>}
      {!loadingTps && !errorTps && teachersPerSchool.length === 0 && <Typography>No data available.</Typography>}
      {!loadingTps && !errorTps && teachersPerSchool.length > 0 && (
        <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={7}>
                <ResponsiveContainer width="100%" height={Math.max(300, teachersPerSchool.length * 35)}>
                <BarChart data={teachersPerSchool} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="school_name" type="category" width={120} interval={0} style={{fontSize: '0.9rem'}}/>
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="teacher_count" name="Number of Teachers" fill={theme.palette.primary.main} />
                </BarChart>
                </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={5}>
                <TableContainer sx={{maxHeight: Math.max(300, teachersPerSchool.length * 35) + 50}}>
                <Table size="small" stickyHeader>
                    <TableHead>
                    <TableRow>
                        <TableCell sx={{fontWeight: 'bold'}}>School Name</TableCell>
                        <TableCell align="right" sx={{fontWeight: 'bold'}}>Teachers</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {teachersPerSchool.map((row) => (
                        <TableRow key={row.school_name}>
                        <TableCell>{row.school_name}</TableCell>
                        <TableCell align="right">{row.teacher_count}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </TableContainer>
            </Grid>
        </Grid>
      )}
    </Paper>
  );

  const renderTeachersByQualification = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Teachers by Academic Qualification</Typography>
      {loadingTbq && <CircularProgress size={24} sx={{my:1}} />}
      {!loadingTbq && errorTbq && <Alert severity="error">{errorTbq}</Alert>}
      {!loadingTbq && !errorTbq && teachersByQualification.length === 0 && <Typography>No data available.</Typography>}
      {!loadingTbq && !errorTbq && teachersByQualification.length > 0 && (
         <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
                <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={teachersByQualification}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, teacher_count }) => `${name}: ${teacher_count} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="teacher_count"
                        nameKey="qualification"
                    >
                    {teachersByQualification.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} teachers`, name]}/>
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={5}>
                <TableContainer sx={{maxHeight: 400}}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold'}}>Qualification</TableCell>
                            <TableCell align="right" sx={{fontWeight: 'bold'}}>Teachers</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {teachersByQualification.map((row) => (
                            <TableRow key={row.qualification}>
                            <TableCell>{row.qualification}</TableCell>
                            <TableCell align="right">{row.teacher_count}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
      )}
    </Paper>
  );

  const renderTeachersOnLeaveByType = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb:1}}>
            <Typography variant="h6" gutterBottom>
                Teachers Currently on Leave (by Type)
            </Typography>
            <FormControl size="small" sx={{minWidth: 150}}>
                <InputLabel>Leave Status</InputLabel>
                <Select
                    value={leaveStatusFilter}
                    label="Leave Status"
                    onChange={(e) => setLeaveStatusFilter(e.target.value)}
                >
                    {leaveStatuses.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                     <MenuItem value=""><em>Any Status (Currently Active)</em></MenuItem> {/* May need RPC adjustment for 'any' */}
                </Select>
            </FormControl>
        </Box>
      {loadingTol && <CircularProgress size={24} sx={{my:1}} />}
      {!loadingTol && errorTol && <Alert severity="error">{errorTol}</Alert>}
      {!loadingTol && !errorTol && teachersOnLeaveByType.length === 0 && <Typography>No teachers currently on {leaveStatusFilter.toLowerCase()} leave.</Typography>}
      {!loadingTol && !errorTol && teachersOnLeaveByType.length > 0 && (
         <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
                <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={teachersOnLeaveByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, active_leave_count }) => `${name}: ${active_leave_count} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="active_leave_count"
                        nameKey="leave_type_name"
                    >
                    {teachersOnLeaveByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} teachers`, name]}/>
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </Grid>
            <Grid item xs={12} md={5}>
                <TableContainer sx={{maxHeight: 400}}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold'}}>Leave Type</TableCell>
                            <TableCell align="right" sx={{fontWeight: 'bold'}}>Teachers on Leave</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {teachersOnLeaveByType.map((row) => (
                            <TableRow key={row.leave_type_name}>
                            <TableCell>{row.leave_type_name}</TableCell>
                            <TableCell align="right">{row.active_leave_count}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        </Grid>
      )}
    </Paper>
  );


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom component="h1">
        Reports
      </Typography>

      {renderTeachersPerSchool()}
      {renderTeachersByQualification()}
      {renderTeachersOnLeaveByType()}

    </Box>
  );
};

export default ReportsPage;
