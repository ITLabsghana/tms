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
  const revalidateSessionAndProfile = useCallback(async (isMountedCheck, isVisibilityChange = false) => {
    // Only set loading to true if it's not a visibility change or if absolutely necessary.
    // For visibility changes, we want to avoid showing a loader unless session/user actually changes.
    let shouldSetLoading = !isVisibilityChange;

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!isMountedCheck()) {
      return; // Component unmounted, do nothing further.
    }

    if (sessionError) {
      console.error("AuthContext: Error revalidating session:", sessionError.message);
      setUser(null);
      setProfile(null);
      if (isMountedCheck()) setLoading(false); // Ensure loading is cleared on error
      return;
    }

    const activeUser = session?.user ?? null;
    const currentUser = user; // Get current user from state before potential update

    // If user state changes, or if it's an initial load (not just visibility change), then show loading.
    if (activeUser?.id !== currentUser?.id || !isVisibilityChange) {
      shouldSetLoading = true;
    }

    if (shouldSetLoading && isMountedCheck()) {
      setLoading(true);
    }

    setUser(activeUser); // Set user state based on current session

    if (activeUser) {
      await fetchUserProfile(activeUser, isMountedCheck); // Then fetch profile
    } else {
      if (isMountedCheck()) setProfile(null); // Clear profile if no active user
    }

    if (isMountedCheck()) {
      setLoading(false); // Always ensure loading is set to false at the end
    }
  }, [fetchUserProfile, user]); // Added user to dependencies

  useEffect(() => {
    let isMounted = true;
    const isMountedCheck = () => isMounted;

    // Initial check, not a visibility change
    revalidateSessionAndProfile(isMountedCheck, false);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedCheck()) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          // For SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, treat as significant change
          await revalidateSessionAndProfile(isMountedCheck, false);
        }
      }
    );

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMountedCheck()) {
        // console.log("AuthContext: Tab became visible, revalidating session and profile.");
        // When tab becomes visible, re-check session, pass true for isVisibilityChange
        await revalidateSessionAndProfile(isMountedCheck, true);
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
