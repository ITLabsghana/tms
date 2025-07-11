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
  // isVisibilityChange param helps to avoid unnecessary loading spinner on tab resume if user is unchanged.
  const revalidateSessionAndProfile = useCallback(async (isMountedCheck, isVisibilityChange = false) => {
    // 'user' from AuthProvider scope when this fn was defined by useCallback.
    // Since 'fetchUserProfile' is stable, this function instance is stable,
    // so 'userSnapshotAtDefinition' refers to 'user' state at the time of initial mount.
    const userSnapshotAtDefinition = user;

    // If it's NOT a visibility change (e.g. initial load, sign-in), set loading true.
    // If it IS a visibility change, delay setting loading until we confirm user identity changed.
    if (!isVisibilityChange && isMountedCheck()) {
      setLoading(true);
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!isMountedCheck()) {
      // If loading was set true (only if !isVisibilityChange), try to revert.
      // Check isMounted again before calling setLoading.
      if (!isVisibilityChange && isMountedCheck()) setLoading(false);
      return;
    }

    if (sessionError) {
      console.error("AuthContext: Error revalidating session:", sessionError.message);
      if (isMountedCheck()) {
        setUser(null);
        setProfile(null);
        setLoading(false); // Clear loading on error, regardless of isVisibilityChange
      }
      return;
    }

    const activeUser = session?.user ?? null;

    // If it WAS a visibility change and we haven't set loading yet,
    // check if user identity actually changed compared to the snapshot. If so, now set loading.
    if (isVisibilityChange && activeUser?.id !== userSnapshotAtDefinition?.id && isMountedCheck()) {
      setLoading(true);
    }

    setUser(activeUser);
    await fetchUserProfile(activeUser, isMountedCheck); // Fetch profile for the active user (or null)

    if (isMountedCheck()) {
      setLoading(false); // Ensure loading is cleared at the end
    }
  }, [fetchUserProfile]); // INTENTIONALLY NO 'user' dependency here. This keeps the function reference stable.

  useEffect(() => {
    let isMounted = true;
    const isMountedCheck = () => isMounted;

    // Initial check (isVisibilityChange = false by default)
    revalidateSessionAndProfile(isMountedCheck);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMountedCheck()) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
          // For these events, treat as significant change, use default isVisibilityChange = false
          await revalidateSessionAndProfile(isMountedCheck);
        }
      }
    );

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMountedCheck()) {
        // When tab becomes visible, pass true for isVisibilityChange
        await revalidateSessionAndProfile(isMountedCheck, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [revalidateSessionAndProfile]); // Depends on revalidateSessionAndProfile (which is now stable)

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
