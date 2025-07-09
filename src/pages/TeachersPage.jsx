import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getTeachers, deleteTeacher, getSchools, getTeacherById, addTeacher } from '../services/teacherService'; // Import addTeacher
import { useAuth } from '../contexts/AuthContext'; // To get current user for created_by_user_id
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, CircularProgress, Alert,
  TextField, Grid, Autocomplete, List, ListItem, ListItemText, Collapse, Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { debounce } from 'lodash';
import * as XLSX from 'xlsx';
import { format, parseISO, isValid, parse } from 'date-fns';


const columns = [
  { id: 'staff_id', label: 'Staff ID', minWidth: 100 },
  { id: 'full_name', label: 'Full Name', minWidth: 170 },
  { id: 'email', label: 'Email', minWidth: 170 },
  { id: 'phone_no', label: 'Phone', minWidth: 120 },
  { id: 'rank', label: 'Rank', minWidth: 100 },
  { id: 'current_school_name', label: 'Current School', minWidth: 170 },
  { id: 'actions', label: 'Actions', minWidth: 170, align: 'center' },
];

const exportImportColumnsConfig = [
    { header: 'Staff ID*', dataKey: 'staff_id', required: true, unique: true }, // Mark for uniqueness check (server-side or pre-check)
    { header: 'First Name*', dataKey: 'first_name', required: true },
    { header: 'Surname*', dataKey: 'surname', required: true },
    { header: 'Other Names', dataKey: 'other_names' },
    { header: 'Date Of Birth (YYYY-MM-DD)', dataKey: 'date_of_birth', isDate: true },
    { header: 'Gender (Male/Female/Other)', dataKey: 'gender',
      validate: (val) => !val || ['Male', 'Female', 'Other'].includes(val) ? null : 'Invalid gender' },
    { header: 'Registered No.', dataKey: 'registered_no' },
    { header: 'Ghana Card No.', dataKey: 'ghana_card_no', unique: true },
    { header: 'SSNIT No.', dataKey: 'ssnit_no', unique: true },
    { header: 'TIN', dataKey: 'tin', unique: true },
    { header: 'Phone No.', dataKey: 'phone_no' },
    { header: 'E-Mail', dataKey: 'email', unique: true, isEmail: true },
    { header: 'Home Town', dataKey: 'home_town' },
    { header: 'Address', dataKey: 'address' },
    { header: 'Academic Qualification', dataKey: 'academic_qualification' },
    { header: 'Professional Qualification', dataKey: 'professional_qualification' },
    { header: 'Rank', dataKey: 'rank' },
    { header: 'Job Title', dataKey: 'job_title' },
    { header: 'Leadership Position', dataKey: 'leadership_position' },
    { header: 'Area Of Specialization', dataKey: 'area_of_specialization' },
    { header: 'Last Promotion Date (YYYY-MM-DD)', dataKey: 'last_promotion_date', isDate: true },
    // For import, we'd expect school names. We'll need to map them to IDs.
    // Or provide instruction to use School IDs directly if names are not unique.
    // For simplicity, let's assume names are unique enough for import or we handle first match.
    { header: 'Previous School Name', dataKey: 'previous_school_name_import' },
    { header: 'Current School Name*', dataKey: 'current_school_name_import', required: false }, // Not strictly required to add a teacher
    { header: 'Date Posted To Current School (YYYY-MM-DD)', dataKey: 'date_posted_to_current_school', isDate: true },
    { header: 'Licensure No.', dataKey: 'licensure_no' },
    { header: 'First Appointment Date (YYYY-MM-DD)', dataKey: 'first_appointment_date', isDate: true },
    { header: 'Date Confirmed (YYYY-MM-DD)', dataKey: 'date_confirmed', isDate: true },
    { header: 'Teacher Union', dataKey: 'teacher_union' },
    { header: 'Name Of Bank', dataKey: 'name_of_bank' },
    { header: 'Bank Branch', dataKey: 'bank_branch' },
    { header: 'Account Number', dataKey: 'account_number' },
    { header: 'Salary Scale', dataKey: 'salary_scale' },
];


