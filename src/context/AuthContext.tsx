import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../config/supabase';

// Comptes de démonstration
const DEMO_ACCOUNTS = {
  student: {
    id: 'demo-student-001',
    email: 'eleve@demo.com',
    name: 'Lucas',
    role: 'student' as UserRole,
    createdAt: new Date(),
  },
  teacher: {
    id: 'demo-teacher-001',
    email: 'prof@demo.com',
    name: 'Marie Dupont',
    role: 'teacher' as UserRole,
    subjects: ['Mathematiques', 'Physique-Chimie'],
    approved: true,
    createdAt: new Date(),
  },
  admin: {
    id: 'demo-admin-001',
    email: 'admin@demo.com',
    name: 'Administrateur',
    role: 'admin' as UserRole,
    approved: true,
    createdAt: new Date(),
  },
};

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole, subjects?: string[]) => Promise<void>;
  signOut: () => Promise<void>;
  demoLogin: (role: 'student' | 'teacher' | 'admin') => void;
  demoEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'educonnect_user';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const demoEnabled = !isSupabaseConfigured;
  const manualSignOutRef = useRef(false);

  const requestWithTimeout = async <T,>(promiseLike: PromiseLike<T>, label: string, timeoutMs = 12000): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${label} timeout`)), timeoutMs);
    });

    try {
      // Wrap PromiseLike in Promise.resolve to ensure it has catch/finally
      return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const loadStoredUser = (): User | null => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (!savedUser) return null;
      const user = JSON.parse(savedUser);
      user.createdAt = new Date(user.createdAt);
      return user as User;
    } catch {
      return null;
    }
  };

  const saveStoredUser = (user: User) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
  };

  const clearStoredUser = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  };

  const mapProfileToUser = (profile: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    subjects: string[] | null;
    created_at: string | null;
  }): User => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    subjects: profile.subjects ?? undefined,
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
  });

  const parseRole = (role: unknown): UserRole | null => {
    if (role === 'student' || role === 'teacher' || role === 'admin') return role;
    return null;
  };

  const normalizeSubjects = (value: unknown): string[] | null => {
    if (!Array.isArray(value)) return null;
    const filtered = value.filter((item): item is string => typeof item === 'string');
    return filtered.length > 0 ? filtered : null;
  };

  const ensureProfile = async (user: SupabaseUser): Promise<User | null> => {
    const { data, error } = await requestWithTimeout(
      supabase
        .from('profiles')
        .select('id,email,name,role,subjects,created_at')
        .eq('id', user.id)
        .maybeSingle(),
      'profiles.select'
    );

    if (error) {
      throw error;
    }

    if (data) {
      return mapProfileToUser(data);
    }

    const role = parseRole(user.user_metadata?.role);
    const name = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null;
    const subjects = normalizeSubjects(user.user_metadata?.subjects);

    if (!role || !name || !user.email) {
      return null;
    }

    const { data: createdProfile, error: insertError } = await requestWithTimeout(
      supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name,
          role,
          subjects: role === 'teacher' ? subjects : null,
        })
        .select('id,email,name,role,subjects,created_at')
        .single(),
      'profiles.insert'
    );

    if (insertError) {
      throw insertError;
    }

    return mapProfileToUser(createdProfile);
  };

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    if (demoEnabled) {
      const storedUser = loadStoredUser();
      if (storedUser) {
        setCurrentUser(storedUser);
      }
      setLoading(false);
      return;
    }

    let isActive = true;

    const initAuth = async () => {
      console.info('[Auth] init:start');
      const storedUser = loadStoredUser();
      if (storedUser && !currentUser) {
        setCurrentUser(storedUser);
        setLoading(false);
      }
      try {
        const { data, error } = await requestWithTimeout(
          supabase.auth.getSession(),
          'Supabase getSession',
          15000
        );
        if (!isActive) return;

        if (error || !data.session?.user) {
          console.warn('[Auth] init:no-session', { error: error?.message });
          if (!error && !storedUser) {
            setCurrentUser(null);
            clearStoredUser();
          }
          setLoading(false);
          return;
        }

        try {
          const profile = await ensureProfile(data.session.user);
          setCurrentUser(profile);
          if (profile) {
            saveStoredUser(profile);
          }
          console.info('[Auth] init:profile', { hasProfile: Boolean(profile) });
        } catch (profileError) {
          console.error('[Auth] init:profile:error', profileError);
          if (!storedUser) {
            setCurrentUser(null);
          }
        } finally {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] init:error', err);
        if (!storedUser) {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) return;
      if (!session?.user) {
        console.info('[Auth] state:unauthenticated', { event: _event });
        const storedUser = loadStoredUser();
        if (manualSignOutRef.current) {
          setCurrentUser(null);
          clearStoredUser();
          manualSignOutRef.current = false;
        } else if (storedUser) {
          setCurrentUser(storedUser);
        }
        setLoading(false);
        return;
      }

      try {
        const profile = await ensureProfile(session.user);
        setCurrentUser(profile);
        if (profile) {
          saveStoredUser(profile);
        }
        console.info('[Auth] state:authenticated', { event: _event, hasProfile: Boolean(profile) });
      } catch (error) {
        console.error('[Auth] state:error', { event: _event, error });
        const storedUser = loadStoredUser();
        if (storedUser) {
          setCurrentUser(storedUser);
        } else {
          setCurrentUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, [demoEnabled]);

  // Connexion demo rapide
  const demoLogin = (role: 'student' | 'teacher' | 'admin') => {
    if (!demoEnabled) {
      throw new Error('Demo mode is disabled');
    }
    const user = DEMO_ACCOUNTS[role];
    setCurrentUser(user);
    localStorage.setItem('educonnect_user', JSON.stringify(user));
  };

  // Connexion
  const signIn = async (email: string, _password: string) => {
    if (demoEnabled) {
      // Mode demo : accepter n'importe quel email/password
      // Détecter le rôle basé sur l'email
      const lowerEmail = email.toLowerCase();
      let user: User;
      if (lowerEmail.includes('admin')) {
        user = DEMO_ACCOUNTS.admin;
      } else if (lowerEmail.includes('prof') || lowerEmail.includes('teacher')) {
        user = DEMO_ACCOUNTS.teacher;
      } else {
        user = DEMO_ACCOUNTS.student;
      }
      setCurrentUser(user);
      saveStoredUser(user);
      return;
    }

    const { data, error } = await requestWithTimeout(
      supabase.auth.signInWithPassword({
        email,
        password: _password,
      }),
      'Supabase signIn'
    );

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('User not found');
    }

    const profile = await ensureProfile(data.user);
    if (!profile) {
      throw new Error('Profile not found');
    }
    setCurrentUser(profile);
    saveStoredUser(profile);
  };

  // Inscription
  const signUp = async (
    email: string,
    _password: string,
    name: string,
    role: UserRole,
    subjects?: string[]
  ) => {
    if (demoEnabled) {
      // Mode demo : créer un utilisateur fictif
      const user: User = {
        id: `demo-${role}-${Date.now()}`,
        email,
        name,
        role,
        subjects: role === 'teacher' ? subjects : undefined,
        createdAt: new Date(),
      };
      setCurrentUser(user);
      localStorage.setItem('educonnect_user', JSON.stringify(user));
      return;
    }

    const { data, error } = await requestWithTimeout(
      supabase.auth.signUp({
        email,
        password: _password,
        options: {
          data: {
            name,
            role,
            subjects: role === 'teacher' ? subjects || [] : [],
          },
        },
      }),
      'Supabase signUp'
    );

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('User not created');
    }

    if (data.session) {
      try {
        const profile = await ensureProfile(data.user);
        if (profile) {
          setCurrentUser(profile);
          saveStoredUser(profile);
          return;
        }
      } catch {
        // Fall back to local state below
      }
    }

    const fallbackUser: User = {
      id: data.user.id,
      email,
      name,
      role,
      subjects: role === 'teacher' ? subjects : undefined,
      createdAt: new Date(),
    };
    setCurrentUser(fallbackUser);
    saveStoredUser(fallbackUser);
  };

  // Déconnexion
  const signOut = async () => {
    if (demoEnabled) {
      setCurrentUser(null);
      clearStoredUser();
      return;
    }
    manualSignOutRef.current = true;
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>((_resolve, reject) => {
          setTimeout(() => reject(new Error('Supabase signOut timeout')), 5000);
        }),
      ]);
    } catch (error) {
      console.warn('[Auth] signOut:error', error);
    } finally {
      setCurrentUser(null);
      clearStoredUser();
      manualSignOutRef.current = false;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signUp,
    signOut,
    demoLogin,
    demoEnabled,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
