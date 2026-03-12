# Employee Shuttle Booking System - Supabase SQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  department TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'employee', -- 'admin' or 'employee'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup Points table
CREATE TABLE pickup_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  pickup_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_category TEXT NOT NULL, -- 'Morning Shift', 'Night Shift'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timeslots table
CREATE TABLE timeslots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  route_id UUID REFERENCES routes(id),
  pickup_point_id UUID REFERENCES pickup_points(id),
  shift_id UUID REFERENCES shifts(id),
  timeslot_id UUID REFERENCES timeslots(id),
  booking_date DATE NOT NULL,
  booking_type TEXT NOT NULL, -- 'Single', 'Weekly'
  booking_day TEXT, -- 'Monday', etc.
  week_start_date DATE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, booking_date, timeslot_id)
);

-- Indexes for performance
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_employee ON bookings(employee_id);

-- RPC for popular routes
CREATE OR REPLACE FUNCTION get_popular_routes()
RETURNS TABLE (route_name TEXT, booking_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.route_name, COUNT(b.id) as booking_count
  FROM routes r
  LEFT JOIN bookings b ON r.id = b.route_id
  GROUP BY r.route_name
  ORDER BY booking_count DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Initial Data
INSERT INTO shifts (shift_category) VALUES ('Morning Shift'), ('Night Shift');

-- Example Routes (Optional)
-- INSERT INTO routes (route_name) VALUES ('สาย A (พระราม 2)'), ('สาย B (บางนา)'), ('สาย C (รังสิต)');
