import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const userRef = useRef(user); // Ref to hold the latest user state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Initial loading is true

  // Update userRef whenever user state changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
    let shouldSetLoading = !isVisibilityChange;
    const currentUser = userRef.current; // Get current user from ref

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!isMountedCheck()) {
      return;
    }

    if (sessionError) {
      console.error("AuthContext: Error revalidating session:", sessionError.message);
      if (isMountedCheck()) {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
      return;
    }

    const activeUser = session?.user ?? null;

    // Determine if loading indicator is needed
    if (activeUser?.id !== currentUser?.id || !isVisibilityChange) {
      shouldSetLoading = true;
    }

    if (shouldSetLoading && isMountedCheck()) {
      setLoading(true);
    }

    // Update user state only if it has actually changed
    if (activeUser?.id !== currentUser?.id || activeUser && !currentUser) {
        setUser(activeUser);
    } else if (!activeUser && currentUser) {
        setUser(null);
    }


    if (activeUser) {
      // Fetch profile only if user changed or profile is null (e.g. initial load for existing session)
      // This condition might need refinement based on when profile should be re-fetched.
      // For now, fetch if activeUser exists and is different or profile isn't there.
      const currentProfile = profile; // Use profile from state directly for this check
      if (activeUser.id !== currentUser?.id || !currentProfile || currentProfile.user_id !== activeUser.id) {
        await fetchUserProfile(activeUser, isMountedCheck);
      }
    } else {
      if (isMountedCheck()) setProfile(null);
    }

    if (isMountedCheck()) {
      setLoading(false);
    }
  }, [fetchUserProfile, profile]); // Depends on fetchUserProfile and profile (for profile refetch logic)

  useEffect(() => {
    let isMounted = true;
    const isMountedCheck = () => isMounted;

    revalidateSessionAndProfile(isMountedCheck, false); // Initial check

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedCheck()) return;

        if (event === 'SIGNED_OUT') {
          setUser(null); // userRef will be updated by its own useEffect
          setProfile(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await revalidateSessionAndProfile(isMountedCheck, false);
        }
      }
    );

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMountedCheck()) {
        await revalidateSessionAndProfile(isMountedCheck, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [revalidateSessionAndProfile]); // revalidateSessionAndProfile should now be stable

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
