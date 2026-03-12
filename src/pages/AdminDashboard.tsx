import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Route, PickupPoint, Shift, Timeslot } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import { 
  Users, 
  Bus, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  LogOut,
  LayoutDashboard,
  MapPin,
  ClipboardList,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  X,
  Menu,
  Clock,
  Edit2,
  User,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminDashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [stats, setStats] = useState({
    todayBookings: 0,
    totalEmployees: 0,
    popularRoutes: [],
    recentBookings: []
  });

  // Management States
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([]);
  const [expandedBookingDates, setExpandedBookingDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  
  const [showPickupForm, setShowPickupForm] = useState(false);
  const [newPickupName, setNewPickupName] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');

  const [showShiftForm, setShowShiftForm] = useState(false);
  const [newShiftCategory, setNewShiftCategory] = useState('');
  
  const [showTimeslotForm, setShowTimeslotForm] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCapacity, setNewCapacity] = useState(40);

  // Editing States
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editingPickup, setEditingPickup] = useState<PickupPoint | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editingTimeslot, setEditingTimeslot] = useState<Timeslot | null>(null);

  // Report States
  const [reportData, setReportData] = useState<any>({
    summary: { totalBookings: 0, noShows: 0, cancellations: 0, noShowRate: '0%', cancellationRate: '0%' },
    monthlyBookings: [],
    routePopularity: [],
    shiftUsage: [],
    cancelledBookings: []
  });
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [reportEndDate, setReportEndDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchRoutes();
    fetchPickupPoints();
    if (currentTab === 'dashboard') fetchStats();
  }, []);

  useEffect(() => {
    if (currentTab === 'dashboard') fetchStats();
    if (currentTab === 'routes') fetchRoutes();
    if (currentTab === 'pickup') {
      fetchRoutes();
      fetchPickupPoints();
    }
    if (currentTab === 'shifts') {
      fetchShifts();
      fetchAllTimeslots();
    }
    if (currentTab === 'employees') fetchEmployees();
    if (currentTab === 'bookings') fetchAllBookings();
    if (currentTab === 'reports') fetchReports();
  }, [currentTab, reportStartDate, reportEndDate]);

  const fetchReports = async () => {
    try {
      let url = '/api/admin/reports';
      const params = new URLSearchParams();
      if (reportStartDate) params.append('startDate', reportStartDate);
      if (reportEndDate) params.append('endDate', reportEndDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      let url = '/api/admin/reports/export';
      const params = new URLSearchParams();
      if (reportStartDate) params.append('startDate', reportStartDate);
      if (reportEndDate) params.append('endDate', reportEndDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch export data');
      const data = await res.json();

      // Convert to CSV
      // Columns: ชื่อ, สกุล, แผนก, จุดรถ รับ - ส่ง, หมายเหตุ (phone)
      const headers = ['ชื่อ', 'สกุล', 'แผนก', 'จุดรถ รับ - ส่ง', 'หมายเหตุ'];
      const rows = data.map((b: any) => {
        const fullName = b.employees?.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const department = b.employees?.department || '';
        const routeName = b.routes?.route_name || '';
        const pickupName = b.pickup_points?.pickup_name || '';
        const pickupPoint = pickupName;
        const phone = b.employees?.phone || '';

        return [
          `"${firstName}"`,
          `"${lastName}"`,
          `"${department}"`,
          `"${pickupPoint}"`,
          phone ? `="${phone}"` : '""'
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const urlBlob = URL.createObjectURL(blob);
      link.setAttribute('href', urlBlob);
      link.setAttribute('download', `booking_report_${reportStartDate || 'all'}_to_${reportEndDate || 'all'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAllBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchAllBookings();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/routes');
      if (!res.ok) throw new Error('Failed to fetch routes');
      const data = await res.json();
      setRoutes(data);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchPickupPoints = async () => {
    try {
      const res = await fetch('/api/admin/pickup-points', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPickupPoints(data);
    } catch (err) {
      console.error('Error fetching pickup points:', err);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/shifts');
      const data = await res.json();
      setShifts(data);
    } catch (err) {
      console.error('Error fetching shifts:', err);
    }
  };

  const fetchAllTimeslots = async () => {
    try {
      const res = await fetch('/api/shifts');
      const shiftsData = await res.json();
      
      let allTs: Timeslot[] = [];
      for (const s of shiftsData) {
        const tsRes = await fetch(`/api/timeslots/${s.id}`);
        const tsData = await tsRes.json();
        allTs = [...allTs, ...tsData];
      }
      setTimeslots(allTs);
    } catch (err) {
      console.error('Error fetching timeslots:', err);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName) return;
    const res = await fetch('/api/admin/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ route_name: newRouteName })
    });
    if (res.ok) {
      setNewRouteName('');
      setShowRouteForm(false);
      fetchRoutes();
    }
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    try {
      const res = await fetch(`/api/admin/routes/${editingRoute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ route_name: editingRoute.route_name })
      });
      if (!res.ok) throw new Error('Failed to update route');
      setEditingRoute(null);
      fetchRoutes();
    } catch (err: any) {
      setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteRoute = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบสายรถ?',
      message: 'จุดขึ้นรถและรายการจองที่เกี่ยวข้องจะถูกลบออกทั้งหมด',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/routes/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete route');
          }
          fetchRoutes();
          fetchPickupPoints();
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: 'เกิดข้อผิดพลาด',
            message: err.message,
            type: 'error'
          });
        }
      }
    });
  };

  const handleAddPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteId || !newPickupName) return;
    try {
      const res = await fetch('/api/admin/pickup-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ route_id: selectedRouteId, pickup_name: newPickupName })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add pickup point');
      }
      setNewPickupName('');
      setShowPickupForm(false);
      fetchPickupPoints();
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: 'เกิดข้อผิดพลาด',
        message: err.message,
        type: 'error'
      });
    }
  };

  const handleUpdatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPickup) return;
    try {
      const res = await fetch(`/api/admin/pickup-points/${editingPickup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          route_id: editingPickup.route_id, 
          pickup_name: editingPickup.pickup_name 
        })
      });
      if (!res.ok) throw new Error('Failed to update pickup point');
      setEditingPickup(null);
      fetchPickupPoints();
    } catch (err: any) {
      setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeletePickup = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบจุดขึ้นรถ?',
      message: 'รายการจองที่เกี่ยวข้องจะถูกลบออกทั้งหมด',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/pickup-points/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to delete pickup point');
          }
          fetchPickupPoints();
        } catch (err: any) {
          setAlertDialog({
            isOpen: true,
            title: 'เกิดข้อผิดพลาด',
            message: err.message,
            type: 'error'
          });
        }
      }
    });
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/shifts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shift_category: newShiftCategory })
      });
      if (!res.ok) throw new Error('Failed to add shift');
      setNewShiftCategory('');
      setShowShiftForm(false);
      fetchShifts();
    } catch (err: any) {
      setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    try {
      const res = await fetch(`/api/admin/shifts/${editingShift.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ shift_category: editingShift.shift_category })
      });
      if (!res.ok) throw new Error('Failed to update shift');
      setEditingShift(null);
      fetchShifts();
    } catch (err: any) {
      setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteShift = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบกะ?',
      message: 'เวลาและรายการจองที่เกี่ยวข้องจะถูกลบออกทั้งหมด',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/shifts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to delete shift');
          fetchShifts();
          fetchAllTimeslots();
        } catch (err: any) {
          setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
        }
      }
    });
  };

  const handleAddTimeslot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/timeslots', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          shift_id: selectedShiftId, 
          time: newTime, 
          capacity: newCapacity 
        })
      });
      if (!res.ok) throw new Error('Failed to add timeslot');
      setNewTime('');
      setShowTimeslotForm(false);
      fetchAllTimeslots();
    } catch (err: any) {
      setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleUpdateTimeslot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimeslot) return;
    try {
      const res = await fetch(`/api/admin/timeslots/${editingTimeslot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          shift_id: editingTimeslot.shift_id, 
          time: editingTimeslot.time, 
          capacity: editingTimeslot.capacity 
        })
      });
      if (!res.ok) throw new Error('Failed to update timeslot');
      setEditingTimeslot(null);
      fetchAllTimeslots();
    } catch (err: any) {
      setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
    }
  };

  const handleDeleteTimeslot = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'ยืนยันการลบเวลา?',
      message: 'รายการจองที่เกี่ยวข้องจะถูกลบออกทั้งหมด',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/timeslots/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to delete timeslot');
          fetchAllTimeslots();
        } catch (err: any) {
          setAlertDialog({ isOpen: true, title: 'Error', message: err.message, type: 'error' });
        }
      }
    });
  };

  const toggleRouteExpand = (routeId: string) => {
    setExpandedRoutes(prev => 
      prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]
    );
  };

  const groupedPickupPoints = routes.map(route => ({
    ...route,
    points: pickupPoints.filter(p => p.route_id === route.id)
  }));

  const toggleBookingDate = (date: string) => {
    setExpandedBookingDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const groupedBookings = allBookings.reduce((acc, booking) => {
    const date = booking.booking_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, any[]>);
  
  const sortedBookingDates = Object.keys(groupedBookings).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      <div className="mesh-background"></div>
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "glass-sidebar fixed inset-y-0 left-0 w-64 border-r border-white/20 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#0033CC] flex items-center gap-2">
            <Bus /> Shuttle Admin
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/30 rounded-full"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<LayoutDashboard size={20}/>} 
            label="แดชบอร์ด" 
            active={currentTab === 'dashboard'} 
            onClick={() => { setCurrentTab('dashboard'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Bus size={20}/>} 
            label="สายรถ" 
            active={currentTab === 'routes'} 
            onClick={() => { setCurrentTab('routes'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<MapPin size={20}/>} 
            label="จุดขึ้นรถ" 
            active={currentTab === 'pickup'} 
            onClick={() => { setCurrentTab('pickup'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Clock size={20}/>} 
            label="กะและเวลา" 
            active={currentTab === 'shifts'} 
            onClick={() => { setCurrentTab('shifts'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Users size={20}/>} 
            label="พนักงาน" 
            active={currentTab === 'employees'} 
            onClick={() => { setCurrentTab('employees'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<ClipboardList size={20}/>} 
            label="รายการจอง" 
            active={currentTab === 'bookings'} 
            onClick={() => { setCurrentTab('bookings'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<BarChart3 size={20}/>} 
            label="รายงาน" 
            active={currentTab === 'reports'} 
            onClick={() => { setCurrentTab('reports'); setIsSidebarOpen(false); }}
          />
          <NavItem 
            icon={<Settings size={20}/>} 
            label="ตั้งค่า" 
            active={currentTab === 'settings'} 
            onClick={() => { setCurrentTab('settings'); setIsSidebarOpen(false); }}
          />
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button 
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#0033CC] hover:bg-blue-50 rounded-xl transition-all font-medium"
          >
            <User size={20} /> หน้าพนักงาน
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} /> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <header className="h-20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30 bg-white/40 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/30 rounded-xl transition-all"
            >
              <Menu size={24} className="text-white" />
            </button>
            <h2 className="text-base sm:text-2xl font-bold text-[#9400D3] drop-shadow-sm truncate max-w-[150px] sm:max-w-none">
              {currentTab === 'dashboard' && 'แดชบอร์ดภาพรวม'}
              {currentTab === 'routes' && 'จัดการสายรถ'}
              {currentTab === 'pickup' && 'จัดการจุดขึ้นรถ'}
              {currentTab === 'shifts' && 'จัดการกะและเวลา'}
              {currentTab === 'employees' && 'จัดการพนักงาน'}
              {currentTab === 'bookings' && 'รายการจองทั้งหมด'}
            </h2>
          </div>
          <div className="flex items-center gap-4 glass-card px-4 py-2 rounded-2xl">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-[#1b05f1]">{user?.name}</div>
              <div className="text-xs text-[#cb2802] font-medium">ผู้ดูแลระบบ</div>
            </div>
            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center border border-white/40">
              <Users size={20} className="text-slate-700" />
            </div>
          </div>
        </header>

        <div className="p-2 sm:p-4 lg:p-8 space-y-4 lg:space-y-8">
          {currentTab === 'dashboard' && (
            <div className="space-y-4 lg:space-y-8">
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-4">
                  <div className="text-[#0033FF] text-[13px] mb-1">การจองวันนี้</div>
                  <div className="text-xl font-bold text-orange-600">{stats.todayBookings}</div>
                </div>
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-4">
                  <div className="text-[#0033FF] text-[12px] mb-1">พนักงานทั้งหมด</div>
                  <div className="text-xl font-bold text-orange-600">{stats.totalEmployees}</div>
                </div>
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-4">
                  <div className="text-[#0033FF] text-[12px] mb-1">กะเช้า / กะดึก</div>
                  <div className="text-sm font-bold text-orange-600">
                    {stats.shiftStats?.morning || 0} / {stats.shiftStats?.evening || 0}
                  </div>
                </div>
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-sm border border-white/30 p-4">
                  <div className="text-[#0033FF] text-[12px] mb-1">ขารับ / ขาส่ง</div>
                  <div className="text-sm font-bold text-orange-600">
                    {stats.typeStats?.pickup || 0} / {stats.typeStats?.dropoff || 0}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
                <div className="lg:col-span-2 bg-white/40 backdrop-blur-md rounded-2xl lg:rounded-[2rem] shadow-sm border border-white/30 overflow-hidden">
                  <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-white/20 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm lg:text-base">รายการจองล่าสุด</h3>
                    <button onClick={() => setCurrentTab('bookings')} className="text-orange-600 text-[13px] leading-[13px] font-bold hover:underline">ดูทั้งหมด</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs lg:text-sm">
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 font-medium">พนักงาน</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 font-medium">สายรถ</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 font-medium">กะ</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 font-medium">เวลา</th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 font-medium">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {stats.recentBookings.length > 0 ? stats.recentBookings.map((booking: any) => (
                          <tr key={booking.id} className="hover:bg-slate-50 transition-all">
                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                              <div className="font-bold">{booking.employees?.name}</div>
                              <div className="text-[10px] text-slate-500">{booking.employees?.employee_code}</div>
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4">{booking.routes?.route_name}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                              <div className="flex flex-col">
                                <span className="font-medium">{booking.shifts?.shift_category?.includes('เช้า') ? 'กะเช้า' : booking.shifts?.shift_category?.includes('ดึก') ? 'กะดึก' : '-'}</span>
                                <span className="text-[10px] text-slate-500">{booking.shifts?.shift_category?.includes('รับ') ? 'ขารับ' : booking.shifts?.shift_category?.includes('ส่ง') ? 'ขาส่ง' : ''}</span>
                              </div>
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4">{booking.timeslots?.time}</td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4">
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded">ยืนยันแล้ว</span>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-slate-400">ไม่มีข้อมูลการจองล่าสุด</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md rounded-2xl lg:rounded-[2rem] shadow-sm border border-white/30 p-4 lg:p-6">
                  <h3 className="font-bold mb-4 text-slate-800 text-sm lg:text-base">การแจ้งเตือนล่าสุด</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {stats.recentChanges?.length > 0 ? stats.recentChanges.map((change: any) => (
                      <div key={change.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-slate-800 text-sm">
                            {change.employees?.name}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${change.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {change.status === 'cancelled' ? 'ยกเลิก' : 'จองใหม่'}
                          </span>
                        </div>
                        <div className="text-slate-600">สายรถ: <span className="font-medium">{change.routes?.route_name}</span></div>
                        <div className="text-slate-600">ช่วงเวลาจอง: <span className="font-medium">{change.booking_date ? new Date(change.booking_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} {change.timeslots?.time ? `เวลา ${change.timeslots.time.substring(0, 5)} น.` : ''}</span></div>
                        <div className="flex gap-4">
                          <div className="text-slate-600">กะ: <span className="font-medium">{change.shifts?.shift_category?.includes('เช้า') ? 'กะเช้า' : change.shifts?.shift_category?.includes('ดึก') ? 'กะดึก' : '-'}</span></div>
                          <div className="text-slate-600">ขารับ/ส่ง: <span className="font-medium">{change.shifts?.shift_category?.includes('รับ') ? 'ขารับ' : change.shifts?.shift_category?.includes('ส่ง') ? 'ขาส่ง' : '-'}</span></div>
                        </div>
                        <div className="text-slate-400 pt-1 border-t border-slate-100 mt-2">
                          {new Date(change.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} 
                          {' '}
                          {new Date(change.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-slate-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">ยังไม่มีรายการแจ้งเตือนในขณะนี้</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'routes' && (
            <div className="space-y-6">
              {(showRouteForm || editingRoute) && (
                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="font-bold mb-4">{editingRoute ? 'แก้ไขสายรถ' : 'เพิ่มสายรถใหม่'}</h4>
                  <form onSubmit={editingRoute ? handleUpdateRoute : handleAddRoute} className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="ชื่อสายรถ (เช่น สาย A พระราม 2)" 
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={editingRoute ? editingRoute.route_name : newRouteName}
                      onChange={(e) => editingRoute ? setEditingRoute({...editingRoute, route_name: e.target.value}) : setNewRouteName(e.target.value)}
                      required
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 sm:flex-none bg-orange-600 text-white px-6 py-2 rounded-xl font-bold">บันทึก</button>
                      <button type="button" onClick={() => { setShowRouteForm(false); setEditingRoute(null); }} className="flex-1 sm:flex-none text-slate-500 px-4 py-2 bg-slate-100 rounded-xl font-bold">ยกเลิก</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold">รายการสายรถทั้งหมด</h3>
                  {!showRouteForm && !editingRoute && (
                    <button 
                      onClick={() => setShowRouteForm(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-100"
                    >
                      + เพิ่มสายรถ
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-medium">ชื่อสายรถ</th>
                        <th className="px-6 py-4 font-medium">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {routes.length > 0 ? routes.map(route => (
                        <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-700">{route.route_name}</td>
                          <td className="px-6 py-4 flex gap-2">
                            <button 
                              onClick={() => setEditingRoute(route)}
                              className="text-orange-600 p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteRoute(route.id)}
                              className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={2} className="px-6 py-10 text-center text-slate-400 italic">ยังไม่มีข้อมูลสายรถ</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'pickup' && (
            <div className="space-y-6">
              {(showPickupForm || editingPickup) && (
                <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm">
                  <h4 className="font-bold mb-4">{editingPickup ? 'แก้ไขจุดขึ้นรถ' : 'เพิ่มจุดขึ้นรถใหม่'}</h4>
                  <form onSubmit={editingPickup ? handleUpdatePickup : handleAddPickup} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">เลือกสายรถ</label>
                        <select 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none"
                          value={editingPickup ? editingPickup.route_id : selectedRouteId}
                          onChange={(e) => editingPickup ? setEditingPickup({...editingPickup, route_id: e.target.value}) : setSelectedRouteId(e.target.value)}
                          required
                        >
                          <option value="">-- เลือกสายรถ --</option>
                          {routes.map(r => (
                            <option key={r.id} value={r.id}>{r.route_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อจุดขึ้นรถ</label>
                        <input 
                          type="text" 
                          placeholder="เช่น หน้าห้างเซ็นทรัล" 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none"
                          value={editingPickup ? editingPickup.pickup_name : newPickupName}
                          onChange={(e) => editingPickup ? setEditingPickup({...editingPickup, pickup_name: e.target.value}) : setNewPickupName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-xl font-bold">บันทึก</button>
                      <button type="button" onClick={() => { setShowPickupForm(false); setEditingPickup(null); }} className="text-slate-500 px-4 py-2">ยกเลิก</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold">รายการจุดขึ้นรถแบ่งตามสายรถ</h3>
                  {!showPickupForm && !editingPickup && (
                    <button 
                      onClick={() => setShowPickupForm(true)}
                      className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
                    >
                      + เพิ่มจุดขึ้นรถ
                    </button>
                  )}
                </div>
                
                <div className="divide-y divide-slate-100">
                  {groupedPickupPoints.length > 0 ? groupedPickupPoints.map(route => (
                    <div key={route.id} className="bg-white">
                      <button 
                        onClick={() => toggleRouteExpand(route.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Bus className="text-orange-600" size={18} />
                          <span className="font-bold text-slate-800">{route.route_name}</span>
                          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {route.points.length} จุด
                          </span>
                        </div>
                        <ChevronDown 
                          size={20} 
                          className={cn(
                            "text-slate-400 transition-transform duration-200",
                            expandedRoutes.includes(route.id) ? "rotate-180" : ""
                          )} 
                        />
                      </button>
                      
                      {expandedRoutes.includes(route.id) && (
                        <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
                          {route.points.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                              {route.points.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-3">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span className="text-sm font-medium">{p.pickup_name}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setEditingPickup(p)}
                                      className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePickup(p.id)}
                                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-slate-400 text-xs italic">
                              ยังไม่มีจุดขึ้นรถในสายนี้
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="px-6 py-10 text-center text-slate-400">ยังไม่มีข้อมูลสายรถ</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'shifts' && (
            <div className="space-y-8">
              {/* Shift Management */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">จัดการกะการทำงาน</h3>
                  <button 
                    onClick={() => setShowShiftForm(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-100 transition-all hover:scale-105 active:scale-95"
                  >
                    + เพิ่มกะ
                  </button>
                </div>

                {(showShiftForm || editingShift) && (
                  <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="font-bold mb-4 text-slate-800">{editingShift ? 'แก้ไขกะ' : 'เพิ่มกะใหม่'}</h4>
                    <form onSubmit={editingShift ? handleUpdateShift : handleAddShift} className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" 
                        placeholder="ชื่อกะ (เช่น Morning Shift, Night Shift)" 
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        value={editingShift ? editingShift.shift_category : newShiftCategory}
                        onChange={(e) => editingShift ? setEditingShift({...editingShift, shift_category: e.target.value}) : setNewShiftCategory(e.target.value)}
                        required
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="flex-1 sm:flex-none bg-orange-600 text-white px-6 py-2 rounded-xl font-bold shadow-md shadow-orange-100 transition-all hover:bg-orange-700">บันทึก</button>
                        <button type="button" onClick={() => { setShowShiftForm(false); setEditingShift(null); }} className="flex-1 sm:flex-none text-slate-500 px-4 py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-all">ยกเลิก</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shifts.map(shift => (
                    <div key={shift.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm hover:border-orange-200 transition-all group">
                      <div>
                        <div className="font-bold text-slate-700">{shift.shift_category}</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">ID: {shift.id.substring(0, 8)}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => setEditingShift(shift)} className="text-orange-400 hover:text-orange-600 p-2 hover:bg-orange-50 rounded-xl transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteShift(shift.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeslot Management */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800">จัดการเวลา รับ-ส่ง</h3>
                  <button 
                    onClick={() => setShowTimeslotForm(true)}
                    className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-100 transition-all hover:scale-105 active:scale-95"
                  >
                    + เพิ่มเวลา
                  </button>
                </div>

                {(showTimeslotForm || editingTimeslot) && (
                  <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="font-bold mb-4 text-slate-800">{editingTimeslot ? 'แก้ไขเวลา' : 'เพิ่มเวลาใหม่'}</h4>
                    <form onSubmit={editingTimeslot ? handleUpdateTimeslot : handleAddTimeslot} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เลือกกะ</label>
                        <select 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                          value={editingTimeslot ? editingTimeslot.shift_id : selectedShiftId}
                          onChange={(e) => editingTimeslot ? setEditingTimeslot({...editingTimeslot, shift_id: e.target.value}) : setSelectedShiftId(e.target.value)}
                          required
                        >
                          <option value="">-- เลือกกะ --</option>
                          {shifts.map(s => <option key={s.id} value={s.id}>{s.shift_category}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เวลา</label>
                        <input 
                          type="time" 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                          value={editingTimeslot ? editingTimeslot.time.substring(0, 5) : newTime}
                          onChange={(e) => editingTimeslot ? setEditingTimeslot({...editingTimeslot, time: e.target.value}) : setNewTime(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ความจุ (ที่นั่ง)</label>
                        <input 
                          type="number" 
                          placeholder="40" 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                          value={editingTimeslot ? editingTimeslot.capacity : newCapacity}
                          onChange={(e) => editingTimeslot ? setEditingTimeslot({...editingTimeslot, capacity: parseInt(e.target.value)}) : setNewCapacity(parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <div className="sm:col-span-3 flex gap-2 pt-2">
                        <button type="submit" className="flex-1 sm:flex-none bg-orange-600 text-white px-8 py-2 rounded-xl font-bold shadow-md shadow-orange-100 transition-all hover:bg-orange-700">บันทึก</button>
                        <button type="button" onClick={() => { setShowTimeslotForm(false); setEditingTimeslot(null); }} className="flex-1 sm:flex-none text-slate-500 px-6 py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-all">ยกเลิก</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4">
                  {shifts.map(shift => {
                    const shiftTimeslots = timeslots.filter(ts => ts.shift_id === shift.id).sort((a, b) => a.time.localeCompare(b.time));
                    return (
                      <div key={shift.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 font-bold text-slate-700">
                          {shift.shift_category}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-4">เวลา</th>
                                <th className="px-6 py-4">ความจุ</th>
                                <th className="px-6 py-4">จัดการ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {shiftTimeslots.length > 0 ? shiftTimeslots.map(ts => (
                                <tr key={ts.id} className="hover:bg-white/50 transition-colors group">
                                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{ts.time.substring(0, 5)} น.</td>
                                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{ts.capacity} ที่นั่ง</td>
                                  <td className="px-6 py-4 flex gap-2">
                                    <button onClick={() => setEditingTimeslot(ts)} className="text-orange-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                      <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteTimeslot(ts.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                      <X size={18} />
                                    </button>
                                  </td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={3} className="px-6 py-4 text-center text-slate-400 text-sm italic">ยังไม่มีเวลาในกะนี้</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentTab === 'employees' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-slate-100">
                <h3 className="font-bold">รายชื่อพนักงานทั้งหมด</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">รหัสพนักงาน</th>
                      <th className="px-6 py-4 font-medium">ชื่อ-นามสกุล</th>
                      <th className="px-6 py-4 font-medium hidden sm:table-cell">แผนก</th>
                      <th className="px-6 py-4 font-medium hidden md:table-cell">เบอร์โทรศัพท์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-slate-500">{emp.employee_code}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">{emp.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden sm:table-cell">{emp.department}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">{emp.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'bookings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-slate-100">
                <h3 className="font-bold">รายการจองรถทั้งหมด</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-medium">วันที่</th>
                      <th className="px-6 py-4 font-medium">พนักงาน</th>
                      <th className="px-6 py-4 font-medium">สายรถ / จุดขึ้นรถ</th>
                      <th className="px-6 py-4 font-medium">เวลา</th>
                      <th className="px-6 py-4 font-medium">สถานะ</th>
                      <th className="px-6 py-4 font-medium text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedBookingDates.map(date => (
                      <React.Fragment key={date}>
                        <tr 
                          className="bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors border-y border-slate-200"
                          onClick={() => toggleBookingDate(date)}
                        >
                          <td colSpan={6} className="px-6 py-3 text-sm font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <ChevronDown className={cn("w-4 h-4 transition-transform text-slate-500", expandedBookingDates.includes(date) ? "rotate-180" : "")} />
                              {new Date(date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                {groupedBookings[date].length} รายการ
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedBookingDates.includes(date) && groupedBookings[date].map(b => (
                          <tr key={b.id} className="bg-white hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-slate-700">
                              {new Date(b.booking_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-700">{b.employees?.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{b.employees?.employee_code}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-700">{b.routes?.route_name}</div>
                              <div className="text-xs text-slate-500">{b.pickup_points?.pickup_name}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{b.timeslots?.time.substring(0, 5)} น.</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 text-[10px] font-bold rounded-full",
                                b.status === 'confirmed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                                b.status === 'no_show' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                "bg-red-50 text-red-600 border border-red-100"
                              )}>
                                {b.status === 'confirmed' ? 'ยืนยันแล้ว' : 
                                 b.status === 'no_show' ? 'ไม่มาขึ้นรถ' : 'ยกเลิกแล้ว'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {b.status === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'no_show')}
                                  className="text-xs bg-orange-100 text-orange-600 hover:bg-orange-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                >
                                  ไม่มาขึ้นรถ
                                </button>
                              )}
                              {b.status === 'no_show' && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                  className="text-xs bg-emerald-100 text-emerald-600 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                                >
                                  ยกเลิก No-show
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentTab === 'reports' && (
            <div className="space-y-6">
              {/* Header & Filter */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">รายงานและสถิติ</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">เลือกช่วงเวลา:</span>
                    <input 
                      type="date" 
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                      type="date" 
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
                  >
                    <Download size={16} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">การจองทั้งหมด</div>
                  <div className="text-3xl font-bold text-slate-800">{reportData.summary.totalBookings.toLocaleString()} <span className="text-sm font-normal text-slate-500">ครั้ง</span></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">จองแต่ไม่มาขึ้นรถ (No-show)</div>
                  <div className="text-3xl font-bold text-red-600">{reportData.summary.noShows.toLocaleString()} <span className="text-sm font-normal text-slate-500">ครั้ง</span></div>
                  <div className="text-xs text-red-500 mt-2">คิดเป็น {reportData.summary.noShowRate} ของการจองทั้งหมด</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-sm text-slate-500 mb-1">ยกเลิกการจอง</div>
                  <div className="text-3xl font-bold text-orange-500">{reportData.summary.cancellations.toLocaleString()} <span className="text-sm font-normal text-slate-500">ครั้ง</span></div>
                  <div className="text-xs text-orange-400 mt-2">คิดเป็น {reportData.summary.cancellationRate} ของการจองทั้งหมด</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">สถิติการจองรถ (6 เดือนล่าสุด)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.monthlyBookings}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="bookings" stroke="#0033CC" strokeWidth={3} dot={{ r: 4, fill: '#0033CC' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">ความนิยมแต่ละสายรถ</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.routePopularity}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                        <RechartsTooltip 
                          cursor={{ fill: '#F1F5F9' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="users" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">สัดส่วนการใช้บริการตามกะ</h3>
                  <div className="h-72 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.shiftUsage}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {reportData.shiftUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cancelled Bookings Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">รายชื่อพนักงานที่ยกเลิกการจองรถ</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-800 text-white text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4 font-medium">วันที่จอง</th>
                          <th className="px-6 py-4 font-medium">รหัสพนักงาน</th>
                          <th className="px-6 py-4 font-medium">ชื่อ-นามสกุล</th>
                          <th className="px-6 py-4 font-medium">สายรถ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData.cancelledBookings && reportData.cancelledBookings.length > 0 ? (
                          reportData.cancelledBookings.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-700">
                                {new Date(booking.date).toLocaleDateString('th-TH', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-slate-600">
                                {booking.employeeCode}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                {booking.employeeName}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {booking.routeName}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                              ไม่มีข้อมูลการยกเลิกในช่วงเวลานี้
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'settings' && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <Settings size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-bold text-slate-400">กำลังพัฒนาส่วนนี้...</h3>
              <p className="text-slate-400">ฟีเจอร์นี้จะพร้อมใช้งานในเวอร์ชันถัดไป</p>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <AlertDialog 
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] lg:hidden">
        <NavButton icon={<LayoutDashboard size={24}/>} label="แดชบอร์ด" active={currentTab === 'dashboard'} onClick={() => setCurrentTab('dashboard')} />
        <NavButton icon={<Bus size={24}/>} label="สายรถ" active={currentTab === 'routes'} onClick={() => setCurrentTab('routes')} />
        <NavButton icon={<MapPin size={24}/>} label="จุดขึ้นรถ" active={currentTab === 'pickup'} onClick={() => setCurrentTab('pickup')} />
        <NavButton icon={<Users size={24}/>} label="พนักงาน" active={currentTab === 'employees'} onClick={() => setCurrentTab('employees')} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick, labelStyle, bgColor }: { icon: any, label: string, active?: boolean, onClick?: () => void, labelStyle?: string, bgColor?: string }) {
  return (
    <button 
      onClick={onClick}
      style={{ backgroundColor: bgColor }}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-left",
        active ? "active-nav text-orange-700" : "text-slate-700 hover:bg-white/30"
      )}
    >
      {icon}
      <span className={labelStyle}>{label}</span>
      {active && <ChevronRight size={16} className="ml-auto" />}
    </button>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: any, icon: any, trend?: string }) {
  return (
    <div className="glass-card p-6 rounded-3xl group hover:bg-white/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-white/30 rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        {trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>}
      </div>
      <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-sm text-slate-600">{title}</div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
        active ? "text-orange-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

