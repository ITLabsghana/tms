import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (activeUser, isMountedCheck = () => true) => {
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
        console.error("AuthContext: Error fetching profile:", profileError.message);
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
  }, []); // Empty dependency array for useCallback as it uses no external state/props

  const revalidateSession = useCallback(async (isMountedCheck = () => true) => {
    if (isMountedCheck()) setLoading(true);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!isMountedCheck()) return;

    if (sessionError) {
      console.error("AuthContext: Error revalidating session:", sessionError.message);
      setUser(null);
      setProfile(null);
      if (isMountedCheck()) setLoading(false);
      return;
    }

    const activeUser = session?.user ?? null;
    setUser(activeUser);
    await fetchUserProfile(activeUser, isMountedCheck);

    if (isMountedCheck()) setLoading(false);
  }, [fetchUserProfile]); // fetchUserProfile is a dependency

  useEffect(() => {
    let isMounted = true;
    const isMountedCheck = () => isMounted;

    revalidateSession(isMountedCheck); // Initial session validation and profile fetch

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // setLoading(true); // setLoading is handled by revalidateSession
        const activeUser = session?.user ?? null;
        // setUser(activeUser); // This is now handled by revalidateSession if needed, or directly
        // await fetchUserProfile(activeUser, isMountedCheck);
        // For onAuthStateChange, it's often better to just re-trigger a full session revalidation
        // to ensure consistency, especially if tokens might have been refreshed.
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
             await revalidateSession(isMountedCheck);
        } else if (event === 'INITIAL_SESSION') {
            // Already handled by the initial call to revalidateSession
        } else {
            // For other events, just ensure loading is false if not already handled by revalidate.
            // This path might not be strictly necessary if revalidateSession covers all.
            if (isMounted) setLoading(false);
        }
      }
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        // console.log("AuthContext: Tab became visible, revalidating session.");
        revalidateSession(isMountedCheck);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [revalidateSession]); // revalidateSession is a dependency

  const value = {
    signIn: async (data) => supabase.auth.signInWithPassword(data),
    signOut: async () => supabase.auth.signOut(),
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
