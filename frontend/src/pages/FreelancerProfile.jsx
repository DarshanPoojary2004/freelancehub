import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getUserProfile, createHiringRequest } from "../services/apiService";
import "./FreelancerProfile.css";

function FreelancerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [freelancer, setFreelancer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hire Modal
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireForm, setHireForm] = useState({
    project_title: "",
    message: "",
    budget: "$3,000 - $5,000"
  });
  const [submittingHire, setSubmittingHire] = useState(false);
  const [hireMessage, setHireMessage] = useState({ text: "", type: "" });

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const isOwner = currentUser && String(currentUser.id) === String(id);
  const isClient = currentUser && (currentUser.accountType === "client" || currentUser.account_type === "client");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getUserProfile(id);
        setFreelancer(data);
      } catch (err) {
        setError(err.message || "Failed to load freelancer profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const openHireModal = () => {
    if (!currentUser) {
      navigate("/login", { state: { successMessage: "Please log in to hire a freelancer." } });
      return;
    }

    if (!isClient) {
      alert("Only Client accounts can send direct hiring requests.");
      return;
    }

    setHireForm({
      project_title: "Web & Mobile Development Project",
      message: `Hi ${freelancer.full_name},\n\nWe love your resume and projects in ${(freelancer.skills || []).slice(0, 3).join(", ") || "software engineering"}. We would like to hire you for our project.`,
      budget: freelancer.hourly_rate ? `${freelancer.hourly_rate}` : "$4,000"
    });
    setHireMessage({ text: "", type: "" });
    setShowHireModal(true);
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (!hireForm.project_title.trim() || !hireForm.message.trim()) {
      setHireMessage({ text: "Please fill in all fields", type: "error" });
      return;
    }

    setSubmittingHire(true);
    setHireMessage({ text: "", type: "" });

    try {
      await createHiringRequest({
        freelancer_id: freelancer.id,
        project_title: hireForm.project_title,
        message: hireForm.message,
        budget: hireForm.budget
      });

      setHireMessage({
        text: `Hiring offer sent successfully to ${freelancer.full_name}! They can accept or respond via their dashboard.`,
        type: "success"
      });

      setTimeout(() => {
        setShowHireModal(false);
        setHireMessage({ text: "", type: "" });
      }, 1800);
    } catch (err) {
      setHireMessage({ text: err.message || "Failed to send request", type: "error" });
    } finally {
      setSubmittingHire(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading-container">
        <div className="status-box">Loading professional profile & resume...</div>
      </div>
    );
  }

  if (error || !freelancer) {
    return (
      <div className="profile-loading-container">
        <div className="error-box">✗ {error || "Freelancer not found"}</div>
        <Link to="/hire-talent" className="btn-primary" style={{ display: "inline-block", marginTop: "16px" }}>
          Back to Freelancers
        </Link>
      </div>
    );
  }

  // Parse structured data safely
  const educationList = Array.isArray(freelancer.education)
    ? freelancer.education
    : (typeof freelancer.education === "string" ? JSON.parse(freelancer.education || "[]") : []);

  const experienceList = Array.isArray(freelancer.experience_history)
    ? freelancer.experience_history
    : (typeof freelancer.experience_history === "string" ? JSON.parse(freelancer.experience_history || "[]") : []);

  const showcaseProjects = freelancer.projects || [];

  return (
    <div className="freelancer-profile-page">
      <div className="profile-top-bar">
        <div className="profile-container">
          <Link to="/hire-talent" className="back-link">
            ← Back to All Freelancers
          </Link>
        </div>
      </div>

      <div className="profile-container">
        {/* Main Resume Card */}
        <div className="resume-sheet">
          {/* Header Banner */}
          <div className="resume-header">
            <div className="resume-avatar-wrapper">
              {freelancer.avatar_url ? (
                <img src={freelancer.avatar_url} alt={freelancer.full_name} className="resume-avatar-img" />
              ) : (
                <div className="resume-avatar-initials">
                  {freelancer.full_name?.charAt(0) || "F"}
                </div>
              )}
            </div>

            <div className="resume-header-info">
              <div className="name-row">
                <h1>{freelancer.full_name}</h1>
                <span className="availability-badge">
                  ● {freelancer.availability || "Available for hire"}
                </span>
              </div>
              <h2 className="profile-hero-title">{freelancer.profile_title || "Freelancer Professional"}</h2>

              <div className="resume-meta-chips">
                <span className="meta-chip">📍 {freelancer.location || "Remote"}</span>
                <span className="meta-chip">💰 {freelancer.hourly_rate || "$60/hr"}</span>
                <span className="meta-chip">⏳ {freelancer.experience_years || 3}+ Years Experience</span>
                <span className="meta-chip">⭐ 4.9 Rating</span>
              </div>
            </div>

            <div className="resume-cta-block">
              {isOwner ? (
                <Link to="/profile/edit" className="btn-edit-resume">
                  ✏️ Edit My Resume
                </Link>
              ) : (
                <button type="button" className="btn-hire-primary" onClick={openHireModal}>
                  Hire {freelancer.full_name?.split(" ")[0] || "Freelancer"}
                </button>
              )}
            </div>
          </div>

          <div className="resume-body-grid">
            {/* Left Main Column */}
            <div className="resume-left-col">
              {/* Professional Bio */}
              <section className="resume-section">
                <h3 className="section-title">About & Professional Bio</h3>
                <p className="resume-bio-text">
                  {freelancer.bio || "Passionate and dedicated freelance professional with a proven track record of delivering top-tier solutions on time and within budget."}
                </p>
              </section>

              {/* Showcase Projects / Portfolio */}
              <section className="resume-section">
                <h3 className="section-title">Portfolio & Showcase Projects ({showcaseProjects.length})</h3>
                {showcaseProjects.length === 0 ? (
                  <p className="empty-text">No portfolio projects listed yet.</p>
                ) : (
                  <div className="showcase-projects-grid">
                    {showcaseProjects.map((proj) => (
                      <div key={proj.id} className="project-showcase-item">
                        <div className="proj-item-header">
                          <h4>{proj.title}</h4>
                          {proj.role && <span className="proj-role-tag">{proj.role}</span>}
                        </div>
                        <p className="proj-desc">{proj.description}</p>

                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="proj-tech-stack">
                            {proj.technologies.map((t, idx) => (
                              <span key={idx} className="tech-badge">{t}</span>
                            ))}
                          </div>
                        )}

                        <div className="proj-links-row">
                          {proj.project_url && (
                            <a href={proj.project_url} target="_blank" rel="noreferrer" className="proj-link-btn">
                              🔗 Live Demo
                            </a>
                          )}
                          {proj.github_url && (
                            <a href={proj.github_url} target="_blank" rel="noreferrer" className="proj-link-btn secondary">
                              🐙 GitHub Repo
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Work Experience Timeline */}
              <section className="resume-section">
                <h3 className="section-title">Work Experience</h3>
                {experienceList.length === 0 ? (
                  <p className="empty-text">No previous work experience entries added.</p>
                ) : (
                  <div className="experience-timeline">
                    {experienceList.map((exp, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <div className="exp-top-row">
                            <h4>{exp.role}</h4>
                            <span className="exp-duration">{exp.duration}</span>
                          </div>
                          <p className="exp-company">{exp.company}</p>
                          <p className="exp-desc">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Sidebar Column */}
            <div className="resume-right-col">
              {/* Programming Languages */}
              <section className="resume-sidebar-card">
                <h4>Programming Languages</h4>
                <div className="skills-badge-wrap">
                  {(freelancer.languages || ["JavaScript", "Python", "SQL", "HTML5", "CSS3"]).map((lang, idx) => (
                    <span key={idx} className="lang-badge-pill">{lang}</span>
                  ))}
                </div>
              </section>

              {/* Technologies & Frameworks */}
              <section className="resume-sidebar-card">
                <h4>Technologies & Frameworks</h4>
                <div className="skills-badge-wrap">
                  {(freelancer.frameworks || ["React", "Node.js", "Express", "PostgreSQL", "Tailwind CSS"]).map((fw, idx) => (
                    <span key={idx} className="fw-badge-pill">{fw}</span>
                  ))}
                </div>
              </section>

              {/* Main Skills */}
              <section className="resume-sidebar-card">
                <h4>Core Skills & Expertise</h4>
                <div className="skills-badge-wrap">
                  {(freelancer.skills || ["Web Development", "API Design", "Architecture"]).map((sk, idx) => (
                    <span key={idx} className="skill-badge-pill">{sk}</span>
                  ))}
                </div>
              </section>

              {/* Services Offered */}
              <section className="resume-sidebar-card">
                <h4>Services Offered</h4>
                <ul className="services-bullet-list">
                  {(freelancer.services || [
                    "Full Stack Web Development",
                    "Custom API & Backend Architecture",
                    "Database Optimization",
                    "UI/UX Implementation"
                  ]).map((service, idx) => (
                    <li key={idx}>✓ {service}</li>
                  ))}
                </ul>
              </section>

              {/* Education */}
              <section className="resume-sidebar-card">
                <h4>Education</h4>
                {educationList.length === 0 ? (
                  <p className="empty-text">No education entries added.</p>
                ) : (
                  <div className="education-list">
                    {educationList.map((edu, idx) => (
                      <div key={idx} className="edu-entry">
                        <h5>{edu.degree}</h5>
                        <p className="edu-uni">{edu.university}</p>
                        <p className="edu-year">Graduated: {edu.year}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Hire Modal */}
      {showHireModal && (
        <div className="modal-overlay" onClick={() => setShowHireModal(false)}>
          <div className="modal-content hire-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Hire {freelancer.full_name}</h2>
                <p className="modal-subheading">{freelancer.profile_title} • {freelancer.hourly_rate}</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setShowHireModal(false)}>✕</button>
            </div>

            <form onSubmit={handleHireSubmit}>
              <div className="modal-body">
                {hireMessage.text && (
                  <div className={hireMessage.type === "success" ? "success-message" : "error-message"}>
                    {hireMessage.type === "success" ? "✓" : "✗"} {hireMessage.text}
                  </div>
                )}

                <div className="form-group">
                  <label>Project Name / Position Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Web Platform Development"
                    value={hireForm.project_title}
                    onChange={(e) => setHireForm({ ...hireForm, project_title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Proposed Rate / Budget</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $4,500 Fixed Price or $85/hr"
                    value={hireForm.budget}
                    onChange={(e) => setHireForm({ ...hireForm, budget: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Message & Scope of Work</label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Describe your project, timeline, deliverables, and expectations..."
                    value={hireForm.message}
                    onChange={(e) => setHireForm({ ...hireForm, message: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowHireModal(false)}
                  disabled={submittingHire}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-hire-primary"
                  disabled={submittingHire}
                >
                  {submittingHire ? "Sending Offer..." : "Send Hiring Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FreelancerProfile;
