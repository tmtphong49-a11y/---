import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

type EmployeeData = {
  id: string;
  employee_code: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  employeeData: EmployeeData | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmployeeData(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(error => {
      console.error("Error checking session:", error);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchEmployeeData(session.user.id);
      } else {
        setEmployeeData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchEmployeeData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("id, employee_code, name, role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setEmployeeData(data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Force redirect to login page after sign out, especially in demo mode
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback redirect
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, employeeData, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
