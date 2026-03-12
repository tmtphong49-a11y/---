export interface Employee {
  id: string;
  employee_code: string;
  name: string;
  position: string;
  department: string;
  phone: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export interface Route {
  id: string;
  route_name: string;
}

export interface PickupPoint {
  id: string;
  route_id: string;
  pickup_name: string;
}

export interface Shift {
  id: string;
  shift_category: string;
}

export interface Timeslot {
  id: string;
  shift_id: string;
  time: string;
  capacity: number;
}

export interface Booking {
  id: string;
  employee_id: string;
  route_id: string;
  pickup_point_id: string;
  shift_id: string;
  timeslot_id: string;
  booking_date: string;
  booking_type: 'Single' | 'Weekly';
  booking_day?: string;
  week_start_date?: string;
  status: string;
  created_at: string;
  routes?: { route_name: string };
  pickup_points?: { pickup_name: string };
  shifts?: { shift_category: string };
  timeslots?: { time: string };
}