const TeachersPage = () => {
  const { user } = useAuth(); // Get current user
  const [allTeachers, setAllTeachers] = useState([]);
  const [displayedTeachers, setDisplayedTeachers] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [importErrorsOpen, setImportErrorsOpen] = useState(false);


  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState(null);

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  const debouncedSearch = useCallback(
    debounce(async (currentSearchTerm, currentSchoolFilterId) => {
      fetchAndSetTeachers(currentSearchTerm, currentSchoolFilterId);
    }, 500),
    []
  );

  const fetchAndSetTeachers = async (currentSearchTerm = searchTerm, currentSchoolFilterId = selectedSchoolFilter?.school_id) => {
    setLoading(true);
    try {
      const params = {
        searchTerm: currentSearchTerm,
        schoolId: currentSchoolFilterId,
      };
      const data = await getTeachers(params);
      setAllTeachers(data);
      setDisplayedTeachers(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch teachers. ' + err.message);
      setAllTeachers([]);
      setDisplayedTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [teachersData, schoolsData] = await Promise.all([
                getTeachers({ searchTerm, schoolId: selectedSchoolFilter?.school_id }),
                getSchools() // Fetch all schools for mapping during import and for filter
            ]);
            setAllTeachers(teachersData);
            setDisplayedTeachers(teachersData);
            setSchoolsList(schoolsData || []);
            setError('');
        } catch (err) {
            setError('Failed to load initial data. ' + err.message);
            setAllTeachers([]);
            setDisplayedTeachers([]);
            setSchoolsList([]);
        } finally {
            setLoading(false);
        }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    debouncedSearch(searchTerm, selectedSchoolFilter?.school_id);
  }, [searchTerm, selectedSchoolFilter, debouncedSearch]);


  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSchoolFilterChange = (event, newValue) => {
    setSelectedSchoolFilter(newValue);
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSchoolFilter(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleAddTeacher = () => {
    navigate('/teachers/add');
  };

  const handleEditTeacher = (teacherId) => {
    navigate(`/teachers/edit/${teacherId}`);
  };

  const handleViewTeacher = (teacherId) => {
    navigate(`/teachers/view/${teacherId}`);
  };

  const handleClickOpenDeleteDialog = (teacher) => {
    setTeacherToDelete(teacher);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setTeacherToDelete(null);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    setLoading(true);
    try {
      await deleteTeacher(teacherToDelete.teacher_id);
      fetchAndSetTeachers(searchTerm, selectedSchoolFilter?.school_id);
      setError('');
    } catch (err) {
      setError('Failed to delete teacher. ' + err.message);
    } finally {
      handleCloseDeleteDialog();
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
        const teachersToExportDetails = [];
        // Fetch details for all teachers matching current filter, not just paginated ones
        const filteredTeacherList = await getTeachers({
            searchTerm: searchTerm,
            schoolId: selectedSchoolFilter?.school_id
        });

        for (const teacherSummary of filteredTeacherList) {
            const detailedTeacher = await getTeacherById(teacherSummary.teacher_id);
            if (detailedTeacher) {
                teachersToExportDetails.push(detailedTeacher);
            }
        }

        const dataForSheet = teachersToExportDetails.map(teacher => {
            const row = {};
            exportImportColumnsConfig.forEach(col => { // Use exportImportColumnsConfig
                let value = teacher[col.dataKey];
                 // Handle joined school names for export
                if (col.dataKey === 'previous_school_name_import') value = teacher.previous_school_name;
                if (col.dataKey === 'current_school_name_import') value = teacher.current_school_name;

                if (col.isDate && value) {
                    try {
                        value = format(parseISO(value), 'yyyy-MM-dd');
                    } catch (dateError) {
                        console.warn(`Could not format date ${value} for teacher ${teacher.staff_id}`, dateError);
                        value = teacher[col.dataKey];
                    }
                }
                row[col.header] = value !== null && value !== undefined ? String(value) : '';
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataForSheet, { header: exportImportColumnsConfig.map(col => col.header) });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Teachers");

        const fileName = `Teachers_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
        XLSX.writeFile(workbook, fileName);

    } catch (exportError) {
        console.error("Export failed:", exportError);
        setError("Failed to export data. " + exportError.message);
    } finally {
        setExporting(false);
    }
  };

  const handleImportFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        processImportFile(file);
    }
    // Reset file input to allow importing the same file again if needed
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const processImportFile = async (file) => {
    setImporting(true);
    setError('');
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true }); // cellDates true is important
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonOpts = { header: 1, defval: '', raw: false }; // raw:false attempts to format, defval for empty cells
            const jsonData = XLSX.utils.sheet_to_json(worksheet, jsonOpts);

            if (jsonData.length < 2) { // Header + at least one data row
                throw new Error("Sheet is empty or contains only headers.");
            }

            const headersFromFile = jsonData[0].map(h => String(h).trim());
            const expectedHeaders = exportImportColumnsConfig.map(c => c.header);

            // Basic header check - can be more sophisticated
            if (!expectedHeaders.every((eh, idx) => headersFromFile[idx] === eh)) {
                 console.warn("File headers:", headersFromFile);
                 console.warn("Expected headers:", expectedHeaders);
                 throw new Error("File headers do not match the expected template. Please download the template for correct format.");
            }

            const dataRows = jsonData.slice(1);
            let successfulImports = 0;
            let failedImports = 0;
            const importErrorsList = [];
            const recordsToInsert = [];

            // Map school names to IDs for efficiency
            const schoolNameMap = schoolsList.reduce((acc, school) => {
                acc[school.name.toLowerCase()] = school.school_id;
                return acc;
            }, {});

            for (let i = 0; i < dataRows.length; i++) {
                const rowArray = dataRows[i];
                const record = {};
                let rowIsValid = true;
                let currentError = `Row ${i + 2}: `; // Excel row number (1-header, 2-first data)

                exportImportColumnsConfig.forEach((colConfig, index) => {
                    let value = rowArray[index] !== undefined && rowArray[index] !== null ? String(rowArray[index]).trim() : '';

                    // Required field validation
                    if (colConfig.required && !value) {
                        currentError += `${colConfig.header} is required. `;
                        rowIsValid = false;
                    }

                    // Date validation and formatting
                    if (colConfig.isDate && value) {
                        // Try to parse common date formats or excel date numbers
                        let parsedDate;
                        if (/^\d{5}$/.test(value)) { // Excel date serial number (approx)
                            parsedDate = XLSX.SSF.parse_date_code(Number(value)); // This returns an object
                             if (parsedDate) {
                                value = format(new Date(parsedDate.y, parsedDate.m-1, parsedDate.d), 'yyyy-MM-dd');
                            } else {
                                currentError += `Invalid Excel date format for ${colConfig.header}. `;
                                rowIsValid = false;
                            }
                        } else if (isValid(parseISO(value))) { // ISO YYYY-MM-DD
                            value = format(parseISO(value), 'yyyy-MM-dd');
                        } else if (isValid(parse(value, 'MM/dd/yyyy', new Date()))) { // common US format
                             value = format(parse(value, 'MM/dd/yyyy', new Date()), 'yyyy-MM-dd');
                        } else if (isValid(parse(value, 'dd/MM/yyyy', new Date()))) { // common EU format
                             value = format(parse(value, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd');
                        }
                         else if (value instanceof Date && isValid(value)) { // If XLSX parsed it as Date object
                            value = format(value, 'yyyy-MM-dd');
                        } else {
                            currentError += `Invalid date format for ${colConfig.header} ('${rowArray[index]}'). Use YYYY-MM-DD. `;
                            rowIsValid = false;
                        }
                    }

                    // Custom validator from config
                    if (colConfig.validate) {
                        const validationMsg = colConfig.validate(value);
                        if (validationMsg) {
                            currentError += validationMsg + " ";
                            rowIsValid = false;
                        }
                    }
                     // Email validation
                    if (colConfig.isEmail && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        currentError += `Invalid email format for ${colConfig.header}. `;
                        rowIsValid = false;
                    }

                    record[colConfig.dataKey] = value || null; // Store null if empty after processing
                });

                // Map school names to IDs
                if (record.previous_school_name_import) {
                    record.previous_school_id = schoolNameMap[record.previous_school_name_import.toLowerCase()] || null;
                }
                if (record.current_school_name_import) {
                    record.current_school_id = schoolNameMap[record.current_school_name_import.toLowerCase()] || null;
                     if (!record.current_school_id && record.current_school_name_import) { // School name provided but not found
                        currentError += `Current School "${record.current_school_name_import}" not found. `;
                        // Decide if this makes the row invalid or if school can be null
                        // rowIsValid = false;
                    }
                }
                delete record.previous_school_name_import; // Clean up temporary import field
                delete record.current_school_name_import;

                if (rowIsValid) {
                    record.created_by_user_id = user?.id; // Add audit field
                    recordsToInsert.push(record);
                } else {
                    failedImports++;
                    importErrorsList.push(currentError.trim());
                }
            }

            if (recordsToInsert.length > 0) {
                // Batch insert (Supabase client library handles batching up to a certain size)
                const { error: insertError } = await supabase.from('teachers').insert(recordsToInsert);
                if (insertError) {
                    // This error might be general for the batch. More granular errors (like unique constraint) are tricky client-side.
                    throw new Error(`Database insert error: ${insertError.message}. Some valid records might not have been imported.`);
                }
                successfulImports = recordsToInsert.length;
            }

            setImportSummary({
                totalRows: dataRows.length,
                successful: successfulImports,
                failed: failedImports,
                errors: importErrorsList,
            });
            if (importErrorsList.length > 0) setImportErrorsOpen(true);
            if (successfulImports > 0) fetchAndSetTeachers(); // Refresh table

        } catch (importErr) {
            console.error("Import processing error:", importErr);
            setError("Import failed: " + importErr.message);
            setImportSummary(null);
        } finally {
            setImporting(false);
        }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateHeaders = exportImportColumnsConfig.map(col => col.header);
    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Teacher Import Template");
    XLSX.writeFile(workbook, "Teacher_Import_Template.xlsx");
  };


  if (loading && !displayedTeachers.length && !error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Typography variant="h4" component="h1">
          Teacher Management
        </Typography>
        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
            <Button
              variant="outlined"
              startIcon={importing ? <CircularProgress size={20} /> : <FileUploadIcon />}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import from Excel'}
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                hidden
                accept=".xlsx, .xls, .csv"
                onChange={handleImportFileSelect}
            />
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={20} /> : <FileDownloadIcon />}
              onClick={handleExport}
              disabled={exporting || displayedTeachers.length === 0}
            >
              {exporting ? 'Exporting...' : 'Export Displayed'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTeacher}
            >
              Add Teacher
            </Button>
        </Box>
      </Box>
      <Box sx={{mb: 2}}>
        <Typography variant="caption">
            For Excel import, please use columns in the specified order. <Link component="button" variant="caption" onClick={handleDownloadTemplate}>Download Template</Link>.
        </Typography>
      </Box>

        {importSummary && (
            <Alert
                severity={importSummary.failed > 0 ? (importSummary.successful > 0 ? 'warning' : 'error') : 'success'}
                sx={{ mb: 2 }}
                action={
                    importSummary.errors && importSummary.errors.length > 0 ? (
                        <Button color="inherit" size="small" onClick={() => setImportErrorsOpen(!importErrorsOpen)}>
                            {importErrorsOpen ? <ExpandLess /> : <ExpandMore />}
                            DETAILS
                        </Button>
                    ) : null
                }
            >
                Import completed: {importSummary.successful} successful, {importSummary.failed} failed out of {importSummary.totalRows} total data rows.
            </Alert>
        )}
        {importSummary && importSummary.errors && importSummary.errors.length > 0 && (
             <Collapse in={importErrorsOpen} timeout="auto" unmountOnExit>
                <Paper sx={{ maxHeight: 200, overflow: 'auto', p: 1, mb:2, backgroundColor: 'rgba(255,0,0,0.05)' }}>
                    <Typography variant="subtitle2" color="error">Import Errors:</Typography>
                    <List dense>
                        {importSummary.errors.slice(0, 20).map((errMsg, index) => ( // Show first 20 errors
                            <ListItem key={index}><ListItemText secondary={errMsg} /></ListItem>
                        ))}
                        {importSummary.errors.length > 20 && <ListItem><ListItemText secondary={`...and ${importSummary.errors.length - 20} more errors.`} /></ListItem>}
                    </List>
                </Paper>
            </Collapse>
        )}


      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              fullWidth
              label="Search Teachers (Name, ID, Phone, etc.)"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchTermChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <Autocomplete
              options={schoolsList}
              getOptionLabel={(option) => option.name || ''}
              value={selectedSchoolFilter}
              onChange={handleSchoolFilterChange}
              isOptionEqualToValue={(option, value) => option.school_id === value.school_id}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Current School" variant="outlined" fullWidth />
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

      {error && !importSummary && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* Show general error if not related to import summary */}


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
              {loading && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <CircularProgress sx={{my: 2}} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && displayedTeachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No teachers found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
              {!loading && displayedTeachers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((teacher) => {
                  return (
                    <TableRow hover role="checkbox" tabIndex={-1} key={teacher.teacher_id}>
                      {columns.map((column) => {
                        const value = teacher[column.id];
                        if (column.id === 'actions') {
                          return (
                            <TableCell key={column.id} align={column.align}>
                              <IconButton onClick={() => handleViewTeacher(teacher.teacher_id)} title="View Details" size="small">
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                              <IconButton onClick={() => handleEditTeacher(teacher.teacher_id)} title="Edit" size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton onClick={() => handleClickOpenDeleteDialog(teacher)} title="Delete" size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={column.id} align={column.align}>
                            {column.format && typeof value === 'number'
                              ? column.format(value)
                              : (value !== null && value !== undefined ? value : 'N/A')}
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
          count={displayedTeachers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete teacher "{teacherToDelete?.full_name}" (Staff ID: {teacherToDelete?.staff_id})? This action is a soft delete.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            onClick={handleDeleteTeacher}
            color="error"
            autoFocus
            disabled={loading}
          >
            {loading && teacherToDelete ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeachersPage;
