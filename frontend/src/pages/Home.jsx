import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getProjects, getFreelancers } from "../services/apiService";
import "./Home.css";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [searchQuery, setSearchQuery] = useState("");
  const [dbFreelancers, setDbFreelancers] = useState([]);
  const [dbProjects, setDbProjects] = useState([]);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    window.addEventListener("auth:changed", syncUser);

    const loadHomeData = async () => {
      try {
        const [projectsRes, freelancersRes] = await Promise.allSettled([
          getProjects(),
          getFreelancers()
        ]);

        if (projectsRes.status === "fulfilled" && projectsRes.value?.length > 0) {
          setDbProjects(projectsRes.value.slice(0, 3));
        }
        if (freelancersRes.status === "fulfilled" && freelancersRes.value?.length > 0) {
          setDbFreelancers(freelancersRes.value.slice(0, 4));
        }
      } catch (e) {
        console.error("Error loading home data:", e);
      }
    };

    loadHomeData();

    return () => {
      window.removeEventListener("auth:changed", syncUser);
    };
  }, []);

  const role = (user?.accountType || user?.account_type || "").toLowerCase();
  const isClient = role === "client";
  const isFreelancer = role === "freelancer";

  const handleSearch = (e) => {
    e.preventDefault();
    if (isClient) {
      navigate(searchQuery.trim() ? `/hire-talent?search=${encodeURIComponent(searchQuery.trim())}` : "/hire-talent");
    } else {
      navigate(searchQuery.trim() ? `/find-work?search=${encodeURIComponent(searchQuery.trim())}` : "/find-work");
    }
  };

  const handleCategoryClick = (categoryName) => {
    if (isClient) {
      navigate(`/hire-talent?skill=${encodeURIComponent(categoryName)}`);
    } else {
      navigate(`/find-work?category=${encodeURIComponent(categoryName)}`);
    }
  };

  // Sample data for categories
  const categories = [
    { id: 1, name: "Web Development", icon: "💻", projects: 2840 },
    { id: 2, name: "UI/UX Design", icon: "🎨", projects: 1920 },
    { id: 3, name: "Mobile Apps", icon: "📱", projects: 1650 },
    { id: 4, name: "Digital Marketing", icon: "📊", projects: 1340 },
    { id: 5, name: "Content Writing", icon: "✍️", projects: 1780 },
    { id: 6, name: "Video Editing", icon: "🎬", projects: 890 },
    { id: 7, name: "Graphic Design", icon: "🖼️", projects: 1240 },
    { id: 8, name: "Data Science", icon: "📈", projects: 650 },
  ];

  // Default featured freelancers fallback
  const fallbackFreelancers = [
    {
      id: 2,
      full_name: "Alex Johnson",
      profile_title: "Senior Full Stack Developer",
      hourly_rate: "$85/hr",
      rating: 4.9,
      skills: ["React", "Node.js", "PostgreSQL"],
    },
    {
      id: 4,
      full_name: "Sarah Smith",
      profile_title: "UI/UX Designer & Strategist",
      hourly_rate: "$70/hr",
      rating: 4.8,
      skills: ["Figma", "Design Systems", "Prototyping"],
    },
    {
      id: 7,
      full_name: "David Kumar",
      profile_title: "Mobile App Developer",
      hourly_rate: "$75/hr",
      rating: 4.9,
      skills: ["Flutter", "React Native", "Firebase"],
    },
    {
      id: 1,
      full_name: "Emma Davis",
      profile_title: "Content Strategist & Copywriter",
      hourly_rate: "$50/hr",
      rating: 4.7,
      skills: ["Copywriting", "SEO", "Content Planning"],
    },
  ];

  // Default featured projects fallback
  const fallbackProjects = [
    {
      id: 1,
      title: "E-commerce Platform Redesign & Full-Stack Migration",
      client_name: "TechStart Enterprise",
      budget: "$5,000 - $8,000",
      category: "Web Development",
      status: "Open"
    },
    {
      id: 2,
      title: "Mobile App UI/UX Design System for Fintech App",
      client_name: "Creative Studio Labs",
      budget: "$3,000 - $5,000",
      category: "UI/UX Design",
      status: "Open"
    },
    {
      id: 3,
      title: "Cross-Platform Fitness & Habit Tracker Mobile App",
      client_name: "FitLife Innovations",
      budget: "$4,000 - $6,500",
      category: "Mobile Apps",
      status: "Open"
    },
  ];

  const displayFreelancers = dbFreelancers.length > 0 ? dbFreelancers : fallbackFreelancers;
  const displayProjects = dbProjects.length > 0 ? dbProjects : fallbackProjects;

  // Platform statistics
  const stats = [
    { label: "Active Users", value: "2.5M+" },
    { label: "Projects Completed", value: "150K+" },
    { label: "Total Earnings", value: "$500M+" },
    { label: "Countries", value: "180+" },
  ];

  // How it works steps
  const howItWorks = [
    {
      step: 1,
      title: "Post Your Project",
      description: "Clients describe project needs, required skills, and budget",
      icon: "📝"
    },
    {
      step: 2,
      title: "Review Proposals",
      description: "Get customized proposals from qualified top freelancers",
      icon: "👥"
    },
    {
      step: 3,
      title: "Hire & Collaborate",
      description: "Review freelancer resumes, send hire requests, and collaborate",
      icon: "🤝"
    },
    {
      step: 4,
      title: "Pay & Review",
      description: "Release payments securely and leave authentic ratings",
      icon: "⭐"
    },
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: "James Wilson",
      role: "Startup Founder (Client)",
      content: "FreelanceHub helped us find top talent quickly. The project was completed on time and exceeded our expectations!",
      rating: 5
    },
    {
      id: 2,
      name: "Lisa Rodriguez",
      role: "Senior UI Designer (Freelancer)",
      content: "As a freelancer, I've found consistent high-quality projects. The platform is user-friendly and payments are reliable.",
      rating: 5
    },
    {
      id: 3,
      name: "David Kumar",
      role: "Mobile App Developer (Freelancer)",
      content: "The vetting process ensures quality projects and serious clients. I have built long-term relationships with several teams.",
      rating: 5
    },
  ];

  return (
    <div className="home-page">
      {(location.state?.loginSuccessMessage || location.state?.logoutMessage) && (
        <div className="success-message" style={{ margin: "16px auto", maxWidth: "960px" }}>
          ✓ {location.state?.loginSuccessMessage || location.state?.logoutMessage}
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          {/* Dynamic Headline Based on Role */}
          {isClient ? (
            <>
              <h1 className="hero-title">
                Find & Hire Top Freelancers For Your Next Project
              </h1>
              <p className="hero-subtitle">
                Connect with skilled software engineers, designers, and specialists ready to bring your vision to life.
              </p>
              <div className="hero-buttons">
                <Link to="/hire-talent" className="btn btn-hero-blue">
                  Find Freelancers
                </Link>
                <Link to="/dashboard?tab=post-project" className="btn btn-hero-blue">
                  Post a Project
                </Link>
              </div>
            </>
          ) : isFreelancer ? (
            <>
              <h1 className="hero-title">
                Find High-Paying Freelance Work & Build Your Future
              </h1>
              <p className="hero-subtitle">
                Explore thousands of client projects, submit proposals, and showcase your professional portfolio.
              </p>
              <div className="hero-buttons">
                <Link to="/find-work" className="btn btn-hero-blue">
                  Find Work / Browse Projects
                </Link>
                <Link to="/dashboard?tab=proposals" className="btn btn-hero-blue">
                  My Applications & Offers
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-title">
                Find & Hire Top Freelancers For Your Next Project
              </h1>
              <p className="hero-subtitle">
                Connect with skilled professionals and get your projects done by talented experts. Available 24/7 for all your project needs.
              </p>
              <div className="hero-buttons">
                <Link to="/find-work" className="btn btn-hero-blue">
                  Find Work
                </Link>
                <Link to="/hire-talent" className="btn btn-hero-blue">
                  Hire Talent
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div className="search-container">
          <h2>
            {isClient
              ? "Search Top Freelance Talent by Skill or Role"
              : isFreelancer
              ? "Search Available Client Projects"
              : "What service or work are you looking for?"}
          </h2>
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder={
                isClient
                  ? "Search freelancers by skill (e.g. React, Python, UI/UX Design, Flutter)..."
                  : "Search projects by title, technology, or category..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              {isClient ? "Find Talent" : "Search"}
            </button>
          </form>
          <p className="search-hint">Popular: React, Node.js, UI/UX Design, Python, Flutter, SEO, PostgreSQL</p>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="categories-section" id="categories">
        <div className="section-container">
          <div className="section-header">
            <h2>Popular Categories</h2>
            <p>Browse our most in-demand services and skills</p>
          </div>
          <div className="categories-grid">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="category-card"
                onClick={() => handleCategoryClick(cat.name)}
                role="button"
                tabIndex={0}
              >
                <div className="category-icon">{cat.icon}</div>
                <h3>{cat.name}</h3>
                <p>{cat.projects.toLocaleString()} projects & specialists</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Freelancers (Client-focused) */}
      {(!isFreelancer || !user) && (
        <section className="freelancers-section">
          <div className="section-container">
            <div className="section-header">
              <h2>Featured Freelancers</h2>
              <p>Top-rated professionals ready to work on your projects</p>
            </div>
            <div className="freelancers-grid">
              {displayFreelancers.map((freelancer) => (
                <div key={freelancer.id} className="freelancer-card">
                  <div className="freelancer-avatar-circle">
                    {freelancer.full_name?.charAt(0) || "F"}
                  </div>
                  <h3>{freelancer.full_name || freelancer.name}</h3>
                  <p className="freelancer-title">{freelancer.profile_title || freelancer.title || "Freelancer"}</p>
                  <div className="freelancer-rating">
                    <span className="stars">⭐⭐⭐⭐⭐</span>
                    <span className="rating-value">{freelancer.rating || "4.9"}</span>
                  </div>
                  <p className="freelancer-rate">{freelancer.hourly_rate || freelancer.rate || "$60/hr"}</p>
                  <div className="freelancer-skills">
                    {(freelancer.skills || []).slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="skill-badge">{skill}</span>
                    ))}
                  </div>
                  <Link to={`/freelancers/${freelancer.id}`} className="hire-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                    View Profile & Resume
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Projects (Freelancer-focused) */}
      {(!isClient || !user) && (
        <section className="projects-section">
          <div className="section-container">
            <div className="section-header">
              <h2>Featured Client Projects</h2>
              <p>Active projects looking for talented freelance specialists</p>
            </div>
            <div className="projects-grid">
              {displayProjects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <h3>{project.title}</h3>
                    <span className="project-status">{project.status || "Open"}</span>
                  </div>
                  <p className="project-client">By {project.client_name || project.client || "Client"}</p>
                  <p className="project-category">{project.category}</p>
                  <p className="project-budget">{project.budget}</p>
                  <Link to="/find-work" className="view-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                    View & Apply
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Platform Statistics */}
      <section className="stats-section">
        <div className="section-container">
          <h2>Trusted by Millions Worldwide</h2>
          <div className="stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="stat-card">
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <h2>How FreelanceHub Works</h2>
            <p>Simple, transparent, and secure process for both Clients & Freelancers</p>
          </div>
          <div className="how-it-works-grid">
            {howItWorks.map((item) => (
              <div key={item.step} className="how-it-works-card">
                <div className="step-number">{item.step}</div>
                <div className="step-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-container">
          <div className="section-header">
            <h2>What Our Community Says</h2>
            <p>Join thousands of satisfied clients and freelancers</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="testimonial-card">
                <div className="testimonial-stars">
                  {'⭐'.repeat(testimonial.rating)}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <p className="author-name">{testimonial.name}</p>
                  <p className="author-role">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!user && (
        <section className="final-cta">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join our community of successful freelancers and clients today</p>
            <div className="cta-buttons">
              <Link to="/register?role=client" className="btn btn-hero-blue">
                Hire Talent as a Client
              </Link>
              <Link to="/register?role=freelancer" className="btn btn-hero-blue">
                Start as a Freelancer
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;
