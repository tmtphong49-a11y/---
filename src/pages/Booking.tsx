import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  User
} from 'lucide-react';
import { cn, DAYS_OF_WEEK } from '../lib/utils';
import { Route, PickupPoint, Shift, Timeslot } from '../types';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';

export default function Booking() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);

  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');
  const [selectedTimeslot, setSelectedTimeslot] = useState<string>('');
  const [selectedPickup, setSelectedPickup] = useState<string>('');
  const [bookingType, setBookingType] = useState<'Single' | 'Weekly'>('Single');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchShifts();
  }, []);

  useEffect(() => {
    if (selectedRoute) fetchPickupPoints(selectedRoute);
  }, [selectedRoute]);

  useEffect(() => {
    if (selectedShift) fetchTimeslots(selectedShift);
  }, [selectedShift]);

  const fetchRoutes = async () => {
    const res = await fetch('/api/routes');
    const data = await res.json();
    setRoutes(data);
  };

  const fetchPickupPoints = async (routeId: string) => {
    const res = await fetch(`/api/pickup-points/${routeId}`);
    const data = await res.json();
    setPickupPoints(data);
  };

  const fetchShifts = async () => {
    const res = await fetch('/api/shifts');
    const data = await res.json();
    setShifts(data);
  };

  const fetchTimeslots = async (shiftId: string) => {
    const res = await fetch(`/api/timeslots/${shiftId}`);
    const data = await res.json();
    setTimeslots(data);
  };

  const handleBooking = async () => {
    setLoading(true);
    setError('');
    
    let payload: any = {
      route_id: selectedRoute,
      pickup_point_id: selectedPickup,
      shift_id: selectedShift,
      timeslot_id: selectedTimeslot,
      booking_type: bookingType,
    };

    if (bookingType === 'Single') {
      payload.booking_date = selectedDate;
    } else {
      payload.selected_days = selectedDays;
      payload.week_start_date = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      
      setSuccess(true);
      setStep(7);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleDay = (date: string) => {
    setSelectedDays(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bus className="text-orange-600" /> เลือกสายรถ
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {routes.map(route => (
                <button
                  key={route.id}
                  onClick={() => { setSelectedRoute(route.id); nextStep(); }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    selectedRoute === route.id ? "border-orange-600 bg-orange-50" : "border-slate-100 hover:border-orange-200"
                  )}
                >
                  <div className="font-bold">{route.route_name}</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock className="text-orange-600" /> เลือกกะการทำงาน
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {shifts.map(shift => (
                <button
                  key={shift.id}
                  onClick={() => { setSelectedShift(shift.id); nextStep(); }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-center transition-all",
                    selectedShift === shift.id ? "border-orange-600 bg-orange-50" : "border-slate-100 hover:border-orange-200"
                  )}
                >
                  <div className="font-bold">
                    {shift.shift_category === 'Morning Shift' ? 'กะเช้า' : 
                     shift.shift_category === 'Night Shift' ? 'กะดึก' : 
                     shift.shift_category}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Clock className="text-orange-600" /> เลือกเวลา
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {timeslots.map(ts => (
                <button
                  key={ts.id}
                  onClick={() => { setSelectedTimeslot(ts.id); nextStep(); }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-center transition-all",
                    selectedTimeslot === ts.id ? "border-orange-600 bg-orange-50" : "border-slate-100 hover:border-orange-200"
                  )}
                >
                  <div className="font-bold">{ts.time.substring(0, 5)}</div>
                  <div className="text-xs text-slate-500">ว่าง {ts.capacity} ที่</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="text-orange-600" /> เลือกจุดขึ้นรถ
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {pickupPoints.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPickup(p.id); nextStep(); }}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    selectedPickup === p.id ? "border-orange-600 bg-orange-50" : "border-slate-100 hover:border-orange-200"
                  )}
                >
                  <div className="font-bold">{p.pickup_name}</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="text-orange-600" /> เลือกประเภทการจอง
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => { setBookingType('Single'); nextStep(); }}
                className={cn(
                  "p-5 rounded-2xl border-2 text-left transition-all",
                  bookingType === 'Single' ? "border-orange-600 bg-orange-50" : "border-slate-100"
                )}
              >
                <div className="font-bold">จองรายวัน</div>
                <div className="text-sm text-slate-500">เลือกจองเฉพาะวันที่ต้องการ</div>
              </button>
              <button
                onClick={() => { setBookingType('Weekly'); nextStep(); }}
                className={cn(
                  "p-5 rounded-2xl border-2 text-left transition-all",
                  bookingType === 'Weekly' ? "border-orange-600 bg-orange-50" : "border-slate-100"
                )}
              >
                <div className="font-bold">จองรายสัปดาห์</div>
                <div className="text-sm text-slate-500">เลือกจองหลายวันในสัปดาห์เดียว</div>
              </button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">ยืนยันการจอง</h3>
            
            {bookingType === 'Single' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">เลือกวันที่</label>
                <input
                  type="date"
                  className="w-full p-4 rounded-xl border border-slate-200"
                  value={selectedDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">เลือกวันในสัปดาห์นี้</label>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return (
                      <button
                        key={dateStr}
                        onClick={() => toggleDay(dateStr)}
                        className={cn(
                          "p-3 rounded-xl border-2 text-sm transition-all",
                          selectedDays.includes(dateStr) ? "border-orange-600 bg-orange-50" : "border-slate-100"
                        )}
                      >
                        {format(date, 'EEEE', { locale: th })}
                        <div className="text-[10px] opacity-60">{format(date, 'd MMM')}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">สายรถ:</span> <span className="font-bold">{routes.find(r => r.id === selectedRoute)?.route_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">เวลา:</span> <span className="font-bold">{timeslots.find(t => t.id === selectedTimeslot)?.time.substring(0, 5)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">จุดขึ้นรถ:</span> <span className="font-bold">{pickupPoints.find(p => p.id === selectedPickup)?.pickup_name}</span></div>
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

            <button
              onClick={handleBooking}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 disabled:opacity-50"
            >
              {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
            </button>
          </div>
        );
      case 7:
        return (
          <div className="text-center py-10 space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600 w-12 h-12" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">จองรถสำเร็จ!</h2>
            <p className="text-slate-500">คุณสามารถตรวจสอบรายการจองได้ที่เมนู "การจองของฉัน"</p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold"
            >
              กลับหน้าหลัก
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto">
      {step < 7 && (
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={prevStep} 
            disabled={step === 1}
            className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-0"
          >
            <ChevronLeft />
          </button>
          <div className="text-sm font-bold text-slate-400">ขั้นตอนที่ {step} / 6</div>
          <div className="w-10"></div>
        </div>
      )}

      {renderStep()}
      
      {/* Bottom Navigation (Fixed) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <NavButton icon={<Bus size={24}/>} label="หน้าแรก" onClick={() => navigate('/')} />
        <NavButton icon={<Calendar size={24}/>} label="จองรถ" active />
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
