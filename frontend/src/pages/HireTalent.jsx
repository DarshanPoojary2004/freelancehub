import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getFreelancers, createHiringRequest } from "../services/apiService";
import "./HireTalent.css";

const POPULAR_SKILLS = [
  "All",
  "React",
  "Node.js",
  "Python",
  "UI/UX Design",
  "Flutter",
  "TypeScript",
  "PostgreSQL",
  "Figma",
  "Next.js"
];

function HireTalent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState(searchParams.get("skill") || "All");

  // Direct Hire Modal State
  const [showHireModal, setShowHireModal] = useState(false);
  const [targetFreelancer, setTargetFreelancer] = useState(null);
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

  const userRole = (currentUser?.accountType || currentUser?.account_type || "").toLowerCase();
  const isClient = userRole === "client";
  const isFreelancer = userRole === "freelancer";

  const fetchFreelancersList = async () => {
    setLoading(true);
    setError("");
    try {
      const query = selectedSkillFilter !== "All" ? selectedSkillFilter : searchQuery;
      const data = await getFreelancers({ search: query });
      setFreelancers(data || []);
    } catch (err) {
      setError(err.message || "Unable to load freelancers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancersList();
  }, [selectedSkillFilter, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSelectedSkillFilter("All");
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    setSearchParams(params);
  };

  const handleSkillSelect = (skill) => {
    setSelectedSkillFilter(skill);
    setSearchQuery("");
    const params = new URLSearchParams();
    if (skill !== "All") params.set("skill", skill);
    setSearchParams(params);
  };

  const openHireModal = (freelancer) => {
    if (!currentUser) {
      navigate("/login", { state: { successMessage: "Please log in to hire a freelancer." } });
      return;
    }

    if (!isClient) {
      alert("Only Client accounts can send direct hiring requests. You are currently logged in as a Freelancer.");
      return;
    }

    setTargetFreelancer(freelancer);
    setHireForm({
      project_title: "Web & Mobile Development Project",
      message: `Hi ${freelancer.full_name},\n\nWe were impressed by your profile and skills in ${(freelancer.skills || []).slice(0, 3).join(", ") || "software development"}. We would love to discuss hiring you for an upcoming project.`,
      budget: "$3,000 - $5,000"
    });
    setHireMessage({ text: "", type: "" });
    setShowHireModal(true);
  };

  const handleHireSubmit = async (e) => {
    e.preventDefault();
    if (!hireForm.project_title.trim()) {
      setHireMessage({ text: "Project title is required", type: "error" });
      return;
    }
    if (!hireForm.message.trim()) {
      setHireMessage({ text: "Please enter a message for the freelancer", type: "error" });
      return;
    }

    setSubmittingHire(true);
    setHireMessage({ text: "", type: "" });

    try {
      await createHiringRequest({
        freelancer_id: targetFreelancer.id,
        project_title: hireForm.project_title,
        message: hireForm.message,
        budget: hireForm.budget
      });

      setHireMessage({
        text: `Hiring request sent to ${targetFreelancer.full_name}! They will be notified and can accept via their dashboard.`,
        type: "success"
      });

      setTimeout(() => {
        setShowHireModal(false);
        setTargetFreelancer(null);
        setHireMessage({ text: "", type: "" });
      }, 1800);
    } catch (err) {
      setHireMessage({ text: err.message || "Failed to send hiring request", type: "error" });
    } finally {
      setSubmittingHire(false);
    }
  };

  return (
    <div className="hire-talent-page">
      {/* Page Header */}
      <div className="page-header-banner hire-banner">
        <div className="page-header-content">
          <h1>Hire World-Class Freelance Talent</h1>
          <p>Discover vetted software developers, UI/UX designers, and tech experts ready to build your vision.</p>

          <form className="hire-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by skill, programming language, title, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="hire-search-btn">
              Search Freelancers
            </button>
          </form>
        </div>
      </div>

      <div className="hire-talent-container">
        {isFreelancer && (
          <div className="freelancer-role-banner" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px", color: "#6d28d9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <span>ℹ️ You are viewing talent as a <strong>Freelancer</strong>. To find available client projects and submit proposals, visit Find Work.</span>
            <Link to="/find-work" className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", textDecoration: "none" }}>
              Browse Find Work →
            </Link>
          </div>
        )}

        {/* Skills Filter Pills */}
        <div className="skill-filter-pills">
          {POPULAR_SKILLS.map((skill) => (
            <button
              key={skill}
              type="button"
              className={`skill-pill ${selectedSkillFilter === skill ? "active" : ""}`}
              onClick={() => handleSkillSelect(skill)}
            >
              {skill}
            </button>
          ))}
        </div>

        {/* Status Indicators */}
        {loading && <div className="status-box">Loading available top freelancers...</div>}
        {error && <div className="error-box">✗ {error}</div>}

        {/* Freelancers Grid */}
        {!loading && !error && (
          <div className="freelancers-feed">
            <div className="feed-header">
              <h2>Available Freelancers ({freelancers.length})</h2>
              {selectedSkillFilter !== "All" && (
                <span className="active-filter-badge">
                  Filtered by: <strong>{selectedSkillFilter}</strong>
                  <button type="button" onClick={() => handleSkillSelect("All")}>✕</button>
                </span>
              )}
            </div>

            {freelancers.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">👥</div>
                <h3>No freelancers found</h3>
                <p>Try searching for a different skill or language, or click "All" to view all freelancers.</p>
                <button type="button" className="btn-primary" onClick={() => handleSkillSelect("All")}>
                  Show All Freelancers
                </button>
              </div>
            ) : (
              <div className="freelancers-cards-grid">
                {freelancers.map((freelancer) => (
                  <article key={freelancer.id} className="freelancer-resume-card">
                    <div className="freelancer-card-header">
                      <div className="freelancer-avatar-badge">
                        {freelancer.avatar_url ? (
                          <img src={freelancer.avatar_url} alt={freelancer.full_name} className="avatar-img" />
                        ) : (
                          <div className="avatar-initials">
                            {freelancer.full_name?.charAt(0) || "F"}
                          </div>
                        )}
                        <span className="online-indicator" title="Available for work" />
                      </div>

                      <div className="freelancer-main-meta">
                        <h3 className="freelancer-name">{freelancer.full_name}</h3>
                        <p className="freelancer-title">{freelancer.profile_title || "Freelancer Professional"}</p>
                        <p className="freelancer-location">📍 {freelancer.location || "Remote"}</p>
                      </div>

                      <div className="freelancer-rate-box">
                        <span className="rate-amount">{freelancer.hourly_rate || "$60/hr"}</span>
                        <span className="rate-label">Hourly Rate</span>
                      </div>
                    </div>

                    <p className="freelancer-bio-snippet">
                      {freelancer.bio || "Experienced freelance professional ready to deliver top quality work on your projects."}
                    </p>

                    {/* Programming Languages */}
                    {freelancer.languages && freelancer.languages.length > 0 && (
                      <div className="card-languages-section">
                        <span className="meta-label">Languages:</span>
                        <div className="tags-row">
                          {freelancer.languages.slice(0, 4).map((lang, idx) => (
                            <span key={idx} className="lang-tag">{lang}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="card-skills-section">
                        <span className="meta-label">Skills & Frameworks:</span>
                        <div className="tags-row">
                          {freelancer.skills.slice(0, 4).map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="freelancer-card-footer">
                      <div className="freelancer-stats-chips">
                        <span className="chip">⭐ 4.9 (20+ reviews)</span>
                        <span className="chip">💼 {freelancer.completed_projects_count || 2}+ projects</span>
                        <span className="chip">⏳ {freelancer.experience_years || 3}+ yrs exp</span>
                      </div>

                      <div className="card-cta-buttons">
                        <Link to={`/freelancers/${freelancer.id}`} className="btn-outline-profile">
                          View Profile & Resume
                        </Link>
                        <button
                          type="button"
                          className="btn-hire-action"
                          onClick={() => openHireModal(freelancer)}
                        >
                          Hire Freelancer
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Direct Hire Request Modal */}
      {showHireModal && targetFreelancer && (
        <div className="modal-overlay" onClick={() => setShowHireModal(false)}>
          <div className="modal-content hire-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Hire {targetFreelancer.full_name}</h2>
                <p className="modal-subheading">{targetFreelancer.profile_title || "Freelancer"} • {targetFreelancer.hourly_rate || "$60/hr"}</p>
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
                  <label>Project Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Full Stack Web Application Redesign"
                    value={hireForm.project_title}
                    onChange={(e) => setHireForm({ ...hireForm, project_title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Offered Budget / Terms</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $4,000 Fixed Price or $80/hr"
                    value={hireForm.budget}
                    onChange={(e) => setHireForm({ ...hireForm, budget: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Project Details & Invitation Message</label>
                  <textarea
                    rows="5"
                    required
                    placeholder="Explain the project scope, timeline, deliverables, and why this freelancer is a great fit..."
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
                  className="btn-hire-action"
                  disabled={submittingHire}
                >
                  {submittingHire ? "Sending Request..." : "Send Hiring Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HireTalent;
