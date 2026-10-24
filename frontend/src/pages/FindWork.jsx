import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { getProjects, submitProposal, getMyProposals } from "../services/apiService";
import "./FindWork.css";

const CATEGORIES = [
  "All",
  "Web Development",
  "UI/UX Design",
  "Mobile Apps",
  "Digital Marketing",
  "Content Writing",
  "Video Editing",
  "Graphic Design",
  "Data Science"
];

function FindWork() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "All");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [myAppliedProjectIds, setMyAppliedProjectIds] = useState(new Set());

  // Modal states
  const [selectedProject, setSelectedProject] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingProject, setApplyingProject] = useState(null);

  // Proposal form state
  const [proposalForm, setProposalForm] = useState({
    cover_letter: "",
    bid_amount: "",
    estimated_days: "7"
  });
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState({ text: "", type: "" });

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const userRole = (currentUser?.accountType || currentUser?.account_type || "").toLowerCase();
  const isFreelancer = userRole === "freelancer";
  const isClient = userRole === "client";

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getProjects({
        category: activeCategory === "All" ? "" : activeCategory,
        search: searchQuery
      });
      setProjects(data || []);

      if (isFreelancer) {
        try {
          const myProposals = await getMyProposals();
          const appliedIds = new Set((myProposals || []).map((p) => p.project_id));
          setMyAppliedProjectIds(appliedIds);
        } catch {
          // non-blocking
        }
      }
    } catch (err) {
      setError(err.message || "Unable to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeCategory, searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (activeCategory !== "All") params.set("category", activeCategory);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    setSearchParams(params);
  };

  const handleCategorySelect = (cat) => {
    setActiveCategory(cat);
    const params = new URLSearchParams();
    if (cat !== "All") params.set("category", cat);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    setSearchParams(params);
  };

  const openApplyModal = (project) => {
    if (!currentUser) {
      navigate("/login", { state: { successMessage: "Please log in to submit a proposal." } });
      return;
    }

    if (!isFreelancer) {
      alert("Only Freelancer accounts can submit proposals for jobs. You are logged in as a Client.");
      return;
    }

    setApplyingProject(project);
    setProposalForm({
      cover_letter: `Hello ${project.client_name},\n\nI would love to help you with "${project.title}". I have extensive experience with ${(project.skills_required || []).join(", ") || "these technologies"} and can deliver clean, high-performance work on time.\n\nLooking forward to collaborating!`,
      bid_amount: project.budget ? project.budget.split("-")[0].replace(/[^0-9$]/g, "").trim() || "$1,000" : "$1,000",
      estimated_days: "7"
    });
    setProposalMessage({ text: "", type: "" });
    setShowApplyModal(true);
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!proposalForm.cover_letter.trim()) {
      setProposalMessage({ text: "Please write a cover letter", type: "error" });
      return;
    }
    if (!proposalForm.bid_amount.trim()) {
      setProposalMessage({ text: "Please enter your bid amount", type: "error" });
      return;
    }

    setSubmittingProposal(true);
    setProposalMessage({ text: "", type: "" });

    try {
      await submitProposal(applyingProject.id, proposalForm);
      setProposalMessage({ text: "Proposal submitted successfully! The client will review your application.", type: "success" });
      setMyAppliedProjectIds((prev) => new Set([...prev, applyingProject.id]));

      setTimeout(() => {
        setShowApplyModal(false);
        setApplyingProject(null);
        setProposalMessage({ text: "", type: "" });
        fetchJobs();
      }, 1600);
    } catch (err) {
      setProposalMessage({ text: err.message || "Failed to submit proposal", type: "error" });
    } finally {
      setSubmittingProposal(false);
    }
  };

  return (
    <div className="find-work-page">
      {/* Page Header */}
      <div className="page-header-banner">
        <div className="page-header-content">
          <h1>Find Freelance Projects</h1>
          <p>Browse high-quality freelance jobs, submit proposals, and get hired by great clients.</p>

          <form className="find-work-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by keyword, skill, or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="find-work-search-btn">
              Search Jobs
            </button>
          </form>
        </div>
      </div>

      <div className="find-work-container">
        {isClient && (
          <div className="client-role-banner" style={{ background: "#e0f2fe", border: "1px solid #7dd3fc", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px", color: "#0369a1", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <span>ℹ️ You are viewing projects as a <strong>Client</strong>. To post a new project or hire talent, visit your Client Dashboard or Find Freelancers.</span>
            <Link to="/dashboard?tab=post-project" className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px", textDecoration: "none" }}>
              + Post a Project
            </Link>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="category-filter-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-pill ${activeCategory === cat ? "active" : ""}`}
              onClick={() => handleCategorySelect(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Indicators */}
        {loading && <div className="status-box">Loading available freelance projects...</div>}
        {error && <div className="error-box">✗ {error}</div>}

        {/* Projects Grid */}
        {!loading && !error && (
          <div className="projects-feed">
            <div className="feed-header">
              <h2>Available Projects ({projects.length})</h2>
              {activeCategory !== "All" && (
                <span className="active-filter-badge">
                  Filtered by: <strong>{activeCategory}</strong>
                  <button type="button" onClick={() => handleCategorySelect("All")}>✕</button>
                </span>
              )}
            </div>

            {projects.length === 0 ? (
              <div className="empty-state-box">
                <div className="empty-icon">🔍</div>
                <h3>No projects found</h3>
                <p>Try searching for a different skill or choose "All" categories.</p>
                <button type="button" className="btn-primary" onClick={() => handleCategorySelect("All")}>
                  Show All Projects
                </button>
              </div>
            ) : (
              <div className="jobs-list">
                {projects.map((project) => {
                  const hasApplied = myAppliedProjectIds.has(project.id);

                  return (
                    <article key={project.id} className="job-card-rich">
                      <div className="job-card-top">
                        <div className="job-card-meta-left">
                          <span className="job-cat-badge">{project.category}</span>
                          <span className="job-status-badge">{project.status || "Open"}</span>
                          {hasApplied && <span className="applied-pill">✓ Applied</span>}
                        </div>
                        <span className="job-budget-badge">{project.budget}</span>
                      </div>

                      <h3 className="job-card-title">{project.title}</h3>
                      <p className="job-card-client">
                        Posted by <strong>{project.client_name}</strong> • {new Date(project.posted_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </p>

                      <p className="job-card-desc">
                        {project.description}
                      </p>

                      {project.skills_required && project.skills_required.length > 0 && (
                        <div className="job-skills-row">
                          {project.skills_required.map((skill, index) => (
                            <span key={index} className="job-skill-pill">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="job-card-actions">
                        <button
                          type="button"
                          className="btn-outline-blue"
                          onClick={() => setSelectedProject(project)}
                        >
                          View Project Details
                        </button>

                        {hasApplied ? (
                          <button type="button" className="btn-applied" disabled>
                            Proposal Submitted
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-apply-blue"
                            onClick={() => openApplyModal(project)}
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="job-cat-badge">{selectedProject.category}</span>
                <h2>{selectedProject.title}</h2>
                <p className="modal-client-info">
                  Posted by <strong>{selectedProject.client_name}</strong> on {new Date(selectedProject.posted_at).toLocaleDateString()}
                </p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedProject(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-detail-row">
                <div className="detail-stat">
                  <span className="stat-label">Budget:</span>
                  <span className="stat-value highlight-blue">{selectedProject.budget}</span>
                </div>
                <div className="detail-stat">
                  <span className="stat-label">Status:</span>
                  <span className="stat-value">{selectedProject.status || "Open"}</span>
                </div>
                <div className="detail-stat">
                  <span className="stat-label">Proposals Received:</span>
                  <span className="stat-value">{selectedProject.proposals_count || 0}</span>
                </div>
              </div>

              <h3>Project Overview</h3>
              <p className="modal-full-desc">{selectedProject.description}</p>

              {selectedProject.skills_required && selectedProject.skills_required.length > 0 && (
                <div className="modal-skills-section">
                  <h3>Required Skills & Technologies</h3>
                  <div className="job-skills-row">
                    {selectedProject.skills_required.map((skill, index) => (
                      <span key={index} className="job-skill-pill large">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setSelectedProject(null)}>
                Close
              </button>
              {myAppliedProjectIds.has(selectedProject.id) ? (
                <button type="button" className="btn-applied" disabled>
                  ✓ Already Applied
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-apply-blue"
                  onClick={() => {
                    const proj = selectedProject;
                    setSelectedProject(null);
                    openApplyModal(proj);
                  }}
                >
                  Submit Proposal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply / Proposal Submission Modal */}
      {showApplyModal && applyingProject && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-content apply-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Submit Proposal for Project</h2>
                <p className="modal-subheading">{applyingProject.title} ({applyingProject.budget})</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>

            <form onSubmit={handleProposalSubmit}>
              <div className="modal-body">
                {proposalMessage.text && (
                  <div className={proposalMessage.type === "success" ? "success-message" : "error-message"}>
                    {proposalMessage.type === "success" ? "✓" : "✗"} {proposalMessage.text}
                  </div>
                )}

                <div className="form-group">
                  <label>Your Proposed Bid Amount / Rate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. $2,500 or $75/hr"
                    value={proposalForm.bid_amount}
                    onChange={(e) => setProposalForm({ ...proposalForm, bid_amount: e.target.value })}
                  />
                  <small className="form-hint">Client's budget range: {applyingProject.budget}</small>
                </div>

                <div className="form-group">
                  <label>Estimated Delivery Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 7"
                    value={proposalForm.estimated_days}
                    onChange={(e) => setProposalForm({ ...proposalForm, estimated_days: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Cover Letter & Solution Proposal</label>
                  <textarea
                    rows="6"
                    required
                    placeholder="Introduce yourself, explain your approach to solving this project, highlight relevant past work and technologies..."
                    value={proposalForm.cover_letter}
                    onChange={(e) => setProposalForm({ ...proposalForm, cover_letter: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowApplyModal(false)}
                  disabled={submittingProposal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-apply-blue"
                  disabled={submittingProposal}
                >
                  {submittingProposal ? "Submitting..." : "Send Proposal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindWork;
