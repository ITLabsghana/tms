import { supabase } from '../supabaseClient';

const baseTeacherSelectQuery = `
  teacher_id,
  staff_id,
  first_name,
  surname,
  other_names,
  email,
  phone_no,
  rank,
  job_title,
  is_deleted,
  ghana_card_no,
  ssnit_no,
  current_school:schools!current_school_id(school_id, name),
  previous_school:schools!previous_school_id(school_id, name)
`;

// Fetch all non-deleted teachers, optionally joining with school names
// Updated to support search and filtering
export const getTeachers = async ({ searchTerm = '', schoolId = null } = {}) => {
  let query = supabase
    .from('teachers')
    .select(baseTeacherSelectQuery)
    .eq('is_deleted', false);

  if (searchTerm) {
    const searchString = `%${searchTerm}%`;
    query = query.or(
      `staff_id.ilike.${searchString},` +
      `first_name.ilike.${searchString},` +
      `surname.ilike.${searchString},` +
      `phone_no.ilike.${searchString},` +
      `ssnit_no.ilike.${searchString},` +
      `ghana_card_no.ilike.${searchString},` +
      `email.ilike.${searchString}`
    );
  }

  if (schoolId) {
    query = query.eq('current_school_id', schoolId);
  }

  query = query.order('surname', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }

  return data.map(teacher => ({
    ...teacher,
    full_name: `${teacher.first_name || ''} ${teacher.surname || ''} ${teacher.other_names || ''}`.trim(),
    current_school_name: teacher.current_school?.name || 'N/A',
    previous_school_name: teacher.previous_school?.name || 'N/A',
  }));
};


// Fetch a single teacher by ID, including all details and school names
export const getTeacherById = async (teacherId) => {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      current_school:schools!current_school_id(school_id, name),
      previous_school:schools!previous_school_id(school_id, name)
    `)
    .eq('teacher_id', teacherId)
    .eq('is_deleted', false)
    .single();

  if (error) {
    console.error(`Error fetching teacher with id ${teacherId}:`, error);
    throw error;
  }
  return data ? {
      ...data,
      current_school_name: data.current_school?.name || 'N/A',
      previous_school_name: data.previous_school?.name || 'N/A',
  } : null;
};

// Add a new teacher
export const addTeacher = async (teacherData) => {
  const { data, error } = await supabase
    .from('teachers')
    .insert([teacherData])
    .select()
    .single();

  if (error) {
    console.error('Error adding teacher:', error);
    throw error;
  }
  return data;
};

// Update an existing teacher
export const updateTeacher = async (teacherId, teacherData) => {
  const { data, error } = await supabase
    .from('teachers')
    .update(teacherData)
    .eq('teacher_id', teacherId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating teacher with id ${teacherId}:`, error);
    throw error;
  }
  return data;
};

// Soft delete a teacher (mark as is_deleted = true)
export const deleteTeacher = async (teacherId) => {
  const { data, error } = await supabase
    .from('teachers')
    .update({ is_deleted: true, updated_at: new Date() })
    .eq('teacher_id', teacherId)
    .select()
    .single();

  if (error) {
    console.error(`Error deleting teacher with id ${teacherId}:`, error);
    throw error;
  }
  return data;
};

// Fetch all schools (for dropdowns in forms and search filters)
export const getSchools = async () => {
    const { data, error } = await supabase
      .from('schools')
      .select('school_id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching schools:', error);
      throw error;
    }
    return data;
  };

// --- Document Management Functions ---

// Upload a file to Supabase Storage (teacher_documents bucket)
export const uploadTeacherDocument = async (teacherId, file, userId) => {
  if (!file) throw new Error("No file provided for upload.");

  // Sanitize filename, remove special characters, add timestamp for uniqueness
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `public/${teacherId}/${Date.now()}_${sanitizedFileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('teacher_documents') // Bucket name
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading document to storage:', uploadError);
    throw uploadError;
  }

  // After successful upload, get the public URL
  const { data: urlData } = supabase.storage
    .from('teacher_documents')
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
      // Attempt to remove the uploaded file if URL retrieval fails to prevent orphans
      await supabase.storage.from('teacher_documents').remove([filePath]);
      throw new Error('Failed to get public URL for uploaded document.');
  }

  // Add record to teacher_documents table
  const documentRecord = {
    teacher_id: teacherId,
    document_name: file.name, // Store original file name
    document_type: file.type || 'application/octet-stream', // Store MIME type
    file_url: urlData.publicUrl, // Store the public URL
    storage_path: filePath, // Store the path for potential deletion
    uploaded_by_user_id: userId,
  };

  const { data: dbData, error: dbError } = await supabase
    .from('teacher_documents')
    .insert([documentRecord])
    .select()
    .single();

  if (dbError) {
    console.error('Error inserting document record into DB:', dbError);
    // Attempt to remove the uploaded file if DB insert fails
    await supabase.storage.from('teacher_documents').remove([filePath]);
    throw dbError;
  }

  return dbData; // Return the database record of the document
};


// Fetch all documents for a specific teacher
export const getTeacherDocuments = async (teacherId) => {
  const { data, error } = await supabase
    .from('teacher_documents')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error(`Error fetching documents for teacher ${teacherId}:`, error);
    throw error;
  }
  return data;
};

// Delete a teacher document (from storage and DB)
export const deleteTeacherDocument = async (documentId, storagePath) => {
  if (!storagePath) {
      console.warn(`Storage path not provided for document ID ${documentId}. Cannot delete from storage.`);
  } else {
      // First, delete from storage
      const { error: storageError } = await supabase.storage
        .from('teacher_documents')
        .remove([storagePath]); // storagePath should be the full path like 'public/teacherId/filename.pdf'

      if (storageError) {
        console.error(`Error deleting document from storage (path: ${storagePath}):`, storageError);
        // Decide if you want to proceed with DB deletion or throw error.
        // If storage delete fails, DB record might become an orphan.
        // For now, we'll log and proceed to delete DB record.
      }
  }

  // Then, delete from the database
  const { error: dbError } = await supabase
    .from('teacher_documents')
    .delete()
    .eq('document_id', documentId);

  if (dbError) {
    console.error(`Error deleting document record from DB (ID: ${documentId}):`, dbError);
    throw dbError;
  }

  return true; // Indicate success
};
