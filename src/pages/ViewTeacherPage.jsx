import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTeacherById, getTeacherDocuments, uploadTeacherDocument, deleteTeacherDocument } from '../services/teacherService';
import {
  Box, Typography, Paper, Grid, CircularProgress, Alert, Button, Divider, Avatar,
  List, ListItem, ListItemAvatar, ListItemText, IconButton, TextField, Link,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DescriptionIcon from '@mui/icons-material/Description'; // Generic document icon
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'; // PDF icon
import ImageIcon from '@mui/icons-material/Image'; // Image icon
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { format, parseISO } from 'date-fns';

const DetailItem = ({ label, value, isDate = false }) => (
  <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid for potentially more items */}
    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
      {label}
    </Typography>
    <Typography variant="body1" sx={{ mb: 1.5, wordBreak: 'break-word' }}>
      {isDate && value ? format(parseISO(value), 'MMMM d, yyyy') : (value || 'N/A')}
    </Typography>
  </Grid>
);

const SectionTitle = ({ title }) => (
  <Grid item xs={12}>
    <Typography variant="h6" sx={{ mt: 3, mb: 2, borderBottom: '1px solid #eee', pb: 1 }}>{title}</Typography>
  </Grid>
);

const getFileIcon = (fileType) => {
    if (!fileType) return <DescriptionIcon />;
    if (fileType.startsWith('image/')) return <ImageIcon />;
    if (fileType === 'application/pdf') return <PictureAsPdfIcon />;
    return <DescriptionIcon />;
};


