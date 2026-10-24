import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getMyProfile,
  getClientProjects,
  createProject,
  getFreelancerHiringRequests,
  getClientHiringRequests,
  updateHiringRequestStatus,
  getMyProposals,
  getProjectProposals,
  updateProposalStatus,
  getProjects
} from "../services/apiService";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const isFreelancer = user && (user.accountType === "freelancer" || user.account_type === "freelancer");
  const isClient = user && (user.accountType === "client" || user.account_type === "client");

  // Tab State
  const activeTab = searchParams.get("tab") || (isFreelancer ? "requests" : "projects");

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  // Data states
  const [profileData, setProfileData] = useState(null);
  const [hiringRequests, setHiringRequests] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [clientProjects, setClientProjects] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);

  // Client Selected Project Proposals State
  const [selectedProjectForProposals, setSelectedProjectForProposals] = useState(null);
  const [projectProposalsList, setProjectProposalsList] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // New Project Form State (for Client)
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    description: "",
    category: "Web Development",
    budget: "$3,000 - $5,000",
    skills_required: ""
  });
  const [creatingProject, setCreatingProject] = useState(false);

  // Client view proposals for specific project
  const handleViewProjectProposals = async (project) => {
    setSelectedProjectForProposals(project);
    setLoadingProposals(true);
    try {
      const list = await getProjectProposals(project.id);
      setProjectProposalsList(list || []);
    } catch (err) {
      console.error("Error loading project proposals:", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setFeedback({ message: "", type: "" });

    try {
      if (isFreelancer) {
        const [profileRes, requestsRes, proposalsRes, jobsRes] = await Promise.allSettled([
          getMyProfile(),
          getFreelancerHiringRequests(),
          getMyProposals(),
          getProjects()
        ]);

        if (profileRes.status === "fulfilled") setProfileData(profileRes.value);
        if (requestsRes.status === "fulfilled") setHiringRequests(requestsRes.value || []);
        if (proposalsRes.status === "fulfilled") setProposals(proposalsRes.value || []);
        if (jobsRes.status === "fulfilled") setAvailableJobs(jobsRes.value || []);
      } else if (isClient) {
        const [projectsRes, clientRequestsRes] = await Promise.allSettled([
          getClientProjects(),
          getClientHiringRequests()
        ]);

        if (projectsRes.status === "fulfilled") {
          const projs = projectsRes.value || [];
          setClientProjects(projs);
          if (projs.length > 0 && !selectedProjectForProposals) {
            handleViewProjectProposals(projs[0]);
          }
        }
        if (clientRequestsRes.status === "fulfilled") {
          setHiringRequests(clientRequestsRes.value || []);
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { successMessage: "Please log in to view your dashboard." } });
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // Freelancer accept/reject hire request
  const handleUpdateHiringStatus = async (requestId, status) => {
    try {
      await updateHiringRequestStatus(requestId, status);
      setHiringRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
      setFeedback({ message: `Hiring request marked as ${status}!`, type: "success" });
    } catch (err) {
      setFeedback({ message: err.message || "Failed to update status", type: "error" });
    }
  };

  // Client accept/reject proposal
  const handleUpdateProposalStatus = async (proposalId, status) => {
    try {
      await updateProposalStatus(proposalId, status);
      setProjectProposalsList((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status } : p))
      );
      setFeedback({ message: `Proposal marked as ${status}!`, type: "success" });
    } catch (err) {
      setFeedback({ message: err.message || "Failed to update proposal status", type: "error" });
    }
  };

  // Client post new project
  const handlePostProject = async (e) => {
    e.preventDefault();
    if (!newProjectForm.title.trim() || !newProjectForm.description.trim()) {
      setFeedback({ message: "Title and description are required", type: "error" });
      return;
    }

    setCreatingProject(true);
    setFeedback({ message: "", type: "" });

    try {
      const created = await createProject({
        title: newProjectForm.title,
        description: newProjectForm.description,
        category: newProjectForm.category,
        budget: newProjectForm.budget,
        skills_required: newProjectForm.skills_required.split(",").map((s) => s.trim()).filter(Boolean)
      });

      setClientProjects((prev) => [created, ...prev]);
      setNewProjectForm({
        title: "",
        description: "",
        category: "Web Development",
        budget: "$3,000 - $5,000",
        skills_required: ""
      });
      setFeedback({ message: "Project posted successfully to marketplace!", type: "success" });
      handleTabChange("projects");
    } catch (err) {
      setFeedback({ message: err.message || "Failed to create project", type: "error" });
    } finally {
      setCreatingProject(false);
    }
  };

  // Calculate profile completion for freelancer
  const calculateProfileCompletion = () => {
    if (!profileData) return 50;
    let score = 20;
    if (profileData.profile_title) score += 15;
    if (profileData.bio) score += 15;
    if (profileData.skills?.length > 0) score += 15;
    if (profileData.languages?.length > 0) score += 15;
    if (profileData.projects?.length > 0) score += 20;
    return Math.min(score, 100);
  };

  if (!user) return null;

  return (
    <div className="dashboard-page">
      {/* Dashboard Top Banner */}
      <div className="dash-banner">
        <div className="dash-container">
          <div className="dash-user-welcome">
            <div className="dash-avatar-circle">
              {(user.name || user.full_name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <h1>Welcome back, {user.name || user.full_name}!</h1>
              <p className="user-role-line">
                Account Type: <strong>{isFreelancer ? "Freelancer" : "Client"}</strong> • {user.email}
              </p>
            </div>
          </div>

          <div className="dash-quick-cta">
            {isFreelancer ? (
              <>
                <Link to="/profile/edit" className="dash-btn primary">
                  ✏️ Edit Profile & Resume
                </Link>
                <Link to="/find-work" className="dash-btn secondary">
                  🔍 Find Work
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="dash-btn primary"
                  onClick={() => handleTabChange("post-project")}
                >
                  ➕ Post a Project
                </button>
                <Link to="/hire-talent" className="dash-btn secondary">
                  👥 Find Talent
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dash-container dash-content-area">
        {feedback.message && (
          <div className={feedback.type === "success" ? "success-message" : "error-message"} style={{ marginBottom: "20px" }}>
            {feedback.type === "success" ? "✓" : "✗"} {feedback.message}
          </div>
        )}

        {loading && (
          <div className="status-box" style={{ marginBottom: "20px" }}>Loading dashboard updates...</div>
        )}

        {/* ========================================================= */}
        {/* FREELANCER DASHBOARD VIEW */}
        {/* ========================================================= */}
        {isFreelancer && (
          <>
            {/* Stat Cards */}
            <div className="stats-row">
              <div className="stat-box">
                <span className="stat-number">{calculateProfileCompletion()}%</span>
                <span className="stat-title">Profile Completion</span>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${calculateProfileCompletion()}%` }} />
                </div>
              </div>
              <div className="stat-box">
                <span className="stat-number">{hiringRequests.length}</span>
                <span className="stat-title">Hiring Requests</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{proposals.length}</span>
                <span className="stat-title">Submitted Proposals</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{hiringRequests.filter((r) => r.status === "Accepted").length}</span>
                <span className="stat-title">Accepted Projects</span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="dash-tabs-nav">
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => handleTabChange("requests")}
              >
                📥 Hiring Requests ({hiringRequests.length})
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "proposals" ? "active" : ""}`}
                onClick={() => handleTabChange("proposals")}
              >
                📄 My Applications ({proposals.length})
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "jobs" ? "active" : ""}`}
                onClick={() => handleTabChange("jobs")}
              >
                💼 Available Jobs
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "resume" ? "active" : ""}`}
                onClick={() => handleTabChange("resume")}
              >
                👤 My Resume & Portfolio
              </button>
            </div>

            {/* TAB 1: Hiring Requests */}
            {activeTab === "requests" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>Direct Hiring Requests From Clients</h2>
                  <p>Review project offers sent directly to you by clients.</p>
                </div>

                {hiringRequests.length === 0 ? (
                  <div className="empty-tab-box">
                    <p>No hiring requests received yet. Enhance your profile to attract more clients!</p>
                    <Link to="/profile/edit" className="btn-primary" style={{ display: "inline-block", marginTop: "12px" }}>
                      Edit Resume
                    </Link>
                  </div>
                ) : (
                  <div className="requests-cards-list">
                    {hiringRequests.map((req) => (
                      <div key={req.id} className="request-card">
                        <div className="req-header">
                          <div>
                            <h3>{req.project_title}</h3>
                            <p className="req-client">From: <strong>{req.client_name}</strong> ({req.client_email})</p>
                          </div>
                          <div className="req-status-wrap">
                            <span className={`status-pill ${req.status.toLowerCase()}`}>{req.status}</span>
                            <span className="req-budget">{req.budget}</span>
                          </div>
                        </div>

                        <p className="req-message">{req.message}</p>
                        <p className="req-date">Received on: {new Date(req.created_at).toLocaleDateString()}</p>

                        {req.status === "Pending" && (
                          <div className="req-action-buttons">
                            <button
                              type="button"
                              className="btn-accept"
                              onClick={() => handleUpdateHiringStatus(req.id, "Accepted")}
                            >
                              ✓ Accept Request
                            </button>
                            <button
                              type="button"
                              className="btn-reject"
                              onClick={() => handleUpdateHiringStatus(req.id, "Rejected")}
                            >
                              ✕ Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Proposals / Applications */}
            {activeTab === "proposals" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>My Submitted Proposals</h2>
                  <p>Track the status of all project applications you have submitted.</p>
                </div>

                {proposals.length === 0 ? (
                  <div className="empty-tab-box">
                    <p>You have not applied to any projects yet.</p>
                    <Link to="/find-work" className="btn-primary" style={{ display: "inline-block", marginTop: "12px" }}>
                      Browse Available Jobs
                    </Link>
                  </div>
                ) : (
                  <div className="proposals-table-wrapper">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Project</th>
                          <th>Category</th>
                          <th>My Bid</th>
                          <th>Est. Time</th>
                          <th>Status</th>
                          <th>Applied Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposals.map((prop) => (
                          <tr key={prop.id}>
                            <td>
                              <strong>{prop.project_title}</strong>
                              <br />
                              <small style={{ color: "#64748b" }}>Client: {prop.project_client_name}</small>
                            </td>
                            <td>{prop.project_category}</td>
                            <td className="highlight-text">{prop.bid_amount}</td>
                            <td>{prop.estimated_days} days</td>
                            <td>
                              <span className={`status-pill ${prop.status.toLowerCase()}`}>
                                {prop.status}
                              </span>
                            </td>
                            <td>{new Date(prop.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Available Jobs */}
            {activeTab === "jobs" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>Recommended Jobs for You</h2>
                  <Link to="/find-work" className="btn-outline-blue">
                    View All Marketplace Jobs →
                  </Link>
                </div>

                <div className="jobs-list">
                  {availableJobs.slice(0, 4).map((job) => (
                    <div key={job.id} className="job-card-rich">
                      <div className="job-card-top">
                        <span className="job-cat-badge">{job.category}</span>
                        <span className="job-budget-badge">{job.budget}</span>
                      </div>
                      <h3 className="job-card-title">{job.title}</h3>
                      <p className="job-card-client">By {job.client_name}</p>
                      <p className="job-card-desc">{job.description}</p>
                      <div className="job-card-actions">
                        <Link to="/find-work" className="btn-apply-blue" style={{ textDecoration: "none" }}>
                          Apply on Find Work
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: My Resume Preview */}
            {activeTab === "resume" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>My Resume & Showcase Projects</h2>
                  <Link to="/profile/edit" className="dash-btn primary" style={{ textDecoration: "none" }}>
                    ✏️ Edit Resume
                  </Link>
                </div>

                {profileData && (
                  <div className="resume-mini-preview">
                    <h3>{profileData.full_name} — {profileData.profile_title || "Freelancer"}</h3>
                    <p className="preview-bio">{profileData.bio || "No bio added yet."}</p>

                    <div className="preview-section">
                      <strong>Skills:</strong>
                      <div className="preview-tags">
                        {(profileData.skills || []).map((s, idx) => (
                          <span key={idx} className="skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div className="preview-section">
                      <strong>Programming Languages:</strong>
                      <div className="preview-tags">
                        {(profileData.languages || []).map((l, idx) => (
                          <span key={idx} className="lang-tag">{l}</span>
                        ))}
                      </div>
                    </div>

                    <div className="preview-section">
                      <strong>Showcase Projects ({profileData.projects?.length || 0}):</strong>
                      <div className="preview-projects-list">
                        {(profileData.projects || []).map((p) => (
                          <div key={p.id} className="preview-proj-item">
                            <h4>{p.title}</h4>
                            <p>{p.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* CLIENT DASHBOARD VIEW */}
        {/* ========================================================= */}
        {isClient && (
          <>
            {/* Stat Cards */}
            <div className="stats-row">
              <div className="stat-box">
                <span className="stat-number">{clientProjects.length}</span>
                <span className="stat-title">Posted Projects</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{clientProjects.filter((p) => p.status === "Open").length}</span>
                <span className="stat-title">Active Job Posts</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{hiringRequests.length}</span>
                <span className="stat-title">Sent Hire Requests</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">{hiringRequests.filter((r) => r.status === "Accepted").length}</span>
                <span className="stat-title">Hired Freelancers</span>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="dash-tabs-nav">
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "projects" ? "active" : ""}`}
                onClick={() => handleTabChange("projects")}
              >
                📋 My Projects ({clientProjects.length})
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "post-project" ? "active" : ""}`}
                onClick={() => handleTabChange("post-project")}
              >
                ➕ Post a Project
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "proposals" ? "active" : ""}`}
                onClick={() => handleTabChange("proposals")}
              >
                📬 Received Proposals
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => handleTabChange("requests")}
              >
                🤝 Hired Freelancers & Offers ({hiringRequests.length})
              </button>
              <button
                type="button"
                className={`dash-tab-btn ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => handleTabChange("profile")}
              >
                👤 Client Profile
              </button>
            </div>

            {/* TAB 1: My Projects */}
            {activeTab === "projects" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>My Posted Projects</h2>
                  <button
                    type="button"
                    className="dash-btn primary"
                    onClick={() => handleTabChange("post-project")}
                  >
                    + Post New Project
                  </button>
                </div>

                {clientProjects.length === 0 ? (
                  <div className="empty-tab-box">
                    <p>You have not posted any projects yet.</p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleTabChange("post-project")}
                      style={{ marginTop: "12px" }}
                    >
                      Post Your First Project
                    </button>
                  </div>
                ) : (
                  <div className="client-projects-grid">
                    {clientProjects.map((p) => (
                      <div key={p.id} className="client-project-card">
                        <div className="cp-header">
                          <span className="job-cat-badge">{p.category}</span>
                          <span className="job-budget-badge">{p.budget}</span>
                        </div>
                        <h3>{p.title}</h3>
                        <p className="cp-desc">{p.description}</p>
                        <div className="cp-meta">
                          <span>Proposals: <strong>{p.proposals_count || 0}</strong></span>
                          <span>Posted: <strong>{new Date(p.posted_at).toLocaleDateString()}</strong></span>
                          <span className="status-pill open">{p.status || "Open"}</span>
                        </div>
                        <div className="cp-footer">
                          <button
                            type="button"
                            className="btn-outline-blue"
                            onClick={() => {
                              handleViewProjectProposals(p);
                              handleTabChange("proposals");
                            }}
                          >
                            View Proposals ({p.proposals_count || 0})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Post a Project */}
            {activeTab === "post-project" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>Post a New Project</h2>
                  <p>Publish a job posting to receive proposals from qualified freelancers.</p>
                </div>

                <form onSubmit={handlePostProject} className="post-project-form">
                  <div className="form-group">
                    <label>Project Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full Stack Web Application Redesign"
                      value={newProjectForm.title}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={newProjectForm.category}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, category: e.target.value })}
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="UI/UX Design">UI/UX Design</option>
                        <option value="Mobile Apps">Mobile Apps</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Content Writing">Content Writing</option>
                        <option value="Data Science">Data Science</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Budget Range</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. $3,000 - $5,000"
                        value={newProjectForm.budget}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, budget: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Required Skills & Technologies (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. React, Node.js, PostgreSQL, Figma, REST API"
                      value={newProjectForm.skills_required}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, skills_required: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Detailed Project Scope & Requirements</label>
                    <textarea
                      rows="6"
                      required
                      placeholder="Describe what needs to be built, key deliverables, expectations, and any milestones..."
                      value={newProjectForm.description}
                      onChange={(e) => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={creatingProject}
                    style={{ marginTop: "12px", padding: "14px 28px", fontSize: "16px" }}
                  >
                    {creatingProject ? "Publishing Project..." : "🚀 Publish Project"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: Received Proposals */}
            {activeTab === "proposals" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>Review Freelancer Proposals</h2>
                  {selectedProjectForProposals && (
                    <span className="selected-proj-label">
                      Showing proposals for: <strong>{selectedProjectForProposals.title}</strong>
                    </span>
                  )}
                </div>

                {/* Project Selector Pills */}
                {clientProjects.length > 0 && (
                  <div className="project-selector-pills">
                    {clientProjects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={`pill-btn ${selectedProjectForProposals?.id === p.id ? "active" : ""}`}
                        onClick={() => handleViewProjectProposals(p)}
                      >
                        {p.title} ({p.proposals_count || 0})
                      </button>
                    ))}
                  </div>
                )}

                {loadingProposals ? (
                  <div className="status-box">Loading proposals...</div>
                ) : projectProposalsList.length === 0 ? (
                  <div className="empty-tab-box">
                    <p>No proposals received for this project yet.</p>
                  </div>
                ) : (
                  <div className="proposals-cards-list">
                    {projectProposalsList.map((prop) => (
                      <div key={prop.id} className="proposal-item-card">
                        <div className="proposal-card-header">
                          <div className="freelancer-info-block">
                            <div className="avatar-initials-small">
                              {prop.freelancer_name?.charAt(0) || "F"}
                            </div>
                            <div>
                              <h4>{prop.freelancer_name}</h4>
                              <p className="freelancer-sub">{prop.freelancer_title || "Freelancer"} • {prop.freelancer_location || "Remote"}</p>
                            </div>
                          </div>

                          <div className="proposal-bid-wrap">
                            <span className="bid-amount">{prop.bid_amount}</span>
                            <span className="delivery-time">Estimated: {prop.estimated_days} days</span>
                            <span className={`status-pill ${prop.status.toLowerCase()}`}>{prop.status}</span>
                          </div>
                        </div>

                        <div className="proposal-letter">
                          <strong>Cover Letter:</strong>
                          <p>{prop.cover_letter}</p>
                        </div>

                        <div className="proposal-card-actions">
                          <Link
                            to={`/freelancers/${prop.freelancer_id}`}
                            className="btn-outline-blue"
                            style={{ textDecoration: "none" }}
                          >
                            👁️ View Full Resume & Portfolio
                          </Link>

                          {prop.status === "Pending" && (
                            <div className="accept-reject-btns">
                              <button
                                type="button"
                                className="btn-accept"
                                onClick={() => handleUpdateProposalStatus(prop.id, "Accepted")}
                              >
                                ✓ Accept & Hire
                              </button>
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => handleUpdateProposalStatus(prop.id, "Rejected")}
                              >
                                ✕ Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Sent Hiring Requests */}
            {activeTab === "requests" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>Direct Hiring Requests Sent to Freelancers</h2>
                  <Link to="/hire-talent" className="btn-outline-blue" style={{ textDecoration: "none" }}>
                    + Find More Talent
                  </Link>
                </div>

                {hiringRequests.length === 0 ? (
                  <div className="empty-tab-box">
                    <p>You have not sent direct hiring offers to any freelancers yet.</p>
                    <Link to="/hire-talent" className="btn-primary" style={{ display: "inline-block", marginTop: "12px" }}>
                      Browse & Hire Talent
                    </Link>
                  </div>
                ) : (
                  <div className="requests-cards-list">
                    {hiringRequests.map((req) => (
                      <div key={req.id} className="request-card">
                        <div className="req-header">
                          <div>
                            <h3>{req.project_title}</h3>
                            <p className="req-client">
                              Sent to: <strong>{req.freelancer_name}</strong> ({req.freelancer_title || "Freelancer"})
                            </p>
                          </div>
                          <div className="req-status-wrap">
                            <span className={`status-pill ${req.status.toLowerCase()}`}>{req.status}</span>
                            <span className="req-budget">{req.budget}</span>
                          </div>
                        </div>

                        <p className="req-message">{req.message}</p>
                        <div className="req-footer-row">
                          <span className="req-date">Sent on: {new Date(req.created_at).toLocaleDateString()}</span>
                          <Link to={`/freelancers/${req.freelancer_id}`} className="view-profile-link">
                            View Freelancer Profile →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: Client Profile */}
            {activeTab === "profile" && (
              <div className="dash-tab-content">
                <div className="tab-header">
                  <h2>Client Profile & Account Details</h2>
                  <p>Manage your client account information and review your hiring history.</p>
                </div>

                <div className="client-profile-overview" style={{ background: "#f8fafc", padding: "28px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
                    <div className="dash-avatar-circle" style={{ width: "72px", height: "72px", fontSize: "32px" }}>
                      {(user.name || user.full_name || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "4px" }}>{user.name || user.full_name}</h3>
                      <p style={{ color: "#0284c7", fontWeight: "700", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client Account</p>
                      <p style={{ color: "#64748b", fontSize: "14px", marginTop: "2px" }}>{user.email}</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "20px" }}>
                    <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Total Posted Projects</span>
                      <p style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", marginTop: "6px" }}>{clientProjects.length}</p>
                    </div>
                    <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Hired Freelancers</span>
                      <p style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", marginTop: "6px" }}>
                        {hiringRequests.filter((r) => r.status === "Accepted").length}
                      </p>
                    </div>
                    <div style={{ background: "white", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Active Sent Offers</span>
                      <p style={{ fontSize: "28px", fontWeight: "800", color: "#d97706", marginTop: "6px" }}>
                        {hiringRequests.filter((r) => r.status === "Pending").length}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: "28px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="dash-btn primary"
                      onClick={() => handleTabChange("post-project")}
                    >
                      ➕ Post a New Project
                    </button>
                    <Link to="/hire-talent" className="dash-btn secondary" style={{ textDecoration: "none", color: "#0f172a" }}>
                      👥 Find & Hire Freelancers
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
