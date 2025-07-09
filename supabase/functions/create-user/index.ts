import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Function to get the role of the invoking user
async function getInvokerRole(supabaseClient: SupabaseClient, invokerUserId: string): Promise<string | null> {
  if (!invokerUserId) return null;

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('user_id', invokerUserId)
    .single();

  if (error) {
    console.error('Error fetching invoker profile:', error);
    return null;
  }
  return profile?.role || null;
}

serve(async (req: Request) => {
  // Create a Supabase client with the Auth context of the logged-in user.
  // This is used to check the invoker's role.
  const userSupabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  // Get the user object from the JWT.
  const { data: { user: invoker } , error: invokerAuthError } = await userSupabaseClient.auth.getUser();
  if (invokerAuthError || !invoker) {
    console.error('Invoker auth error:', invokerAuthError);
    return new Response(JSON.stringify({ error: 'Authentication failed for invoking user.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if the invoking user is an admin
  const invokerRole = await getInvokerRole(userSupabaseClient, invoker.id);
  if (invokerRole !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden: Only admins can create users.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Now, create the Supabase admin client to perform privileged operations.
  // This uses the SERVICE_ROLE_KEY.
  const supabaseAdminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { email, password, fullName, role: newUserRole, district } = await req.json();

    if (!email || !password || !fullName || !newUserRole) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, fullName, role.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!['admin', 'supervisor', 'teacher'].includes(newUserRole)) {
        return new Response(JSON.stringify({ error: 'Invalid role specified.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }


    // Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdminClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Admin is creating, so mark email as confirmed
      // user_metadata can be used for data accessible via auth.user() but not directly queryable in db tables unless synced.
      // We are using the 'profiles' table for roles and other app-specific metadata.
    });

    if (authError) {
      console.error('Supabase auth.admin.createUser error:', authError);
      throw new Error(authError.message || 'Failed to create user in authentication system.');
    }
    if (!authData.user) {
      throw new Error('User creation did not return user data from authentication system.');
    }

    // Create the profile in public.profiles table
    const { error: profileError } = await supabaseAdminClient
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        role: newUserRole,
        district_name: district || null, // Use null if district is empty or not provided
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Attempt to delete the auth user if profile creation fails to prevent orphaned auth users
      const { error: deleteUserError } = await supabaseAdminClient.auth.admin.deleteUser(authData.user.id);
      if (deleteUserError) {
        console.error('Failed to roll back auth user creation after profile error:', deleteUserError);
      }
      throw new Error(profileError.message || 'Failed to create user profile.');
    }

    return new Response(JSON.stringify({ message: 'User created successfully', userId: authData.user.id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Overall error in create-user function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), {
      status: (error.status_code || error.status) || 500, // Use status from Supabase error if available
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
