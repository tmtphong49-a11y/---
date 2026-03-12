import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Bus, 
  Calendar, 
  Clock, 
  User, 
  LogOut, 
  ChevronRight,
  Bell,
  Star,
  MapPin,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Home() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [todayBooking, setTodayBooking] = React.useState<any>(null);

  React.useEffect(() => {
    fetchTodayBooking();
  }, []);

  const fetchTodayBooking = async () => {
    try {
      const res = await fetch('/api/my-bookings/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      // data is expected to be an array of bookings
      setTodayBooking(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ... Header ... */}
      <header className="bg-orange-600 text-white p-4 pt-6 pb-8 rounded-b-[2rem] shadow-lg shadow-orange-100 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <div className="text-orange-100 text-xs mb-1">ยินดีต้อนรับ</div>
            <h1 className="text-xl font-bold">{user?.name}</h1>
          </div>
          <button className="p-2 bg-white/10 rounded-full relative">
            <Bell size={20} />
          </button>
        </div>
      </header>

      <main className="px-4 -mt-4 max-w-md mx-auto space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/booking')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <Bus size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm">จองรถ</span>
          </button>
          <button 
            onClick={() => navigate('/my-bookings')}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Calendar size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm">การจอง</span>
          </button>
        </div>

        {/* Today's Booking */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
              <Calendar className="text-orange-600" size={16} /> การจองของวันนี้
            </h3>
          </div>
          {todayBooking && todayBooking.length > 0 ? (
            <div className="space-y-2">
              {todayBooking.map((booking: any) => (
                <div key={booking.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <div className="text-sm font-bold text-slate-800">{booking.routes?.route_name || 'ไม่พบข้อมูลสายรถ'}</div>
                    <div className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{booking.timeslots?.time || 'ไม่พบข้อมูลเวลา'}</div>
                  </div>
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <MapPin size={12} /> {booking.pickup_points?.pickup_name || 'ไม่พบข้อมูลจุดขึ้นรถ'}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 mt-2">
                    <span>กะ: {booking.shifts?.shift_category || '-'}</span>
                    <span>ประเภท: {booking.booking_type === 'Single' ? 'จองครั้งเดียว' : booking.booking_type === 'Weekly' ? 'จองรายสัปดาห์' : booking.booking_type || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3">
              <p className="text-xs text-slate-500">ไม่มีการจองสำหรับวันนี้</p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-800 px-2 text-sm">ข่าวสารและประกาศ</h3>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
            <Bell size={24} className="mx-auto mb-1 text-slate-200" />
            <p className="text-xs text-slate-400">ยังไม่มีประกาศใหม่ในขณะนี้</p>
          </div>
        </div>

        {user?.role === 'admin' && (
          <button 
            onClick={() => navigate('/admin')}
            className="w-full bg-[#0033CC] text-white p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 mt-4"
          >
            <Settings size={20} />
            <span className="font-bold text-sm">สลับไปหน้าแอดมิน</span>
          </button>
        )}
      </main>

      {/* Bottom Navigation (Fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton icon={<Bus size={24}/>} label="หน้าแรก" active />
        <NavButton icon={<Calendar size={24}/>} label="จองรถ" onClick={() => navigate('/booking')} />
        <NavButton icon={<Clock size={24}/>} label="การจอง" onClick={() => navigate('/my-bookings')} />
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
