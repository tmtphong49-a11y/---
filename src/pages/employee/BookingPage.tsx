import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Bus,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Zap
} from "lucide-react";
import { format, addDays } from "date-fns";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

export default function BookingPage() {
  const { employeeData } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [timeslots, setTimeslots] = useState<any[]>([]);

  const [step, setStep] = useState(1);
  
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<any>(null);
  const [selectedPickup, setSelectedPickup] = useState<any>(null);
  const [bookingType, setBookingType] = useState<"single" | "weekly" | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRoute) fetchPickupPoints(selectedRoute.id);
  }, [selectedRoute]);

  useEffect(() => {
    if (selectedShift) fetchTimeslots(selectedShift.id);
  }, [selectedShift]);

  const fetchInitialData = async () => {
    try {
      const { data: routesData, error: routesError } = await supabase.from("routes").select("*");
      const { data: shiftsData, error: shiftsError } = await supabase.from("shifts").select("*");

      if (routesError) throw routesError;
      if (shiftsError) throw shiftsError;

      if (routesData) setRoutes(routesData);
      if (shiftsData) setShifts(shiftsData);

      if (!routesData || routesData.length === 0) {
        console.warn("No routes found in database");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load booking data");
    }
  };

  const fetchPickupPoints = async (routeId: string) => {
    try {
      const { data, error } = await supabase
        .from("pickup_points")
        .select("*")
        .eq("route_id", routeId);
        
      if (error) throw error;
      
      if (data && data.length > 0) setPickupPoints(data);
    } catch (error) {
      console.error("Error fetching pickup points:", error);
      toast.error("Failed to load pickup points");
    }
  };

  const fetchTimeslots = async (shiftId: string) => {
    try {
      const { data, error } = await supabase
        .from("timeslots")
        .select("*")
        .eq("shift_id", shiftId);
        
      if (error) throw error;
      
      if (data && data.length > 0) setTimeslots(data);
    } catch (error) {
      console.error("Error fetching timeslots:", error);
      toast.error("Failed to load timeslots");
    }
  };

  const handleBooking = async () => {
    if (!employeeData?.id) {
      toast.error("User not found");
      return;
    }
    
    setLoading(true);
    try {
      const bookingData = {
        employee_id: employeeData.id,
        route_id: selectedRoute.id,
        pickup_point_id: selectedPickup.id,
        shift_id: selectedShift.id,
        timeslot_id: selectedTime.id,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        status: "confirmed",
        type: bookingType
      };

      const { data, error } = await supabase
        .from("bookings")
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      setBookingSuccess(data);
      toast.success("Booking confirmed!");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Failed to book shuttle");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickWeeklyBooking = async () => {
    try {
      // Get last booking
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          route:routes(*),
          shift:shifts(*),
          timeslot:timeslots(*),
          pickup_point:pickup_points(*)
        `)
        .eq("employee_id", employeeData?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setSelectedRoute(data.route);
        setSelectedShift(data.shift);
        setSelectedTime(data.timeslot);
        setSelectedPickup(data.pickup_point);
        setBookingType("weekly");
        toast.success("Loaded last booking details");
        setStep(6); // Go to confirm
      } else {
        toast.error("No previous booking found");
      }
    } catch (error) {
      console.error("Error fetching last booking:", error);
      toast.error("No previous booking found");
    }
  };

  if (bookingSuccess) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-6 flex flex-col items-center text-center border border-gray-100 mt-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-gray-500 mb-6">
          Your shuttle has been successfully booked.
        </p>

        <div className="bg-gray-50 p-6 rounded-2xl w-full mb-6 border border-gray-200">
          <QRCodeSVG
            value={`booking:${bookingSuccess.id}`}
            size={150}
            className="mx-auto mb-4"
          />
          <p className="text-sm font-mono text-gray-500">
            ID: {bookingSuccess.id}
          </p>
        </div>

        <button
          onClick={() => {
            setBookingSuccess(null);
            setStep(1);
            setSelectedRoute(null);
            setSelectedShift(null);
            setSelectedTime(null);
            setSelectedPickup(null);
            setBookingType(null);
          }}
          className="w-full bg-indigo-600 text-white font-medium py-3.5 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Book Another Shuttle
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Booking */}
      {step === 1 && (
        <div className="space-y-4">
          <button 
            onClick={handleQuickWeeklyBooking}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-3xl shadow-md flex items-center justify-between active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Zap size={24} className="text-yellow-300" />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">Quick Weekly Booking</div>
                <div className="text-xs text-indigo-100">Use your last route & time</div>
              </div>
            </div>
            <ChevronRight />
          </button>
          
          <div className="flex items-center justify-between px-1">
            <h1 className="text-xl font-bold text-gray-900">New Booking</h1>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Step {step} of 6</span>
          </div>
        </div>
      )}

      {step > 1 && (
        <div className="flex items-center gap-3 px-1">
          <button onClick={() => setStep(step - 1)} className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(step / 6) * 100}%` }}></div>
            </div>
          </div>
          <span className="text-sm font-medium text-gray-500">{step}/6</span>
        </div>
      )}

      {/* Step 1: Route */}
      {step === 1 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bus className="text-indigo-600" /> เลือกสายรถ (Route)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={() => {
                  setSelectedRoute(route);
                  setSelectedPickup(null);
                  setStep(2);
                }}
                className={`p-5 rounded-3xl border text-left transition-all shadow-sm flex items-center justify-between ${
                  selectedRoute?.id === route.id
                    ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                    : "bg-white border-gray-100 active:bg-gray-50"
                }`}
              >
                <div className="font-bold text-gray-900 text-lg">
                  {route.route_name}
                </div>
                <ChevronRight className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Shift */}
      {step === 2 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-indigo-600" /> เลือกประเภทกะ (Shift)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {shifts.map((shift) => (
              <button
                key={shift.id}
                onClick={() => {
                  setSelectedShift(shift);
                  setSelectedTime(null);
                  setStep(3);
                }}
                className={`p-5 rounded-3xl border text-left transition-all shadow-sm flex items-center justify-between ${
                  selectedShift?.id === shift.id
                    ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                    : "bg-white border-gray-100 active:bg-gray-50"
                }`}
              >
                <div className="font-bold text-gray-900 text-lg">
                  {shift.shift_name}
                </div>
                <ChevronRight className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Time */}
      {step === 3 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="text-indigo-600" /> เลือกเวลา (Time)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeslots.map((slot) => {
              const isFull = slot.available === 0;
              return (
                <button
                  key={slot.id}
                  disabled={isFull}
                  onClick={() => {
                    setSelectedTime(slot);
                    setStep(4);
                  }}
                  className={`p-5 rounded-3xl border flex items-center justify-between transition-all shadow-sm ${
                    isFull
                      ? "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                      : selectedTime?.id === slot.id
                        ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                        : "bg-white border-gray-100 active:bg-gray-50"
                  }`}
                >
                  <div className="font-bold text-2xl text-gray-900">
                    {slot.time.substring(0, 5)}
                  </div>
                  <div
                    className={`text-sm font-bold px-4 py-1.5 rounded-full ${
                      isFull
                        ? "bg-red-100 text-red-700"
                        : slot.available < 10
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {isFull ? "Full" : `${slot.available} seats left`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Pickup Point */}
      {step === 4 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-indigo-600" /> เลือกจุดขึ้นรถ (Pickup Point)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pickupPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => {
                  setSelectedPickup(point);
                  setStep(5);
                }}
                className={`p-5 rounded-3xl border text-left transition-all shadow-sm flex items-center justify-between ${
                  selectedPickup?.id === point.id
                    ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                    : "bg-white border-gray-100 active:bg-gray-50"
                }`}
              >
                <div className="font-bold text-gray-900 text-lg">
                  {point.pickup_name}
                </div>
                <ChevronRight className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Booking Type */}
      {step === 5 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" /> เลือกประเภทการจอง (Type)
          </h2>
          
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4">
            <label className="text-sm font-bold text-gray-500 mb-2 block">Select Date (For Single Day)</label>
            <input 
              type="date" 
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => {
                setBookingType("single");
                setStep(6);
              }}
              className={`p-5 rounded-3xl border text-left transition-all shadow-sm flex items-center justify-between ${
                bookingType === "single"
                  ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                  : "bg-white border-gray-100 active:bg-gray-50"
              }`}
            >
              <div>
                <div className="font-bold text-gray-900 text-lg">Single Day</div>
                <div className="text-sm text-gray-500">Book for {format(selectedDate, "MMM d, yyyy")}</div>
              </div>
              <ChevronRight className="text-gray-400" />
            </button>
            
            <button
              onClick={() => {
                setBookingType("weekly");
                setStep(6);
              }}
              className={`p-5 rounded-3xl border text-left transition-all shadow-sm flex items-center justify-between ${
                bookingType === "weekly"
                  ? "bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600"
                  : "bg-white border-gray-100 active:bg-gray-50"
              }`}
            >
              <div>
                <div className="font-bold text-gray-900 text-lg">Weekly Booking</div>
                <div className="text-sm text-gray-500">Book for the whole week</div>
              </div>
              <ChevronRight className="text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Confirm */}
      {step === 6 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-xl font-bold text-gray-900 text-center">ยืนยันการจอง (Confirm)</h2>
          
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-indigo-600 p-4 text-white text-center">
              <div className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">
                {bookingType === "weekly" ? "Weekly Pass" : "Single Day Pass"}
              </div>
              <div className="text-2xl font-bold">
                {bookingType === "single" ? format(selectedDate, "MMM d, yyyy") : "Mon - Fri"}
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <div className="text-gray-500 text-sm">Route</div>
                <div className="font-bold text-gray-900">{selectedRoute?.route_name}</div>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <div className="text-gray-500 text-sm">Pickup Point</div>
                <div className="font-bold text-gray-900">{selectedPickup?.pickup_name}</div>
              </div>
              
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <div className="text-gray-500 text-sm">Shift</div>
                <div className="font-bold text-gray-900">{selectedShift?.shift_name}</div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-gray-500 text-sm">Time</div>
                <div className="font-bold text-indigo-600 text-xl">{selectedTime?.time?.substring(0, 5)}</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}
