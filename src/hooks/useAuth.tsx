import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

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
    let errorMessage: string | null = null;
    let authUserId: string | null = null;
    const attemptSignIn = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        errorMessage = error.message;
        return null;
      }
      authUserId = data.user?.id || null;
      return data;
    };
    let data = await attemptSignIn();
    if (!data) {
      // Auto-provision account if employee exists and password matches hash
      const { data: emp, error: empErr } = await supabase
        .from('employees')
        .select('id, employee_code, name, position, department, phone, role, password_hash, uuid')
        .eq('employee_code', employeeCode)
        .single();
      if (empErr || !emp) {
        throw new Error(errorMessage || 'Invalid login credentials');
      }
      const ok = await bcrypt.compare(password, emp.password_hash || '');
      if (!ok) {
        throw new Error('Invalid login credentials');
      }
      // Create auth user with this password
      const signUp = await supabase.auth.signUp({
        email,
        password,
        options: { data: { employee_code: employeeCode, role: emp.role } },
      });
      if (signUp.error) {
        // If user already exists but wrong password, bubble up
        throw new Error(signUp.error.message || 'Invalid login credentials');
      }
      data = await attemptSignIn();
      if (!data) {
        throw new Error(errorMessage || 'Invalid login credentials');
      }
      // Link back to employees table
      if (!emp.uuid && data.user?.id) {
        await supabase.from('employees').update({ uuid: data.user.id }).eq('id', emp.id);
      }
    }
    const { data: empData, error: empErr } = await supabase
      .from('employees')
      .select('id, employee_code, name, position, department, phone, role')
      .eq('employee_code', employeeCode)
      .single();
    if (empErr || !empData) {
      throw new Error('ไม่พบข้อมูลพนักงาน');
    }
    setUser(empData);
    localStorage.setItem('user', JSON.stringify(empData));
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
