import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

// Fetch all leave records, joining with teacher names
export const getLeaveRecords = async ({ teacherId = null, status = null } = {}) => {
  let query = supabase
    .from('leave_records')
    .select(`
      leave_id,
      teacher_id,
      teachers (staff_id, first_name, surname),
      leave_type,
      start_date,
      end_date,
      reason,
      status,
      created_at
    `)
    .order('start_date', { ascending: false });

  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leave records:', error);
    throw error;
  }
  // Transform data to include a display_name for the teacher
  return data.map(record => ({
    ...record,
    teacher_name: record.teachers ? `${record.teachers.first_name} ${record.teachers.surname} (${record.teachers.staff_id})` : 'Unknown Teacher',
  }));
};

// Fetch a single leave record by ID
export const getLeaveRecordById = async (leaveId) => {
  const { data, error } = await supabase
    .from('leave_records')
    .select(`
      *,
      teachers (staff_id, first_name, surname)
    `)
    .eq('leave_id', leaveId)
    .single();

  if (error) {
    console.error(`Error fetching leave record with id ${leaveId}:`, error);
    throw error;
  }
  return data ? {
    ...data,
    teacher_name: data.teachers ? `${data.teachers.first_name} ${data.teachers.surname} (${data.teachers.staff_id})` : 'Unknown Teacher',
  } : null;
};

// Add a new leave record
export const addLeaveRecord = async (leaveData) => {
  // Ensure dates are formatted correctly if they are Date objects
  if (leaveData.start_date && leaveData.start_date instanceof Date) {
    leaveData.start_date = format(leaveData.start_date, 'yyyy-MM-dd');
  }
  if (leaveData.end_date && leaveData.end_date instanceof Date) {
    leaveData.end_date = format(leaveData.end_date, 'yyyy-MM-dd');
  }

  const { data, error } = await supabase
    .from('leave_records')
    .insert([leaveData])
    .select()
    .single();

  if (error) {
    console.error('Error adding leave record:', error);
    throw error;
  }
  return data;
};

// Update an existing leave record
export const updateLeaveRecord = async (leaveId, leaveData) => {
  if (leaveData.start_date && leaveData.start_date instanceof Date) {
    leaveData.start_date = format(leaveData.start_date, 'yyyy-MM-dd');
  }
  if (leaveData.end_date && leaveData.end_date instanceof Date) {
    leaveData.end_date = format(leaveData.end_date, 'yyyy-MM-dd');
  }
  // Ensure updated_at is set
  leaveData.updated_at = new Date().toISOString();


  const { data, error } = await supabase
    .from('leave_records')
    .update(leaveData)
    .eq('leave_id', leaveId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating leave record with id ${leaveId}:`, error);
    throw error;
  }
  return data;
};

// Delete a leave record
export const deleteLeaveRecord = async (leaveId) => {
  const { error } = await supabase
    .from('leave_records')
    .delete()
    .eq('leave_id', leaveId);

  if (error) {
    console.error(`Error deleting leave record with id ${leaveId}:`, error);
    throw error;
  }
  return true; // Indicate success
};


// Define common leave types and statuses
export const leaveTypes = [
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Annual Leave',
  'Study Leave With Pay',
  'Study Leave Without Pay',
  'Casual Leave',
  'Compassionate Leave',
  'Other',
];

export const leaveStatuses = ['Pending', 'Approved', 'Denied', 'Completed'];
