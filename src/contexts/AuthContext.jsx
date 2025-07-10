import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading is true

  const fetchUserProfile = async (activeUser) => {
    if (!activeUser) {
      setProfile(null);
      return null; // Explicitly return null or the profile
    }
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', activeUser.id)
        .single();

      if (profileError) {
        console.error("AuthContext: Error fetching profile:", profileError.message);
        setProfile(null);
        return null;
      }
      setProfile(userProfile);
      return userProfile;
    } catch (e) {
      console.error("AuthContext: Exception fetching profile:", e.message);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true; // To prevent state updates on unmounted component

    const initializeAuth = async () => {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError) {
        console.error("AuthContext: Error fetching initial session:", sessionError.message);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const activeUser = session?.user ?? null;
      setUser(activeUser);
      await fetchUserProfile(activeUser); // Fetch profile for initial user

      if (isMounted) setLoading(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setLoading(true); // Indicate loading during auth state change
        const activeUser = session?.user ?? null;
        setUser(activeUser);
        await fetchUserProfile(activeUser); // Fetch profile for new user state

        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up

  const value = {
    signIn: async (data) => {
      // signIn itself doesn't need to set user/profile; onAuthStateChange will handle it
      return supabase.auth.signInWithPassword(data);
    },
    signOut: async () => {
      // signOut itself doesn't need to clear user/profile; onAuthStateChange will handle it
      return supabase.auth.signOut();
    },
    user,
    profile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
