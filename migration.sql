-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Create Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dni TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  who_picks_up TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

-- Create Devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  imei TEXT NOT NULL DEFAULT '',
  serial_number TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  condition TEXT NOT NULL DEFAULT '',
  lock_type TEXT NOT NULL DEFAULT '',
  lock_value TEXT NOT NULL DEFAULT ''
);

-- Create Repair Orders table
CREATE TABLE IF NOT EXISTS repair_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  device_id UUID NOT NULL REFERENCES devices(id),
  status TEXT NOT NULL DEFAULT 'recibido',
  problem TEXT NOT NULL DEFAULT '',
  diagnosis TEXT NOT NULL DEFAULT '',
  solution TEXT NOT NULL DEFAULT '',
  technician_name TEXT NOT NULL DEFAULT '',
  estimated_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  final_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal',
  notes TEXT NOT NULL DEFAULT ''
);

-- Add intake_checklist column to repair_orders if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_orders' AND column_name = 'intake_checklist') THEN
        ALTER TABLE repair_orders ADD COLUMN intake_checklist JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES repair_orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT NOT NULL DEFAULT ''
);
