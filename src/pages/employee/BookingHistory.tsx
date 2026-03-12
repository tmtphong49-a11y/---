import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

export default function BookingHistory() {
  const { employeeData } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      if (!employeeData?.id) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('*, route:routes(*), pickup_point:pickup_points(*), shift:shifts(*), timeslot:timeslots(*)')
        .eq('employee_id', employeeData.id)
        .lt('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500 text-sm mt-1">
          Past bookings and cancellations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.status === "completed"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {item.status === "completed" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <XCircle size={20} />
                )}
              </div>
              <div>
                <div className="font-bold text-gray-900">
                  {item.route.route_name}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={12} />{" "}
                    {format(new Date(item.booking_date), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {item.timeslot.time.substring(0, 5)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-xs font-medium uppercase tracking-wider ${
                  item.status === "completed"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {item.status}
              </div>
              <div className="text-xs text-gray-400 font-mono mt-1">
                {item.id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
