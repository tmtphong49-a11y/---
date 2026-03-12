import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Bus,
  CalendarDays,
  User as UserIcon,
  Bell,
  Menu,
  LogOut
} from "lucide-react";
import { cn } from "../lib/utils";

export default function EmployeeLayout() {
  const { user, employeeData, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!user || employeeData?.role !== 'employee') return <Navigate to="/login" />;

  const navigation = [
    { name: "Home", href: "/employee", icon: Home },
    { name: "Book", href: "/employee/book", icon: Bus },
    { name: "My Booking", href: "/employee/my-bookings", icon: CalendarDays },
    { name: "Profile", href: "/employee/profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center lg:justify-start lg:bg-gray-50">
      
      {/* DESKTOP SIDEBAR (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="font-bold text-xl text-indigo-600 flex items-center gap-2">
            <Bus className="text-indigo-600" /> ShuttleBook
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/employee" &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-700 hover:bg-gray-100",
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-indigo-700" : "text-gray-400",
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={signOut}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-md lg:max-w-none lg:ml-64 bg-gray-50 flex flex-col relative shadow-2xl lg:shadow-none min-h-screen">
        
        {/* Top App Bar (Mobile Only) */}
        <header className="lg:hidden bg-indigo-600 text-white shadow-md sticky top-0 z-50">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-1 -ml-1 hover:bg-indigo-700 rounded-full transition-colors">
                <Menu size={24} />
              </button>
              <div className="font-bold text-lg tracking-wide">ShuttleBook</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-indigo-700 rounded-full transition-colors relative">
                <Bell size={22} />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-indigo-600"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Top Header (Desktop Only) */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-gray-800">
            {navigation.find(n => location.pathname === n.href || (n.href !== "/employee" && location.pathname.startsWith(n.href)))?.name || "Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative text-gray-600">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                {employeeData?.name?.charAt(0) || "E"}
              </div>
              <div className="text-sm font-medium text-gray-700">{employeeData?.name || "Employee"}</div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-[80px] lg:pb-8 lg:p-8">
          <div className="p-4 sm:p-6 lg:p-0 max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Bottom Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around">
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/employee" &&
                location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-2 px-1 text-[10px] font-medium transition-colors relative",
                  isActive
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-900",
                )}
              >
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full"></div>
                )}
                <div className={cn(
                  "p-1.5 rounded-full mb-0.5 transition-colors",
                  isActive ? "bg-indigo-50" : "bg-transparent"
                )}>
                  <item.icon
                    className={cn(
                      "h-6 w-6",
                      isActive ? "text-indigo-600" : "text-gray-500",
                    )}
                  />
                </div>
                {item.name}
              </Link>
            );
          })}
          </div>
        </nav>
      </div>
    </div>
  );
}