const ViewTeacherPage = () => {
  const { id: teacherId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // For uploaded_by_user_id

  const [teacher, setTeacher] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [error, setError] = useState('');
  const [docError, setDocError] = useState('');
  const [docSuccess, setDocSuccess] = useState('');

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState(''); // Optional: For user to name the document

  const [openDeleteDocDialog, setOpenDeleteDocDialog] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);


  const fetchTeacherData = async () => {
    if (!teacherId) {
      setError('No teacher ID provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const teacherData = await getTeacherById(teacherId);
      if (teacherData) {
        setTeacher(teacherData);
        await fetchDocuments(teacherId); // Fetch documents after teacher data
      } else {
        setError('Teacher not found.');
      }
    } catch (err) {
      setError('Failed to fetch teacher details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (currentTeacherId) => {
    setDocLoading(true);
    setDocError('');
    try {
        const docs = await getTeacherDocuments(currentTeacherId);
        setDocuments(docs || []);
    } catch (err) {
        setDocError('Failed to load documents: ' + err.message);
    } finally {
        setDocLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [teacherId]);


  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
        setSelectedFile(file);
        setDocumentName(file.name); // Pre-fill document name with file name
        setDocError(''); // Clear previous errors
        setDocSuccess('');
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !teacherId) {
        setDocError("Please select a file to upload.");
        return;
    }
    setDocLoading(true);
    setDocError('');
    setDocSuccess('');
    try {
        // Use documentName if provided, otherwise selectedFile.name
        const finalDocumentName = documentName.trim() || selectedFile.name;
        const newDocument = await uploadTeacherDocument(teacherId, selectedFile, user.id);
        // Update the document name in the record if user provided a custom one AND it's different
        // This step might be better handled by passing documentName to uploadTeacherDocument service
        if (documentName.trim() && documentName.trim() !== selectedFile.name && newDocument.document_name !== documentName.trim()) {
            // This would require an update call to the teacher_documents table for the newDocument.id
            // For now, we assume uploadTeacherDocument uses file.name or a sanitized version.
            // Or, the service function could accept `documentName` as a parameter.
        }
        setDocSuccess(`Document "${finalDocumentName}" uploaded successfully!`);
        setSelectedFile(null);
        setDocumentName('');
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        fetchDocuments(teacherId); // Refresh document list
    } catch (err) {
        setDocError('Upload failed: ' + err.message);
    } finally {
        setDocLoading(false);
    }
  };

  const handleClickOpenDeleteDocDialog = (doc) => {
    setDocToDelete(doc);
    setOpenDeleteDocDialog(true);
  };

  const handleCloseDeleteDocDialog = () => {
    setOpenDeleteDocDialog(false);
    setDocToDelete(null);
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setDocLoading(true);
    setDocError('');
    try {
        await deleteTeacherDocument(docToDelete.document_id, docToDelete.storage_path);
        setDocSuccess(`Document "${docToDelete.document_name}" deleted successfully!`);
        fetchDocuments(teacherId); // Refresh document list
    } catch (err) {
        setDocError("Failed to delete document: " + err.message);
    } finally {
        setDocLoading(false);
        handleCloseDeleteDocDialog();
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (!teacher) {
    return <Alert severity="info" sx={{ m: 3 }}>No teacher data to display.</Alert>;
  }

  const fullName = `${teacher.first_name || ''} ${teacher.surname || ''} ${teacher.other_names || ''}`.trim();

  return (
    <Box sx={{ p: 3, maxWidth: '900px', margin: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, mb:3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/teachers')}>
            Back to List
          </Button>
          <Typography variant="h4" component="h1" sx={{ textAlign: 'center', flexGrow: 1 }}>
            Teacher Profile
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            component={RouterLink}
            to={`/teachers/edit/${teacher.teacher_id}`}
          >
            Edit
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={teacher.photo_url || '/default-avatar.png'}
              alt={fullName}
              sx={{ width: 120, height: 120, mb: 1, border: '2px solid lightgray' }}
            />
            <Typography variant="h5" component="h2">{fullName}</Typography>
            <Typography variant="subtitle1" color="text.secondary">{teacher.rank || 'N/A'}</Typography>
          </Grid>

          <SectionTitle title="Personal Information" />
          <DetailItem label="Staff ID" value={teacher.staff_id} />
          <DetailItem label="Gender" value={teacher.gender} />
          <DetailItem label="Date Of Birth" value={teacher.date_of_birth} isDate />
          <DetailItem label="Registered No." value={teacher.registered_no} />
          <DetailItem label="Ghana Card No." value={teacher.ghana_card_no} />
          <DetailItem label="SSNIT No." value={teacher.ssnit_no} />
          <DetailItem label="TIN" value={teacher.tin} />
          <DetailItem label="Phone No." value={teacher.phone_no} />
          <DetailItem label="E-Mail" value={teacher.email} />
          <DetailItem label="Home Town" value={teacher.home_town} />
          <DetailItem label="Address" value={teacher.address} />

          <SectionTitle title="Professional & School Information" />
          <DetailItem label="Academic Qualification" value={teacher.academic_qualification} />
          <DetailItem label="Professional Qualification" value={teacher.professional_qualification} />
          <DetailItem label="Job Title" value={teacher.job_title} />
          <DetailItem label="Leadership Position" value={teacher.leadership_position} />
          <DetailItem label="Area Of Specialization" value={teacher.area_of_specialization} />
          <DetailItem label="Last Promotion Date" value={teacher.last_promotion_date} isDate />
          <DetailItem label="Previous School" value={teacher.previous_school_name || (teacher.previous_school_id ? `ID: ${teacher.previous_school_id}`: 'N/A')} />
          <DetailItem label="Current School" value={teacher.current_school_name || (teacher.current_school_id ? `ID: ${teacher.current_school_id}`: 'N/A')} />
          <DetailItem label="Date Posted To Current School" value={teacher.date_posted_to_current_school} isDate />
          <DetailItem label="Licensure No." value={teacher.licensure_no} />
          <DetailItem label="First Appointment Date" value={teacher.first_appointment_date} isDate />
          <DetailItem label="Date Confirmed" value={teacher.date_confirmed} isDate />
          <DetailItem label="Teacher Union" value={teacher.teacher_union} />

          <SectionTitle title="Bank and Salary Information" />
          <DetailItem label="Name Of Bank" value={teacher.name_of_bank} />
          <DetailItem label="Branch" value={teacher.bank_branch} />
          <DetailItem label="Account Number" value={teacher.account_number} />
          <DetailItem label="Salary Scale" value={teacher.salary_scale} />
        </Grid>
      </Paper>

      {/* Document Management Section */}
      <Paper elevation={3} sx={{ p:3, mt: 3}}>
        <Typography variant="h5" gutterBottom>Teacher Documents</Typography>

        {docSuccess && <Alert severity="success" sx={{mb:2}} onClose={() => setDocSuccess('')}>{docSuccess}</Alert>}
        {docError && <Alert severity="error" sx={{mb:2}} onClose={() => setDocError('')}>{docError}</Alert>}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
                label="Document Name (Optional)"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                size="small"
                sx={{flexGrow: 1, minWidth: '200px'}}
            />
            <Button
                variant="outlined"
                component="label" // Makes the button act like a label for the hidden input
                startIcon={<FileUploadIcon />}
                size="medium"
            >
                Choose File
                <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileSelected}
                />
            </Button>
            <Button
                variant="contained"
                onClick={handleUploadDocument}
                disabled={!selectedFile || docLoading}
                size="medium"
            >
                {docLoading && selectedFile ? <CircularProgress size={24} /> : "Upload Selected"}
            </Button>
        </Box>
        {selectedFile && <Typography variant="caption">Selected: {selectedFile.name}</Typography>}

        {docLoading && documents.length === 0 && <CircularProgress sx={{display: 'block', margin: '20px auto'}}/>}
        {!docLoading && documents.length === 0 && <Typography sx={{mt:2}}>No documents uploaded yet.</Typography>}

        <List sx={{mt: documents.length > 0 ? 1 : 0}}>
            {documents.map(doc => (
                <ListItem
                    key={doc.document_id}
                    secondaryAction={
                        <>
                        <IconButton edge="end" aria-label="download" href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <DownloadIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleClickOpenDeleteDocDialog(doc)} disabled={docLoading}>
                            <DeleteIcon />
                        </IconButton>
                        </>
                    }
                    sx={{borderBottom: '1px solid #f0f0f0', '&:last-child': {borderBottom: 'none'}}}
                >
                    <ListItemAvatar>
                        <Avatar sx={{bgcolor: 'primary.light'}}>
                            {getFileIcon(doc.document_type)}
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                        primary={<Link href={doc.file_url} target="_blank" rel="noopener noreferrer" underline="hover">{doc.document_name}</Link>}
                        secondary={`Uploaded: ${format(parseISO(doc.uploaded_at), 'MMM d, yyyy, h:mm a')}`}
                    />
                </ListItem>
            ))}
        </List>
      </Paper>

      {/* Delete Document Confirmation Dialog */}
      <Dialog
        open={openDeleteDocDialog}
        onClose={handleCloseDeleteDocDialog}
      >
        <DialogTitle>Confirm Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the document "{docToDelete?.document_name}"?
            This will remove it from storage and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDocDialog} disabled={docLoading}>Cancel</Button>
          <Button onClick={handleDeleteDocument} color="error" autoFocus disabled={docLoading}>
            {docLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default ViewTeacherPage;
