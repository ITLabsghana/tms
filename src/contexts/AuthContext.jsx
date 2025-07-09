import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // Add profile state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        setLoading(false);
        return;
      }

      const activeUser = session?.user ?? null;
      setUser(activeUser);

      if (activeUser) {
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', activeUser.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            // If profile not found (e.g. PGRST116), it might be okay if user was just created and profile sync is pending
            // or if it's an admin creating users who don't immediately get one.
            // For now, we'll set profile to null if error.
            setProfile(null);
          } else {
            setProfile(userProfile);
          }
        } catch (e) {
            console.error("Exception fetching profile:", e);
            setProfile(null);
        }
      } else {
        setProfile(null); // No user, so no profile
      }
      setLoading(false);
    };

    fetchSessionAndProfile(); // Fetch initial session and profile

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true); // Set loading true while we process auth change
        const activeUser = session?.user ?? null;
        setUser(activeUser);

        if (activeUser) {
          try {
            const { data: userProfile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', activeUser.id)
              .single();
            if (profileError) {
                console.error("Error fetching profile on auth change:", profileError);
                setProfile(null);
            } else {
                setProfile(userProfile);
            }
          } catch (e) {
            console.error("Exception fetching profile on auth change:", e);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    // signUp: (data) => supabase.auth.signUp(data), // Self sign-up removed
    signIn: async (data) => {
        const response = await supabase.auth.signInWithPassword(data);
        // After sign-in, session will change and onAuthStateChange will fetch profile
        return response;
    },
    signOut: async () => {
        const response = await supabase.auth.signOut();
        // After sign-out, session will be null and onAuthStateChange will clear user & profile
        return response;
    },
    user,
    profile, // Expose profile
    loading, // Expose loading state
  };

  return (
    <AuthContext.Provider value={value}>
      {/* No longer conditionally render children based on loading here,
          ProtectedRoute and AdminRoute will handle loading state for UI */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
