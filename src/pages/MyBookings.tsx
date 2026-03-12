import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { formatThaiDate } from '../lib/utils';
import { Booking } from '../types';
import { Calendar, MapPin, Clock, Bus, Trash2, User } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { cn } from '../lib/utils';

export default function MyBookings() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    id: string;
  }>({
    isOpen: false,
    id: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/my-bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    setConfirmDialog({ isOpen: true, id });
  };

  const executeCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">กำลังโหลด...</div>;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-6">การจองของฉัน</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Calendar size={48} className="mx-auto mb-4 opacity-20" />
          <p>ยังไม่มีรายการจอง</p>
        </div>
      ) : (
        bookings.map(booking => (
          <div key={booking.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                {booking.booking_type === 'Single' ? 'รายวัน' : 'รายสัปดาห์'}
              </div>
              <div className="text-xs text-slate-400">
                จองเมื่อ: {new Date(booking.created_at).toLocaleDateString('th-TH')}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="text-slate-400" size={18} />
                <span className="font-bold text-slate-700">{formatThaiDate(booking.booking_date)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Bus className="text-slate-400" size={18} />
                <span className="text-slate-600">{booking.routes?.route_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-slate-400" size={18} />
                <span className="text-slate-600">เวลา {booking.timeslots?.time.substring(0, 5)} น. ({booking.shifts?.shift_category === 'Morning Shift' ? 'กะเช้า' : 'กะดึก'})</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-slate-400" size={18} />
                <span className="text-slate-600">{booking.pickup_points?.pickup_name}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className={cn(
                "text-xs font-bold px-2 py-1 rounded",
                booking.status === 'confirmed' ? "text-emerald-600 bg-emerald-50" : "text-slate-400 bg-slate-50"
              )}>
                {booking.status === 'confirmed' ? 'ยืนยันแล้ว' : 'ยกเลิกแล้ว'}
              </span>
              {booking.status === 'confirmed' && (
                <button 
                  onClick={() => handleCancel(booking.id)}
                  className="text-red-500 flex items-center gap-1 text-xs font-bold hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                  <Trash2 size={14} /> ยกเลิก
                </button>
              )}
            </div>
          </div>
        ))
      )}

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title="ยกเลิกการจอง?"
        message="คุณต้องการยกเลิกรายการจองนี้ใช่หรือไม่?"
        onConfirm={() => executeCancel(confirmDialog.id)}
        onCancel={() => setConfirmDialog({ isOpen: false, id: '' })}
      />

      {/* Bottom Navigation (Fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton icon={<Bus size={24}/>} label="หน้าแรก" onClick={() => navigate('/')} />
        <NavButton icon={<Calendar size={24}/>} label="จองรถ" onClick={() => navigate('/booking')} />
        <NavButton icon={<Clock size={24}/>} label="การจอง" active />
        <NavButton icon={<User size={24}/>} label="โปรไฟล์" onClick={() => navigate('/profile')} />
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
