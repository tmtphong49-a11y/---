import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { User, LogOut, Phone, Shield, Settings, Briefcase, Building, Hash, Lock, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Bus, Calendar, Clock } from 'lucide-react';

export default function Profile() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsChanging(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordForm(false), 2000);
      } else {
        setPasswordError(data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      setPasswordError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto space-y-6">
      <h2 className="text-xl font-bold mb-6">โปรไฟล์ของฉัน</h2>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
            <User size={40} />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold">{profile?.name}</h3>
            <p className="text-sm text-slate-500">{profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 text-slate-700">
            <Hash className="text-slate-400" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">รหัสพนักงาน</span>
              <span className="font-medium">{profile?.employee_code}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-slate-700">
            <Briefcase className="text-slate-400" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ตำแหน่ง</span>
              <span className="font-medium">{profile?.position || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <Building className="text-slate-400" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">แผนก</span>
              <span className="font-medium">{profile?.department || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <Phone className="text-slate-400" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">เบอร์โทรศัพท์</span>
              <span className="font-medium">{profile?.phone || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-700">
            <Shield className="text-slate-400" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">สิทธิ์การใช้งาน</span>
              <span className="font-medium">{profile?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงานทั่วไป'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => setShowPasswordForm(!showPasswordForm)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3 text-slate-700">
            <Lock className="text-slate-400" size={20} />
            <span className="font-bold">เปลี่ยนรหัสผ่าน</span>
          </div>
          <Key className={cn("text-slate-300 transition-transform", showPasswordForm && "rotate-45")} size={18} />
        </button>

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">รหัสผ่านใหม่</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl">
                <AlertCircle size={14} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 text-xs bg-emerald-50 p-3 rounded-xl">
                <CheckCircle2 size={14} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isChanging}
              className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {isChanging ? 'กำลังดำเนินการ...' : 'ยืนยันการเปลี่ยนรหัสผ่าน'}
            </button>
          </form>
        )}
      </div>

      {profile?.role === 'admin' && (
        <button
          onClick={() => navigate('/admin')}
          className="w-full flex items-center justify-center gap-2 bg-[#0033CC] text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors"
        >
          <Settings size={20} /> สลับไปหน้าแอดมิน
        </button>
      )}

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-colors"
      >
        <LogOut size={20} /> ออกจากระบบ
      </button>

      {/* Bottom Navigation (Fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton icon={<Bus size={24}/>} label="หน้าแรก" onClick={() => navigate('/')} />
        <NavButton icon={<Calendar size={24}/>} label="จองรถ" onClick={() => navigate('/booking')} />
        <NavButton icon={<Clock size={24}/>} label="การจอง" onClick={() => navigate('/my-bookings')} />
        <NavButton icon={<User size={24}/>} label="โปรไฟล์" active />
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-orange-600" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
      {active && <div className="w-1 h-1 bg-orange-600 rounded-full mt-0.5"></div>}
    </button>
  );
}

