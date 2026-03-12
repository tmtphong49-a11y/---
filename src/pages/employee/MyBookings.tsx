import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Bus,
  XCircle,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export default function MyBookings() {
  const { employeeData } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      if (!employeeData?.id) return;
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*, route:routes(*), pickup_point:pickup_points(*), shift:shifts(*), timeslot:timeslots(*)')
        .eq('employee_id', employeeData.id)
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm("Are you sure you want to cancel this booking?")) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', id);
          
        if (error) throw error;
        setBookings(bookings.filter((b) => b.id !== id));
      } catch (error) {
        console.error("Error cancelling booking:", error);
      }
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
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your upcoming shuttle rides
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bus className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            No upcoming bookings
          </h3>
          <p className="text-gray-500 mt-2">
            You haven't booked any shuttles yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="bg-indigo-600 px-5 py-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-2 font-medium">
                  <CalendarIcon size={16} />
                  {format(new Date(booking.booking_date), "EEE, MMM d, yyyy")}
                </div>
                <div className="text-xs bg-white/20 px-2 py-1 rounded-full font-mono">
                  {booking.id}
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {booking.route.route_name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1 gap-1">
                      <MapPin size={14} />
                      {booking.pickup_point.pickup_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">
                      {booking.timeslot.time.substring(0, 5)}
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {booking.shift.shift_name}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setShowQR(booking.id)}
                    className="flex-1 bg-indigo-50 text-indigo-700 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                  >
                    <QrCode size={18} />
                    Show QR
                  </button>
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="flex-1 bg-red-50 text-red-700 font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={18} />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowQR(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Boarding Pass
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              Show this QR code to the driver
            </p>

            <div className="bg-gray-50 p-6 rounded-2xl inline-block mb-6 border border-gray-200">
              <QRCodeSVG value={`booking:${showQR}`} size={200} />
            </div>

            <p className="font-mono text-gray-500 mb-6">{showQR}</p>

            <button
              onClick={() => setShowQR(null)}
              className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
