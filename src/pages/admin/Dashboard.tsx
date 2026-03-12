import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Users, Map, CalendarCheck, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    totalEmployees: 0,
    totalRoutes: 0,
    availableSeats: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch today's bookings
      const today = new Date().toISOString().split('T')[0];
      const { count: todayBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('booking_date', today)
        .eq('status', 'confirmed');

      // Fetch total employees
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Fetch total routes
      const { count: totalRoutes } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true });

      // Fetch available seats (sum of available in timeslots)
      const { data: timeslots } = await supabase
        .from('timeslots')
        .select('available');
      
      const availableSeats = timeslots?.reduce((sum, slot) => sum + (slot.available || 0), 0) || 0;

      setStats({
        todayBookings: todayBookings || 0,
        totalEmployees: totalEmployees || 0,
        totalRoutes: totalRoutes || 0,
        availableSeats,
      });

      // Fetch bookings for the last 7 days for chart
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('booking_date')
        .in('booking_date', last7Days)
        .eq('status', 'confirmed');

      const chartDataMap = last7Days.reduce((acc, date) => {
        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        acc[date] = { name: dayName, bookings: 0 };
        return acc;
      }, {} as Record<string, any>);

      recentBookings?.forEach(b => {
        if (chartDataMap[b.booking_date]) {
          chartDataMap[b.booking_date].bookings += 1;
        }
      });

      setChartData(Object.values(chartDataMap));

      // Fetch popular routes
      const { data: routeBookings } = await supabase
        .from('bookings')
        .select('route_id, route:routes(route_name)')
        .eq('status', 'confirmed');

      if (routeBookings) {
        const routeCounts: Record<string, { name: string, count: number }> = {};
        routeBookings.forEach(b => {
          const routeName = b.route?.route_name;
          if (routeName) {
            if (!routeCounts[routeName]) routeCounts[routeName] = { name: routeName, count: 0 };
            routeCounts[routeName].count += 1;
          }
        });

        const sortedRoutes = Object.values(routeCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        const maxCount = sortedRoutes.length > 0 ? sortedRoutes[0].count : 1;
        
        setPopularRoutes(sortedRoutes.map(r => ({
          ...r,
          percentage: Math.round((r.count / maxCount) * 100)
        })));
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const statCards = [
    {
      title: "Bookings Today",
      value: stats.todayBookings,
      icon: CalendarCheck,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Routes Active",
      value: stats.totalRoutes,
      icon: Map,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Available Seats",
      value: stats.availableSeats,
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}
            >
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">
                {stat.title}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Weekly Bookings
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="bookings"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Popular Routes
          </h2>
          <div className="space-y-4">
            {popularRoutes.length > 0 ? popularRoutes.map((route, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">
                    {route.name}
                  </span>
                  <span className="text-gray-500">{route.count} bookings</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${route.percentage}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No booking data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
