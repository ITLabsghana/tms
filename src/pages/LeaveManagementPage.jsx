import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaveRecords, deleteLeaveRecord, leaveStatuses } from '../services/leaveService';
import { getTeachers } from '../services/teacherService';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, CircularProgress, Alert,
  Grid, Autocomplete, TextField, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { format, parseISO } from 'date-fns';
// No need for debounce here as filters trigger direct fetches

const columns = [
  { id: 'teacher_name', label: 'Teacher Name (Staff ID)', minWidth: 200 },
  { id: 'leave_type', label: 'Leave Type', minWidth: 150 },
  { id: 'start_date', label: 'Start Date', minWidth: 120, format: (value) => format(parseISO(value), 'MMM d, yyyy') },
  { id: 'end_date', label: 'End Date', minWidth: 120, format: (value) => format(parseISO(value), 'MMM d, yyyy') },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'reason', label: 'Reason', minWidth: 200, ellipsis: true },
  { id: 'actions', label: 'Actions', minWidth: 120, align: 'center' },
];

const LeaveManagementPage = () => {
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true); // General loading for the page
  const [loadingTeachers, setLoadingTeachers] = useState(true); // Specific loading for teachers list
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const navigate = useNavigate();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Effect to fetch all teachers once for the filter dropdown
  useEffect(() => {
    const fetchInitialTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const teachersData = await getTeachers(); // Fetches all teachers
        setAllTeachers(teachersData.map(t => ({ ...t, full_name: `${t.first_name} ${t.surname} (${t.staff_id})` })) || []);
      } catch (err) {
        setError('Failed to load teachers list for filter: ' + err.message);
      } finally {
        setLoadingTeachers(false);
      }
    };
    fetchInitialTeachers();
  }, []); // Runs once on mount

  // useCallback for fetching leave data, depends on filters
  const fetchLeaveData = useCallback(async (teacherId, status) => {
    setLoading(true); // Loading for the leave records table
    setError('');
    try {
      const params = {};
      if (teacherId) params.teacherId = teacherId;
      if (status) params.status = status;

      const records = await getLeaveRecords(params);
      setLeaveRecords(records || []);
    } catch (err) {
      setError('Failed to fetch leave records: ' + err.message);
      setLeaveRecords([]); // Clear records on error
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed here if it's only called by other effects/handlers

  // Effect to fetch leave data when filters change
  useEffect(() => {
    // Pass the actual ID for teacherId, not the whole object
    fetchLeaveData(selectedTeacherFilter?.teacher_id, selectedStatusFilter);
  }, [fetchLeaveData, selectedTeacherFilter, selectedStatusFilter]);


  const handleTeacherFilterChange = (event, newValue) => {
    setSelectedTeacherFilter(newValue);
    setPage(0);
  };

  const handleStatusFilterChange = (event, newValue) => {
    setSelectedStatusFilter(newValue || '');
    setPage(0);
  };

  const clearFilters = () => {
    setSelectedTeacherFilter(null);
    setSelectedStatusFilter('');
    // The useEffect watching selectedTeacherFilter and selectedStatusFilter will trigger a re-fetch.
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleAddLeave = () => {
    navigate('/leave/add');
  };

  const handleEditLeave = (leaveId) => {
    navigate(`/leave/edit/${leaveId}`);
  };

  const handleClickOpenDeleteDialog = (record) => {
    setRecordToDelete(record);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setRecordToDelete(null);
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    // We can set a more specific loading state if needed, e.g. `setDeleting(true)`
    // For now, the general `setLoading(true)` in `fetchLeaveData` will cover it.
    try {
      await deleteLeaveRecord(recordToDelete.leave_id);
      // Re-fetch data with current filters after deletion
      fetchLeaveData(selectedTeacherFilter?.teacher_id, selectedStatusFilter);
      setSuccess('Leave record deleted successfully.'); // Assuming you add a success state
    } catch (err) {
      setError('Failed to delete leave record: ' + err.message);
    } finally {
      handleCloseDeleteDialog();
    }
  };
  // Placeholder for success state if you want to show success messages
  const [success, setSuccess] = useState('');


  // Initial loading state for the whole page before any data (teachers or leave records) is attempted
  if (loadingTeachers && allTeachers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Leave Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLeave}
        >
          Add Leave Record
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom><FilterListIcon sx={{verticalAlign: 'middle', mr: 1}}/>Filters</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <Autocomplete
              options={allTeachers}
              getOptionLabel={(option) => option.full_name || ''}
              value={selectedTeacherFilter}
              onChange={handleTeacherFilterChange}
              isOptionEqualToValue={(option, value) => option.teacher_id === value.teacher_id}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Teacher" variant="outlined" fullWidth />
              )}
              loading={loadingTeachers} // Use specific loading state for teacher list
              loadingText="Loading teachers..."
            />
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <Autocomplete
              options={leaveStatuses}
              getOptionLabel={(option) => option}
              value={selectedStatusFilter || null}
              onChange={handleStatusFilterChange}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Status" variant="outlined" fullWidth />
              )}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{display: 'flex', alignItems: 'center', justifyContent: {xs: 'flex-start', md:'flex-end'} }}>
            <Button
                onClick={clearFilters}
                variant="outlined"
                startIcon={<ClearIcon />}
            >
                Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}


      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && ( // General loading for leave records table
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress sx={{my: 2}} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && leaveRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No leave records found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
              {!loading && leaveRecords
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((record) => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={record.leave_id}>
                      {columns.map((column) => {
                        const value = record[column.id];
                        if (column.id === 'actions') {
                          return (
                            <TableCell key={column.id} align={column.align}>
                              <IconButton onClick={() => handleEditLeave(record.leave_id)} title="Edit" size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton onClick={() => handleClickOpenDeleteDialog(record)} title="Delete" size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          );
                        }
                        if (column.id === 'reason' && column.ellipsis) {
                            return (
                                <TableCell key={column.id} align={column.align}>
                                    <Tooltip title={value || 'N/A'} placement="top-start">
                                        <Typography noWrap sx={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                            {value || 'N/A'}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                            );
                        }
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format && value
                              ? column.format(value)
                              : (value || 'N/A')}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={leaveRecords.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this leave record for "{recordToDelete?.teacher_name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteRecord} color="error" autoFocus disabled={loading}>
            {/* Consider a specific deleteLoading state if general table loading is too broad during delete */}
            {loading && recordToDelete ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveManagementPage;
