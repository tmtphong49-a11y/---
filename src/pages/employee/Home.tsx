import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { Bus, CalendarDays, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isTomorrow, isToday } from "date-fns";

export default function EmployeeHome() {
  const { employeeData } = useAuth();
  const [upcomingRide, setUpcomingRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingRide = async () => {
      try {
        if (!employeeData?.id) return;
        
        const { data, error } = await supabase
          .from('bookings')
          .select('*, route:routes(*), pickup_point:pickup_points(*), shift:shifts(*), timeslot:timeslots(*)')
          .eq('employee_id', employeeData.id)
          .eq('status', 'confirmed')
          .gte('booking_date', new Date().toISOString().split('T')[0])
          .order('booking_date', { ascending: true })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
        setUpcomingRide(data);
      } catch (error) {
        console.error("Error fetching upcoming ride:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingRide();
  }, [employeeData?.id]);

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "TODAY";
    if (isTomorrow(date)) return "TOMORROW";
    return format(date, "MMM d");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
        <h1 className="text-2xl font-bold mb-1">Hello, {employeeData?.name || "Employee"}!</h1>
        <p className="text-indigo-100 text-sm mb-6">Where are you going today?</p>
        
        <Link 
          to="/employee/book"
          className="bg-white text-indigo-600 w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
        >
          <Bus size={20} />
          Book a Shuttle
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3 px-1">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/employee/my-bookings" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <CalendarDays size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700">My Bookings</span>
            </Link>
            <Link to="/employee/history" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                <Clock size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700">History</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Ride</h2>
            <Link to="/employee/my-bookings" className="text-sm text-indigo-600 font-medium flex items-center hover:underline">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : upcomingRide ? (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg inline-block mb-2">
                    {getDateLabel(upcomingRide.booking_date)}
                  </div>
                  <h3 className="font-bold text-gray-900">{upcomingRide.route?.route_name}</h3>
                  <p className="text-sm text-gray-500">{upcomingRide.pickup_point?.pickup_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{upcomingRide.timeslot?.time?.substring(0, 5)}</div>
                  <div className="text-xs text-gray-500 uppercase">{upcomingRide.shift?.shift_name}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 text-center py-8">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bus className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500 text-sm">No upcoming rides scheduled.</p>
              <Link to="/employee/book" className="text-indigo-600 text-sm font-medium mt-2 inline-block">
                Book now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
