import bcrypt from 'bcryptjs';
import { ensureDatabaseExists, query } from './database.js';

export const initializeDatabase = async () => {
  try {
    await ensureDatabaseExists();

    // 1. Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('freelancer', 'client')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Extend Users Table with Rich Profile Columns
    await query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS profile_title VARCHAR(120) DEFAULT '',
        ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Remote',
        ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS hourly_rate VARCHAR(50) DEFAULT '$60/hr',
        ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'Available',
        ADD COLUMN IF NOT EXISTS experience_years INT DEFAULT 3,
        ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT ARRAY[]::TEXT[],
        ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY[]::TEXT[],
        ADD COLUMN IF NOT EXISTS frameworks TEXT[] DEFAULT ARRAY[]::TEXT[],
        ADD COLUMN IF NOT EXISTS services TEXT[] DEFAULT ARRAY[]::TEXT[],
        ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS experience_history JSONB DEFAULT '[]'::jsonb;
    `);

    // 3. Projects Table
    await query(`
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
    `);

    // Ensure columns exist on projects in case table pre-existed
    await query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS client_id INT REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS skills_required TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);

    // 4. Freelancer Showcase Projects Table
    await query(`
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
    `);

    // 5. Proposals Table (Freelancer applications for projects)
    await query(`
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
    `);

    // 6. Hiring Requests Table (Client direct hire offers)
    await query(`
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
    `);

    // Indices for performant querying
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_account_type ON users (account_type);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_projects_category ON projects (category);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_freelancer_projects_user ON freelancer_projects (user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_proposals_project ON proposals (project_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_proposals_freelancer ON proposals (freelancer_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_hiring_client ON hiring_requests (client_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_hiring_freelancer ON hiring_requests (freelancer_id);`);

    // Seed Sample Freelancers with Rich Resumes
    const sampleUsers = [
      {
        full_name: 'Alex Johnson',
        email: 'alex@freelancehub.com',
        password_hash: bcrypt.hashSync('password123', 10),
        account_type: 'freelancer',
        profile_title: 'Senior Full Stack Developer',
        bio: 'Passionate full stack software engineer with 6+ years of experience building high-performance web applications, scalable backend microservices, and modern frontend user experiences with React, Node.js, and PostgreSQL.',
        location: 'San Francisco, CA',
        hourly_rate: '$85/hr',
        availability: 'Available for full-time & contract',
        experience_years: 6,
        skills: ['Full Stack Development', 'API Design', 'Microservices', 'Database Architecture', 'Performance Optimization'],
        languages: ['JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML5', 'CSS3'],
        frameworks: ['React', 'Node.js', 'Express', 'Next.js', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'Redis'],
        services: ['Full Stack Web Application Development', 'Custom API & Backend Architecture', 'Database Design & Optimization', 'React & Next.js Frontend Development'],
        education: JSON.stringify([
          { degree: 'B.S. in Computer Science', university: 'University of California, Berkeley', year: '2019' }
        ]),
        experience_history: JSON.stringify([
          {
            role: 'Senior Full Stack Engineer',
            company: 'TechFlow Innovations',
            duration: '2021 - Present',
            description: 'Architected scalable SaaS web applications serving 100k+ active users. Integrated payment gateways, Redis caching, and real-time websockets.'
          },
          {
            role: 'Full Stack Developer',
            company: 'Nexus Software Studio',
            duration: '2019 - 2021',
            description: 'Developed responsive client portals with React and built REST APIs with Node.js and PostgreSQL.'
          }
        ]),
        portfolio_projects: [
          {
            title: 'CloudScale - Cloud Resource Monitor',
            description: 'A real-time DevOps infrastructure monitoring dashboard featuring live analytics, alerting system, and automated scaling triggers.',
            technologies: ['React', 'Node.js', 'PostgreSQL', 'Socket.io', 'Tailwind CSS'],
            role: 'Lead Full Stack Architect',
            project_url: 'https://cloudscale-demo.io',
            github_url: 'https://github.com/alexjohnson/cloudscale'
          },
          {
            title: 'ShopFlow - Headless E-commerce Storefront',
            description: 'High converting, lightning fast headless e-commerce storefront with Stripe checkout and product recommendation engine.',
            technologies: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Stripe'],
            role: 'Full Stack Developer',
            project_url: 'https://shopflow-demo.io',
            github_url: 'https://github.com/alexjohnson/shopflow'
          }
        ]
      },
      {
        full_name: 'Sarah Smith',
        email: 'sarah@freelancehub.com',
        password_hash: bcrypt.hashSync('password123', 10),
        account_type: 'freelancer',
        profile_title: 'UI/UX Designer & Product Strategist',
        bio: 'Product designer obsessed with crafting delightful, conversion-focused user interfaces and cohesive design systems for high-growth tech startups and e-commerce brands.',
        location: 'New York, NY',
        hourly_rate: '$70/hr',
        availability: 'Available for contract & part-time',
        experience_years: 5,
        skills: ['UI/UX Design', 'Design Systems', 'User Research', 'Wireframing', 'Prototyping', 'Usability Testing'],
        languages: ['HTML5', 'CSS3', 'JavaScript'],
        frameworks: ['Figma', 'Adobe XD', 'Tailwind CSS', 'Framer', 'React'],
        services: ['Mobile & Web UI/UX Design', 'Design System Creation & Audits', 'Interactive Prototyping', 'User Research & Wireframing'],
        education: JSON.stringify([
          { degree: 'B.F.A. in Graphic & Interactive Design', university: 'Rhode Island School of Design', year: '2020' }
        ]),
        experience_history: JSON.stringify([
          {
            role: 'Lead UI/UX Designer',
            company: 'Vanguard Digital Agency',
            duration: '2022 - Present',
            description: 'Led end-to-end design for 20+ consumer and B2B SaaS applications, increasing user activation by 35%.'
          },
          {
            role: 'Product Designer',
            company: 'PixelCraft Interactive',
            duration: '2020 - 2022',
            description: 'Designed cross-platform mobile apps and established the company core design system.'
          }
        ]),
        portfolio_projects: [
          {
            title: 'FinEase - Fintech Mobile App & Design System',
            description: 'Complete UI/UX design and comprehensive Figma design system for a consumer budgeting and micro-investment app.',
            technologies: ['Figma', 'Prototyping', 'Design System', 'UI/UX'],
            role: 'Principal Designer',
            project_url: 'https://figma.com/@sarahsmith/finease',
            github_url: ''
          },
          {
            title: 'HealthPulse - Telehealth Patient Portal',
            description: 'Clean, accessible, and intuitive patient appointment booking and video consultation interface.',
            technologies: ['Figma', 'User Research', 'Framer', 'Design Systems'],
            role: 'Lead Product Designer',
            project_url: 'https://healthpulse-preview.framer.website',
            github_url: ''
          }
        ]
      },
      {
        full_name: 'David Kumar',
        email: 'david@freelancehub.com',
        password_hash: bcrypt.hashSync('password123', 10),
        account_type: 'freelancer',
        profile_title: 'Mobile App Developer (Flutter & React Native)',
        bio: 'Specialized mobile application engineer building smooth 60fps iOS and Android applications with Flutter and React Native. Experienced in offline-first sync, push notifications, and store deployment.',
        location: 'Austin, TX',
        hourly_rate: '$75/hr',
        availability: 'Available immediately',
        experience_years: 4,
        skills: ['Mobile App Development', 'Cross-Platform Development', 'State Management', 'Native Device APIs', 'App Store Publishing'],
        languages: ['Dart', 'JavaScript', 'TypeScript', 'Kotlin', 'Swift'],
        frameworks: ['Flutter', 'React Native', 'Firebase', 'Node.js', 'Redux Toolkit'],
        services: ['iOS & Android App Development', 'Cross-Platform Flutter Apps', 'Mobile App Redesign & Performance Optimization', 'Backend API Integration'],
        education: JSON.stringify([
          { degree: 'B.Tech in Computer Engineering', university: 'University of Texas, Austin', year: '2021' }
        ]),
        experience_history: JSON.stringify([
          {
            role: 'Senior Mobile Engineer',
            company: 'AppVerse Technologies',
            duration: '2022 - Present',
            description: 'Built and published 5+ Flutter and React Native applications with 500k+ downloads on iOS App Store & Google Play.'
          }
        ]),
        portfolio_projects: [
          {
            title: 'FitTrack Pro - Fitness & Workout Planner',
            description: 'Cross-platform mobile app for workout tracking with Apple Health and Google Fit synchronization.',
            technologies: ['Flutter', 'Dart', 'Firebase', 'HealthKit'],
            role: 'Lead Mobile Developer',
            project_url: 'https://fittrack-app.io',
            github_url: 'https://github.com/davidkumar/fittrack-pro'
          }
        ]
      }
    ];

    for (const user of sampleUsers) {
      const userRes = await query(
        `INSERT INTO users (
          full_name, email, password_hash, account_type, profile_title, bio, location,
          hourly_rate, availability, experience_years, skills, languages, frameworks, services,
          education, experience_history
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          profile_title = EXCLUDED.profile_title,
          bio = EXCLUDED.bio,
          location = EXCLUDED.location,
          hourly_rate = EXCLUDED.hourly_rate,
          availability = EXCLUDED.availability,
          experience_years = EXCLUDED.experience_years,
          skills = EXCLUDED.skills,
          languages = EXCLUDED.languages,
          frameworks = EXCLUDED.frameworks,
          services = EXCLUDED.services,
          education = EXCLUDED.education,
          experience_history = EXCLUDED.experience_history
        RETURNING id`,
        [
          user.full_name,
          user.email,
          user.password_hash,
          user.account_type,
          user.profile_title,
          user.bio,
          user.location,
          user.hourly_rate,
          user.availability,
          user.experience_years,
          user.skills,
          user.languages,
          user.frameworks,
          user.services,
          user.education,
          user.experience_history
        ]
      );

      const userId = userRes.rows[0]?.id;
      if (userId && user.portfolio_projects && user.portfolio_projects.length > 0) {
        for (const proj of user.portfolio_projects) {
          const existingProj = await query(
            'SELECT id FROM freelancer_projects WHERE user_id = $1 AND title = $2',
            [userId, proj.title]
          );
          if (existingProj.rowCount === 0) {
            await query(
              `INSERT INTO freelancer_projects (user_id, title, description, technologies, role, project_url, github_url)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [userId, proj.title, proj.description, proj.technologies, proj.role, proj.project_url, proj.github_url]
            );
          }
        }
      }
    }

    // Seed Sample Client & Projects if not existing
    const sampleClient = {
      full_name: 'TechStart Enterprise',
      email: 'client@techstart.io',
      password_hash: bcrypt.hashSync('password123', 10),
      account_type: 'client',
      profile_title: 'VP of Engineering',
      bio: 'Leading high-growth technology ventures and hiring top tier freelance software talent.',
      location: 'Seattle, WA'
    };

    const clientRes = await query(
      `INSERT INTO users (full_name, email, password_hash, account_type, profile_title, bio, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [
        sampleClient.full_name,
        sampleClient.email,
        sampleClient.password_hash,
        sampleClient.account_type,
        sampleClient.profile_title,
        sampleClient.bio,
        sampleClient.location
      ]
    );
    const sampleClientId = clientRes.rows[0]?.id;

    const sampleProjects = [
      {
        title: 'E-commerce Platform Redesign & Full-Stack Migration',
        description: 'We are looking for an experienced Full Stack Developer to modernize our high-volume fashion e-commerce storefront. Responsibilities include migrating the frontend to React/Next.js, implementing performant checkout flows with Stripe, and optimizing PostgreSQL database queries for product filtering and search.',
        category: 'Web Development',
        budget: '$5,000 - $8,000',
        client_name: 'TechStart Enterprise',
        client_id: sampleClientId,
        skills_required: ['React', 'Node.js', 'PostgreSQL', 'Next.js', 'Stripe', 'Tailwind CSS'],
        status: 'Open'
      },
      {
        title: 'Mobile App UI/UX Design System for Fintech App',
        description: 'Need a talented UI/UX Designer to build a complete design system and 30+ responsive mobile screens in Figma for our next-generation investment mobile app. Must have experience with micro-interactions, dark/light mode tokens, and fintech user onboarding.',
        category: 'UI/UX Design',
        budget: '$3,000 - $5,000',
        client_name: 'Creative Studio Labs',
        client_id: sampleClientId,
        skills_required: ['Figma', 'UI/UX Design', 'Design Systems', 'Prototyping', 'User Research'],
        status: 'Open'
      },
      {
        title: 'Cross-Platform Fitness & Habit Tracker Mobile App',
        description: 'Seeking a mobile app developer to build a cross-platform Flutter/React Native application for wellness tracking. Needs local database storage (SQLite), push notifications, background sync, and integration with Apple HealthKit & Google Fit APIs.',
        category: 'Mobile Apps',
        budget: '$4,000 - $6,500',
        client_name: 'FitLife Innovations',
        client_id: sampleClientId,
        skills_required: ['Flutter', 'React Native', 'Mobile Development', 'Firebase', 'API Integration'],
        status: 'Open'
      },
      {
        title: 'SEO & Organic Growth Content Optimization Campaign',
        description: 'Looking for a digital marketing & SEO strategist to conduct complete on-page and technical SEO audits for our B2B SaaS platform, optimize key landing pages, and structure high-ranking technical content.',
        category: 'Digital Marketing',
        budget: '$1,500 - $2,500',
        client_name: 'Growth Accelerators',
        client_id: sampleClientId,
        skills_required: ['SEO', 'Content Strategy', 'Google Analytics', 'Digital Marketing'],
        status: 'Open'
      }
    ];

    for (const project of sampleProjects) {
      const existing = await query('SELECT id FROM projects WHERE title = $1', [project.title]);
      if (existing.rowCount === 0) {
        await query(
          `INSERT INTO projects (title, description, category, budget, client_name, client_id, skills_required, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            project.title,
            project.description,
            project.category,
            project.budget,
            project.client_name,
            project.client_id,
            project.skills_required,
            project.status
          ]
        );
      } else {
        await query(
          `UPDATE projects
           SET description = $1, category = $2, budget = $3, client_name = $4, client_id = $5, skills_required = $6, status = $7
           WHERE title = $8`,
          [
            project.description,
            project.category,
            project.budget,
            project.client_name,
            project.client_id,
            project.skills_required,
            project.status,
            project.title
          ]
        );
      }
    }

    console.log('✓ Database schema and seed data initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    throw error;
  }
};

export default initializeDatabase;
