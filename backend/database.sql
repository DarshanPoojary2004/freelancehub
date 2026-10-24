CREATE DATABASE freelancehub;

\c freelancehub;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('freelancer', 'client')),
  profile_title VARCHAR(120) DEFAULT '',
  bio TEXT DEFAULT '',
  location VARCHAR(100) DEFAULT 'Remote',
  avatar_url TEXT DEFAULT '',
  hourly_rate VARCHAR(50) DEFAULT '$60/hr',
  availability VARCHAR(50) DEFAULT 'Available',
  experience_years INT DEFAULT 3,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  frameworks TEXT[] DEFAULT ARRAY[]::TEXT[],
  services TEXT[] DEFAULT ARRAY[]::TEXT[],
  education JSONB DEFAULT '[]'::jsonb,
  experience_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  client_id INT REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(80) NOT NULL,
  budget VARCHAR(80) NOT NULL,
  client_name VARCHAR(120) NOT NULL,
  skills_required TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(40) NOT NULL DEFAULT 'Open',
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS freelancer_projects (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  technologies TEXT[] DEFAULT ARRAY[]::TEXT[],
  role VARCHAR(100) DEFAULT 'Lead Developer',
  project_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT NOT NULL,
  bid_amount VARCHAR(50) NOT NULL,
  estimated_days INT DEFAULT 7,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_freelancer_project_proposal UNIQUE (project_id, freelancer_id)
);

CREATE TABLE IF NOT EXISTS hiring_requests (
  id SERIAL PRIMARY KEY,
  client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  freelancer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  budget VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users (account_type);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects (category);
CREATE INDEX IF NOT EXISTS idx_freelancer_projects_user ON freelancer_projects (user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals (project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_freelancer ON proposals (freelancer_id);
CREATE INDEX IF NOT EXISTS idx_hiring_client ON hiring_requests (client_id);
CREATE INDEX IF NOT EXISTS idx_hiring_freelancer ON hiring_requests (freelancer_id);