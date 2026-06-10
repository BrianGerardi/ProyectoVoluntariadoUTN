-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enum for user roles
CREATE TYPE user_role AS ENUM ('volunteer', 'admin', 'coordinator');

-- Enum for emergency status
CREATE TYPE emergency_status AS ENUM ('active', 'contained', 'resolved', 'closed');

-- Enum for emergency urgency
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'volunteer',
    phone TEXT,
    city TEXT, -- Ciudad/Localidad de residencia
    province TEXT, -- Provincia de residencia
    skills TEXT[], -- Array of skills (e.g., 'first_aid', 'driving')
    availability JSONB, -- Flexible schedule/availability
    metadata JSONB DEFAULT '{}', -- Additional flexible data (NoSQL style)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Emergencies table
CREATE TABLE emergencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- e.g., 'flood', 'fire', 'earthquake'
    status emergency_status DEFAULT 'active',
    urgency urgency_level DEFAULT 'medium',
    location GEOGRAPHY(POINT) NOT NULL, -- PostGIS for geolocation
    address TEXT,
    required_resources JSONB, -- List of resources/skills needed
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer Assignments / Postulations
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_id UUID REFERENCES emergencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'completed', 'cancelled'
    assigned_task TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(emergency_id, user_id)
);

-- Messages / Internal Communication
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_id UUID REFERENCES emergencies(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- For coordinates or file links
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance
CREATE INDEX idx_emergencies_location ON emergencies USING GIST (location);
CREATE INDEX idx_users_skills ON users USING GIN (skills);
CREATE INDEX idx_messages_emergency ON messages(emergency_id);
