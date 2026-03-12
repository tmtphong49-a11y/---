import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Search,
  Download,
  Filter,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

export default function BookingManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [routeFilter, setRouteFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, employee:employees(*), route:routes(*), pickup_point:pickup_points(*), shift:shifts(*), timeslot:timeslots(*)')
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Booking ID",
      "Employee Code",
      "Employee Name",
      "Route",
      "Pickup Point",
      "Shift",
      "Time",
      "Date",
      "Status",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredBookings.map((b) =>
        [
          b.id,
          b.employee.employee_code,
          b.employee.name,
          b.route.route_name,
          b.pickup_point.pickup_name,
          b.shift.shift_name,
          b.timeslot.time,
          format(new Date(b.booking_date), "yyyy-MM-dd"),
          b.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bookings_export_${format(new Date(), "yyyyMMdd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.employee.employee_code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = dateFilter
      ? format(new Date(b.booking_date), "yyyy-MM-dd") === dateFilter
      : true;
    const matchesRoute = routeFilter
      ? b.route.route_name === routeFilter
      : true;
    const matchesShift = shiftFilter
      ? b.shift.shift_name === shiftFilter
      : true;

    return matchesSearch && matchesDate && matchesRoute && matchesShift;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Booking Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and export all shuttle bookings
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-700 transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search employee or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div className="relative">
              <CalendarIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <div className="relative">
              <MapPin
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
              >
                <option value="">All Routes</option>
                <option value="สายสระบุรี">สายสระบุรี</option>
                <option value="สายอยุธยา">สายอยุธยา</option>
                <option value="สายปทุมธานี">สายปทุมธานี</option>
              </select>
            </div>
            <div className="relative">
              <Clock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
              >
                <option value="">All Shifts</option>
                <option value="กะเช้า">กะเช้า</option>
                <option value="กะดึก">กะดึก</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto hidden lg:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Booking ID</th>
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium">Route Details</th>
                <th className="p-4 font-medium">Schedule</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-mono text-sm text-gray-600">
                    {booking.id}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">
                      {booking.employee.name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {booking.employee.employee_code}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">
                      {booking.route.route_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.pickup_point.pickup_name}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">
                      {format(new Date(booking.booking_date), "MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.shift.shift_name} •{" "}
                      {booking.timeslot.time.substring(0, 5)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wider ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-mono text-xs text-gray-500 mb-1">{booking.id}</div>
                  <div className="font-medium text-gray-900 text-lg">
                    {booking.employee.name}
                  </div>
                  <div className="text-sm text-gray-500 font-mono">
                    {booking.employee.employee_code}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wider ${
                    booking.status === "confirmed"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {booking.status}
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-0.5">Route</div>
                  <div className="font-medium text-gray-900">{booking.route.route_name}</div>
                  <div className="text-gray-600 text-xs mt-0.5">{booking.pickup_point.pickup_name}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-0.5">Schedule</div>
                  <div className="font-medium text-gray-900">{format(new Date(booking.booking_date), "MMM d, yyyy")}</div>
                  <div className="text-gray-600 text-xs mt-0.5">{booking.shift.shift_name} • {booking.timeslot.time.substring(0, 5)}</div>
                </div>
              </div>
            </div>
          ))}
          {filteredBookings.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No bookings found matching your filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
