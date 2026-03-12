import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AlertDialog from '../components/AlertDialog';

export default function Register() {
  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    department: '',
    position: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      setSuccessDialog(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
              <UserPlus className="text-white w-8 h-8" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">ลงทะเบียนพนักงาน</h2>
          <p className="text-center text-slate-500 mb-8">สร้างบัญชีเพื่อใช้งานระบบจองรถ</p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสพนักงาน *</label>
              <input
                name="employee_code"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.employee_code}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">แผนก</label>
              <input
                name="department"
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง</label>
              <input
                name="position"
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.position}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                name="phone"
                type="tel"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน *</label>
              <input
                name="password"
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ยืนยันรหัสผ่าน *</label>
              <input
                name="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-orange-200 transition-all disabled:opacity-50"
              >
                {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              มีบัญชีอยู่แล้ว?{' '}
              <Link to="/login" className="text-orange-600 font-semibold hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AlertDialog 
        isOpen={successDialog}
        title="ลงทะเบียนสำเร็จ"
        message="บัญชีของคุณถูกสร้างเรียบรอกแล้ว กรุณาเข้าสู่ระบบเพื่อใช้งาน"
        type="success"
        onClose={() => navigate('/login')}
      />
    </div>
  );
}
