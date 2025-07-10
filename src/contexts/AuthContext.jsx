import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading is true

  // Fetches user profile. isMountedCheck is passed to ensure no state updates if unmounted.
  const fetchUserProfile = useCallback(async (activeUser, isMountedCheck) => {
    if (!activeUser) {
      if (isMountedCheck()) setProfile(null);
      return null;
    }
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', activeUser.id)
        .single();

      if (!isMountedCheck()) return null;

      if (profileError) {
        // It's important not to log "Error fetching profile" if the error is PGRST116 (row not found),
        // as this is expected for a new user whose profile might not be created yet by an admin/trigger.
        if (profileError.code !== 'PGRST116') {
            console.error("AuthContext: Error fetching profile:", profileError.message);
        }
        setProfile(null);
        return null;
      }
      setProfile(userProfile);
      return userProfile;
    } catch (e) {
      console.error("AuthContext: Exception fetching profile:", e.message);
      if (isMountedCheck()) setProfile(null);
      return null;
    }
  }, []);

  // Revalidates session and fetches profile.
  const revalidateSessionAndProfile = useCallback(async (isMountedCheck) => {
    if (isMountedCheck()) setLoading(true);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (!isMountedCheck()) {
        if (isMountedCheck()) setLoading(false); // Ensure loading is false if unmounted during getSession
        return;
    }

    if (sessionError) {
      console.error("AuthContext: Error revalidating session:", sessionError.message);
      setUser(null);
      setProfile(null);
      if (isMountedCheck()) setLoading(false);
      return;
    }

    const activeUser = session?.user ?? null;
    setUser(activeUser); // Set user state based on current session
    await fetchUserProfile(activeUser, isMountedCheck); // Then fetch profile

    if (isMountedCheck()) setLoading(false);
  }, [fetchUserProfile]);

  useEffect(() => {
    let isMounted = true;
    const isMountedCheck = () => isMounted;

    revalidateSessionAndProfile(isMountedCheck); // Initial check

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedCheck()) return;

        // console.log(`Auth event: ${event}`, session);
        // For most events, a full revalidation is safest.
        // SIGNED_OUT will result in session being null, activeUser null, profile null.
        // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED should all re-fetch user and profile.
        await revalidateSessionAndProfile(isMountedCheck);
      }
    );

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMountedCheck()) {
        // console.log("AuthContext: Tab became visible, revalidating session and profile.");
        // When tab becomes visible, re-check everything.
        await revalidateSessionAndProfile(isMountedCheck);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [revalidateSessionAndProfile]); // revalidateSessionAndProfile is the key dependency

  const value = {
    signIn: async (data) => supabase.auth.signInWithPassword(data), // onAuthStateChange will handle updates
    signOut: async () => supabase.auth.signOut(), // onAuthStateChange will handle updates
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
