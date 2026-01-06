'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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

// Supabaseクライアントをモジュールレベルで1回だけ作成
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // 既に初期化済みなら何もしない
    if (initialized.current) {
      console.log('[AuthContext] Already initialized, skipping');
      return;
    }
    initialized.current = true;

    const supabase = getSupabaseClient();
    console.log('[AuthContext] Initializing...');

    const getSession = async () => {
      try {
        console.log('[AuthContext] Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('[AuthContext] Session:', session ? 'exists' : 'null');
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('[AuthContext] Fetching profile...');
          const res = await fetch('/api/profile');
          if (res.ok) {
            const data = await res.json();
            console.log('[AuthContext] Profile received:', data.profile?.saa_role);
            setProfile(data.profile);
          } else {
            console.log('[AuthContext] Profile fetch failed:', res.status);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error:', error);
      } finally {
        console.log('[AuthContext] Setting loading to false');
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state changed:', event);
        setUser(session?.user ?? null);
        if (session?.user) {
          const res = await fetch('/api/profile');
          if (res.ok) {
            const data = await res.json();
            setProfile(data.profile);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      console.log('[AuthContext] Cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.saa_role === 'admin',
    isTA: profile?.saa_role === 'ta',
    isStudent: profile?.saa_role === 'student',
  };

  console.log('[AuthContext] Render - loading:', loading, 'isAdmin:', value.isAdmin, 'profile:', profile?.saa_role);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
