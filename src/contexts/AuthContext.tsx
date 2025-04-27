import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from "@/types";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  registration_number?: string;
  phone?: string;
  room_number?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error: any}>;
  signUp: (email: string, password: string, userData?: object) => Promise<{error: any, data?: any}>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{error: any}>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<{error: any}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile data function
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Fetch profile when user signs in
          fetchProfile(currentSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session:", currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // If there is a current user, fetch their profile
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Signing in with:", email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, userData?: object) => {
    console.log("Signing up with:", email);
    
    // Prepare metadata with any additional user data
    const metadata = {
      ...userData
    };
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: Object.keys(metadata).length > 0 ? metadata : undefined,
        emailRedirectTo: window.location.origin + "/auth"
      }
    });
    
    return { data, error };
  };

  const signOut = async () => {
    console.log("Signing out");
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    console.log("Resetting password for:", email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://iiitdwd.vercel.app/reset-password'
    });
    return { error };
  };
  
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not authenticated') };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      
      if (!error) {
        // Update the local profile state
        setProfile(prev => prev ? { ...prev, ...profileData } : null);
      }
      
      return { error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile,
      loading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
