import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://gkwwlxcisqrazgfhcknx.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd3dseGNpc3FyYXpnZmhja254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTIzNzcsImV4cCI6MjA4ODc4ODM3N30.OmaZnNOxrre-ZQN2mRZjkHgFmIplX9EhXeDG4FRw8yc";
const JWT_SECRET = process.env.JWT_SECRET || "shuttle-booking-secret-key-2024";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { employee_code, name, position, department, phone, password } = req.body;
    
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from("employees")
        .insert([
          { 
            employee_code, 
            name, 
            position, 
            department, 
            phone, 
            password_hash: hashedPassword,
            role: 'employee' 
          }
        ])
        .select()
        .single();

      if (error) throw error;
      res.json({ message: "Registration successful", user: data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { employee_code, password } = req.body;
    
    try {
      const { data: user, error } = await supabase
        .from("employees")
        .select("*")
        .eq("employee_code", employee_code)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: "ไม่พบรหัสพนักงานนี้" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
      }

      const token = jwt.sign(
        { id: user.id, employee_code: user.employee_code, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, user: { id: user.id, name: user.name, role: user.role, employee_code: user.employee_code } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Profile Routes ---
  app.get("/api/profile", authenticateToken, async (req: any, res) => {
    try {
      const { data: user, error } = await supabase
        .from("employees")
        .select("id, employee_code, name, position, department, phone, role")
        .eq("id", req.user.id)
        .single();

      if (error) throw error;
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/profile/change-password", authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const { data: user, error } = await supabase
        .from("employees")
        .select("password_hash")
        .eq("id", req.user.id)
        .single();

      if (error || !user) throw new Error("User not found");

      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await supabase
        .from("employees")
        .update({ password_hash: hashedNewPassword })
        .eq("id", req.user.id);

      if (updateError) throw updateError;
      res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Data Routes ---
  app.get("/api/routes", async (req, res) => {
    const { data, error } = await supabase.from("routes").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/pickup-points/:routeId", async (req, res) => {
    const { data, error } = await supabase
      .from("pickup_points")
      .select("*")
      .eq("route_id", req.params.routeId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/shifts", async (req, res) => {
    const { data, error } = await supabase.from("shifts").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/timeslots/:shiftId", async (req, res) => {
    const { data, error } = await supabase
      .from("timeslots")
      .select("*")
      .eq("shift_id", req.params.shiftId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // --- Booking Routes ---
  app.post("/api/bookings", authenticateToken, async (req: any, res) => {
    const { 
      route_id, 
      pickup_point_id, 
      shift_id, 
      timeslot_id, 
      booking_date, 
      booking_type,
      selected_days, // For weekly booking
      week_start_date
    } = req.body;
    const employee_id = req.user.id;

    try {
      // Check capacity
      const checkCapacity = async (date: string) => {
        const { count, error: countError } = await supabase
          .from("bookings")
          .select("*", { count: 'exact', head: true })
          .eq("booking_date", date)
          .eq("timeslot_id", timeslot_id);
        
        if (countError) throw countError;

        const { data: timeslot } = await supabase
          .from("timeslots")
          .select("capacity")
          .eq("id", timeslot_id)
          .single();

        if (count && timeslot && count >= timeslot.capacity) {
          throw new Error(`ที่นั่งเต็มสำหรับวันที่ ${date}`);
        }
      };

      if (booking_type === 'Single') {
        await checkCapacity(booking_date);
        const { error } = await supabase.from("bookings").insert([{
          employee_id, route_id, pickup_point_id, shift_id, timeslot_id, booking_date, booking_type
        }]);
        if (error) {
          if (error.code === '23505') {
            throw new Error('คุณได้ทำการจองรถรอบนี้ไว้แล้ว');
          }
          throw error;
        }
      } else if (booking_type === 'Weekly') {
        // selected_days is array of dates or days? 
        // Let's assume frontend sends array of dates for the week
        for (const date of selected_days) {
          await checkCapacity(date);
          const { error } = await supabase.from("bookings").insert([{
            employee_id, route_id, pickup_point_id, shift_id, timeslot_id, 
            booking_date: date, 
            booking_type,
            week_start_date
          }]);
          if (error) {
            if (error.code === '23505') continue; // Skip duplicate
            throw error;
          }
        }
      }

      res.json({ message: "Booking successful" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/my-bookings", authenticateToken, async (req: any, res) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        routes(route_name),
        pickup_points(pickup_name),
        shifts(shift_category),
        timeslots(time)
      `)
      .eq("employee_id", req.user.id)
      .order("booking_date", { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/my-bookings/today", authenticateToken, async (req: any, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        routes(route_name),
        pickup_points(pickup_name),
        shifts(shift_category),
        timeslots(time)
      `)
      .eq("employee_id", req.user.id)
      .eq("booking_date", today)
      .eq("status", "confirmed"); // Only show active bookings
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.get("/api/my-last-booking", authenticateToken, async (req: any, res) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_date,
        routes (route_name),
        pickup_points (pickup_name),
        timeslots (time)
      `)
      .eq("employee_id", req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    res.json(data || null);
  });

  app.post("/api/bookings/:id/cancel", authenticateToken, async (req: any, res) => {
    const { id } = req.params;
    const employee_id = req.user.id;

    const { error } = await supabase
      .from("bookings")
      .update({ status: 'cancelled' })
      .eq("id", id)
      .eq("employee_id", employee_id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Booking cancelled" });
  });

  // --- Admin Routes ---
  app.get("/api/admin/pickup-points", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { data, error } = await supabase
      .from("pickup_points")
      .select(`
        *,
        routes (route_name)
      `);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/admin/employees", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { data, error } = await supabase.from("employees").select("*").order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.get("/api/admin/bookings", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        employees (name, employee_code),
        routes (route_name),
        pickup_points (pickup_name),
        timeslots (time)
      `)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/admin/bookings/:id/status", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { status } = req.body;
    const { data, error } = await supabase.from("bookings").update({ status }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/admin/routes", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { route_name } = req.body;
    const { data, error } = await supabase.from("routes").insert([{ route_name }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/admin/routes/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { route_name } = req.body;
    const { data, error } = await supabase.from("routes").update({ route_name }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete("/api/admin/routes/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    // 1. Delete related bookings
    const { error: bookingError } = await supabase.from("bookings").delete().eq("route_id", id);
    if (bookingError) return res.status(500).json({ error: bookingError.message });

    // 2. Delete related pickup points
    const { error: pickupError } = await supabase.from("pickup_points").delete().eq("route_id", id);
    if (pickupError) return res.status(500).json({ error: pickupError.message });

    // 3. Delete the route
    const { error: routeError } = await supabase.from("routes").delete().eq("id", id);
    if (routeError) return res.status(500).json({ error: routeError.message });

    res.json({ message: "Route and related data deleted" });
  });

  app.post("/api/admin/pickup-points", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { route_id, pickup_name } = req.body;
    const { data, error } = await supabase.from("pickup_points").insert([{ route_id, pickup_name }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/admin/pickup-points/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { route_id, pickup_name } = req.body;
    const { data, error } = await supabase.from("pickup_points").update({ route_id, pickup_name }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete("/api/admin/pickup-points/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;

    // 1. Delete related bookings
    const { error: bookingError } = await supabase.from("bookings").delete().eq("pickup_point_id", id);
    if (bookingError) return res.status(500).json({ error: bookingError.message });

    // 2. Delete the pickup point
    const { error: pickupError } = await supabase.from("pickup_points").delete().eq("id", id);
    if (pickupError) return res.status(500).json({ error: pickupError.message });

    res.json({ message: "Pickup point and related bookings deleted" });
  });

  app.get("/api/admin/reports", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    
    const { startDate, endDate } = req.query;
    
    try {
      let query = supabase.from("bookings").select(`
        id,
        booking_date,
        status,
        route_id,
        routes (route_name),
        shift_id,
        shifts (shift_category),
        employee_id,
        employees (name, employee_code)
      `);

      if (startDate) {
        query = query.gte("booking_date", startDate);
      }
      if (endDate) {
        query = query.lte("booking_date", endDate);
      }

      const { data: bookings, error } = await query;
      
      if (error) throw error;

      const totalBookings = bookings.length;
      const noShows = bookings.filter(b => b.status === 'no_show').length;
      const cancelledBookingsData = bookings.filter(b => b.status === 'cancelled');
      const cancellations = cancelledBookingsData.length;
      
      const noShowRate = totalBookings > 0 ? ((noShows / totalBookings) * 100).toFixed(1) + '%' : '0%';
      const cancellationRate = totalBookings > 0 ? ((cancellations / totalBookings) * 100).toFixed(1) + '%' : '0%';

      // Monthly bookings
      const monthlyData: Record<string, number> = {};
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      
      bookings.forEach(b => {
        const date = new Date(b.booking_date);
        const month = monthNames[date.getMonth()];
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });
      
      // Keep only the months that have data, or show last 6 months
      const monthlyBookings = Object.keys(monthlyData).map(name => ({
        name,
        bookings: monthlyData[name]
      }));

      // Route popularity
      const routeData: Record<string, number> = {};
      bookings.forEach(b => {
        const routeName = (b.routes as any)?.route_name || 'ไม่ระบุ';
        routeData[routeName] = (routeData[routeName] || 0) + 1;
      });
      
      const routePopularity = Object.keys(routeData).map(name => ({
        name,
        users: routeData[name]
      })).sort((a, b) => b.users - a.users);

      // Shift usage
      const shiftData: Record<string, number> = {};
      bookings.forEach(b => {
        const shiftName = (b.shifts as any)?.shift_category || 'ไม่ระบุ';
        shiftData[shiftName] = (shiftData[shiftName] || 0) + 1;
      });
      
      const shiftUsage = Object.keys(shiftData).map(name => ({
        name,
        value: shiftData[name]
      }));

      res.json({
        summary: {
          totalBookings,
          noShows,
          cancellations,
          noShowRate,
          cancellationRate
        },
        monthlyBookings,
        routePopularity,
        shiftUsage,
        cancelledBookings: cancelledBookingsData.map(b => ({
          id: b.id,
          date: b.booking_date,
          employeeName: (b.employees as any)?.name || 'ไม่ระบุ',
          employeeCode: (b.employees as any)?.employee_code || 'ไม่ระบุ',
          routeName: (b.routes as any)?.route_name || 'ไม่ระบุ'
        }))
      });
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/reports/export", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    
    const { startDate, endDate } = req.query;
    
    try {
      let query = supabase.from("bookings").select(`
        id,
        booking_date,
        status,
        routes (route_name),
        pickup_points (pickup_name),
        employees (name, department, phone)
      `);

      if (startDate) {
        query = query.gte("booking_date", startDate);
      }
      if (endDate) {
        query = query.lte("booking_date", endDate);
      }

      const { data: bookings, error } = await query;
      
      if (error) throw error;

      res.json(bookings);
    } catch (error: any) {
      console.error("Error exporting reports:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/stats", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    
    const today = new Date().toISOString().split('T')[0];
    
    const { count: todayBookingsCount, error: bookingsError } = await supabase.from("bookings").select("*", { count: 'exact', head: true }).eq("booking_date", today);
    const { count: totalEmployees } = await supabase.from("employees").select("*", { count: 'exact', head: true });
    
    // Popular routes - manual aggregation
    const { data: routeBookings, error: routeError } = await supabase
      .from("bookings")
      .select("route_id");
    
    let popularRoutes: any[] = [];
    if (!routeError && routeBookings) {
      const counts: Record<string, number> = {};
      routeBookings.forEach(b => {
        counts[b.route_id] = (counts[b.route_id] || 0) + 1;
      });
      
      const sortedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
      
      const { data: routesData } = await supabase
        .from("routes")
        .select("id, route_name")
        .in("id", sortedIds);

      if (routesData) {
        popularRoutes = sortedIds.map(id => {
          const route = routesData.find(r => r.id === id);
          return { route_name: route?.route_name || 'Unknown', count: counts[id] };
        });
      }
    }
    
    const { data: recentBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        booking_date,
        employees (name, employee_code),
        routes (route_name),
        timeslots (time),
        shifts (shift_category)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: todayBookingsData } = await supabase
      .from("bookings")
      .select(`
        shifts(shift_category),
        booking_type
      `)
      .eq("booking_date", today);
    
    const { data: recentChanges } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        created_at,
        booking_date,
        booking_type,
        employees (name),
        routes (route_name),
        timeslots (time),
        shifts (shift_category)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    const statsData = {
      todayBookings: todayBookingsCount || 0,
      totalEmployees: totalEmployees || 0,
      popularRoutes: popularRoutes || [],
      recentBookings: recentBookings || [],
      recentChanges: recentChanges || [],
      shiftStats: {
        morning: todayBookingsData?.filter(b => (b.shifts as any)?.shift_category?.includes('เช้า')).length || 0,
        evening: todayBookingsData?.filter(b => (b.shifts as any)?.shift_category?.includes('ดึก')).length || 0,
      },
      typeStats: {
        pickup: todayBookingsData?.filter(b => (b.shifts as any)?.shift_category?.includes('รับ')).length || 0,
        dropoff: todayBookingsData?.filter(b => (b.shifts as any)?.shift_category?.includes('ส่ง')).length || 0,
      }
    };

    res.json(statsData);
  });

  // --- Shift & Timeslot Management ---
  app.post("/api/admin/shifts", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { shift_category } = req.body;
    const { data, error } = await supabase.from("shifts").insert([{ shift_category }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/admin/shifts/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { shift_category } = req.body;
    const { data, error } = await supabase.from("shifts").update({ shift_category }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete("/api/admin/shifts/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    
    // Delete related timeslots and bookings first
    const { data: timeslots } = await supabase.from("timeslots").select("id").eq("shift_id", id);
    if (timeslots && timeslots.length > 0) {
      const tsIds = timeslots.map(t => t.id);
      await supabase.from("bookings").delete().in("timeslot_id", tsIds);
      await supabase.from("timeslots").delete().in("id", tsIds);
    }
    
    const { error } = await supabase.from("shifts").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Shift and related data deleted" });
  });

  app.post("/api/admin/timeslots", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { shift_id, time, capacity } = req.body;
    const { data, error } = await supabase.from("timeslots").insert([{ shift_id, time, capacity }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.put("/api/admin/timeslots/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    const { shift_id, time, capacity } = req.body;
    const { data, error } = await supabase.from("timeslots").update({ shift_id, time, capacity }).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.delete("/api/admin/timeslots/:id", authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    await supabase.from("bookings").delete().eq("timeslot_id", id);
    const { error } = await supabase.from("timeslots").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: "Timeslot and related bookings deleted" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
