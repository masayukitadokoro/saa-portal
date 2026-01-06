'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  saa_role: 'admin' | 'ta' | 'student' | null;
  avatar_url?: string;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isTA: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isTA: false,
  isStudent: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);

        if (session?.user) {
          const res = await fetch('/api/profile');
          if (res.ok && mounted) {
            const data = await res.json();
            setProfile(data.profile);
          }
        }
      } catch (error) {
        console.error('Session error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        if (session?.user) {
          const res = await fetch('/api/profile');
          if (res.ok && mounted) {
            const data = await res.json();
            setProfile(data.profile);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isAdmin: profile?.saa_role === 'admin',
    isTA: profile?.saa_role === 'ta',
    isStudent: profile?.saa_role === 'student',
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
