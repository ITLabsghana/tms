import { supabase } from '../supabaseClient';

export const signUpUser = async ({ email, password, fullName }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName, // This will be in raw_user_meta_data
      },
    },
  });
  if (error) throw error;
  return data;
};

export const signInUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (session) {
    const { user } = session;
    // Optionally fetch profile here if needed immediately after getting user
    // const { data: profile, error: profileError } = await supabase
    //   .from('profiles')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .single();
    // if (profileError) throw profileError;
    // return { ...user, profile };
    return user;
  }
  return null;
};

export const sendPasswordResetEmail = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/update-password', // URL to your password update page
  });
  if (error) throw error;
  return data;
};

export const updateUserPassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error;
    return data;
}

// Add this function to your trigger or call it manually after sign up
// to create a corresponding profile entry.
export const createProfileForNewUser = async (userId, fullName, districtName = '') => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([{ user_id: userId, full_name: fullName, district_name: districtName }]);
  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
  return data;
};
