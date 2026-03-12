import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: any | null;
  login: (employeeCode: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    supabase.auth.getSession().then(() => {});
  }, []);

  const login = async (employeeCode: string, password: string) => {
    const email = `${employeeCode}@local`;
    const trySignIn = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return null;
      return data;
    };
    let auth = await trySignIn();
    if (!auth) {
      const signUp = await supabase.auth.signUp({
        email,
        password,
        options: { data: { employee_code: employeeCode } },
      });
      if (signUp.error && !/already registered/i.test(signUp.error.message || '')) {
        throw new Error(signUp.error.message || 'ไม่สามารถสร้างบัญชีได้');
      }
      auth = await trySignIn();
      if (!auth) {
        throw new Error('Invalid login credentials');
      }
    }
    const { data: empRow } = await supabase
      .from('employees')
      .select('id, employee_code, name, position, department, phone, role, uuid')
      .eq('employee_code', employeeCode)
      .maybeSingle();
    let profile = empRow;
    const { data: userRes } = await supabase.auth.getUser();
    const supaUserId = userRes?.user?.id || null;
    if (!profile) {
      const insertRes = await supabase
        .from('employees')
        .insert([{ uuid: supaUserId, employee_code: employeeCode, name: employeeCode, role: 'employee' }])
        .select()
        .single();
      if (!insertRes.error) profile = insertRes.data as any;
    } else if (!profile.uuid && supaUserId) {
      await supabase.from('employees').update({ uuid: supaUserId }).eq('id', profile.id);
      profile.uuid = supaUserId;
    }
    if (!profile) {
      throw new Error('ไม่พบข้อมูลพนักงาน');
    }
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile));
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
