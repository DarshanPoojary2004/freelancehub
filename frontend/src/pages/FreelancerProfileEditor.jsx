import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyProfile,
  updateProfile,
  addShowcaseProject,
  deleteShowcaseProject
} from "../services/apiService";
import "./FreelancerProfileEditor.css";

const COMMON_LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "C#", "SQL",
  "HTML5", "CSS3", "PHP", "Go", "Rust", "Dart", "Swift", "Kotlin", "Ruby"
];

const COMMON_FRAMEWORKS = [
  "React", "Node.js", "Express", "Next.js", "PostgreSQL", "MongoDB",
  "Django", "Spring Boot", "Flutter", "React Native", "Angular", "Vue.js",
  "Tailwind CSS", "Docker", "Kubernetes", "Redis", "AWS", "Firebase"
];

const COMMON_SERVICES = [
  "Full Stack Web Development",
  "Frontend Web Development",
  "Backend API & Database Development",
  "Mobile App Development (iOS & Android)",
  "UI/UX Design & Prototyping",
  "E-commerce Website Development",
  "Cloud Architecture & DevOps",
  "SEO & Digital Strategy"
];

function FreelancerProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [userId, setUserId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    full_name: "",
    profile_title: "",
    bio: "",
    location: "Remote",
    hourly_rate: "$60/hr",
    availability: "Available for full-time & contract",
    experience_years: 3,
    avatar_url: "",
    skills: [],
    languages: [],
    frameworks: [],
    services: [],
    education: [],
    experience_history: []
  });

  // Showcase Projects
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    technologies: "",
    role: "Lead Developer",
    project_url: "",
    github_url: ""
  });
  const [addingProject, setAddingProject] = useState(false);

  // Input helpers
  const [skillInput, setSkillInput] = useState("");
  const [customLangInput, setCustomLangInput] = useState("");
  const [customFwInput, setCustomFwInput] = useState("");

  // New Edu / Exp temp state
  const [newEdu, setNewEdu] = useState({ degree: "", university: "", year: "" });
  const [showEduForm, setShowEduForm] = useState(false);

  const [newExp, setNewExp] = useState({ role: "", company: "", duration: "", description: "" });
  const [showExpForm, setShowExpForm] = useState(false);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      setLoading(true);
      try {
        const data = await getMyProfile();
        setUserId(data.id);
        setProjects(data.projects || []);

        const parsedEdu = Array.isArray(data.education)
          ? data.education
          : (typeof data.education === "string" ? JSON.parse(data.education || "[]") : []);

        const parsedExp = Array.isArray(data.experience_history)
          ? data.experience_history
          : (typeof data.experience_history === "string" ? JSON.parse(data.experience_history || "[]") : []);

        setForm({
          full_name: data.full_name || "",
          profile_title: data.profile_title || "",
          bio: data.bio || "",
          location: data.location || "Remote",
          hourly_rate: data.hourly_rate || "$60/hr",
          availability: data.availability || "Available for full-time & contract",
          experience_years: data.experience_years || 3,
          avatar_url: data.avatar_url || "",
          skills: data.skills || [],
          languages: data.languages || [],
          frameworks: data.frameworks || [],
          services: data.services || [],
          education: parsedEdu,
          experience_history: parsedExp
        });
      } catch {
        setFeedback({ message: "Failed to load profile. Please make sure you are logged in.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentProfile();
  }, []);

  // Tag helper toggles
  const toggleArrayItem = (field, item) => {
    setForm((prev) => {
      const currentList = prev[field] || [];
      if (currentList.includes(item)) {
        return { ...prev, [field]: currentList.filter((x) => x !== item) };
      } else {
        return { ...prev, [field]: [...currentList, item] };
      }
    });
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !form.skills.includes(skillInput.trim())) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  const addCustomLanguage = (e) => {
    e.preventDefault();
    if (customLangInput.trim() && !form.languages.includes(customLangInput.trim())) {
      setForm((prev) => ({ ...prev, languages: [...prev.languages, customLangInput.trim()] }));
      setCustomLangInput("");
    }
  };

  const addCustomFramework = (e) => {
    e.preventDefault();
    if (customFwInput.trim() && !form.frameworks.includes(customFwInput.trim())) {
      setForm((prev) => ({ ...prev, frameworks: [...prev.frameworks, customFwInput.trim()] }));
      setCustomFwInput("");
    }
  };

  const handleAddEducation = () => {
    if (!newEdu.degree || !newEdu.university) {
      alert("Please enter both degree and university name.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
    setNewEdu({ degree: "", university: "", year: "" });
    setShowEduForm(false);
  };

  const removeEducation = (index) => {
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((_, idx) => idx !== index)
    }));
  };

  const handleAddExperience = () => {
    if (!newExp.role || !newExp.company) {
      alert("Please enter role and company name.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      experience_history: [...prev.experience_history, newExp]
    }));
    setNewExp({ role: "", company: "", duration: "", description: "" });
    setShowExpForm(false);
  };

  const removeExperience = (index) => {
    setForm((prev) => ({
      ...prev,
      experience_history: prev.experience_history.filter((_, idx) => idx !== index)
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ message: "", type: "" });

    try {
      const updated = await updateProfile(form);

      // Update local storage user info
      const stored = localStorage.getItem("user");
      if (stored) {
        const userObj = JSON.parse(stored);
        userObj.name = updated.full_name;
        userObj.full_name = updated.full_name;
        localStorage.setItem("user", JSON.stringify(userObj));
        window.dispatchEvent(new Event("auth:changed"));
      }

      setFeedback({ message: "Profile & resume saved successfully!", type: "success" });
    } catch (err) {
      setFeedback({ message: err.message || "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) {
      alert("Project title is required");
      return;
    }

    setAddingProject(true);
    try {
      const added = await addShowcaseProject({
        title: newProject.title,
        description: newProject.description,
        technologies: newProject.technologies.split(",").map((s) => s.trim()).filter(Boolean),
        role: newProject.role,
        project_url: newProject.project_url,
        github_url: newProject.github_url
      });

      setProjects((prev) => [added, ...prev]);
      setNewProject({
        title: "",
        description: "",
        technologies: "",
        role: "Lead Developer",
        project_url: "",
        github_url: ""
      });
      setFeedback({ message: "Showcase project added to your resume!", type: "success" });
    } catch (err) {
      alert("Failed to add project: " + err.message);
    } finally {
      setAddingProject(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Remove this project from your portfolio?")) return;
    try {
      await deleteShowcaseProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert("Failed to delete project: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="editor-page">
        <div className="editor-container">
          <div className="status-box">Loading resume editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      <div className="editor-header-bar">
        <div className="editor-container header-flex">
          <div>
            <h1>Freelancer Profile & Resume Builder</h1>
            <p>Showcase your expertise, languages, completed projects, and attract top clients.</p>
          </div>
          {userId && (
            <div className="header-actions">
              <Link to={`/freelancers/${userId}`} className="btn-view-live">
                👁️ View Live Resume
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="editor-container">
        {feedback.message && (
          <div className={feedback.type === "success" ? "success-message" : "error-message"} style={{ marginBottom: "24px" }}>
            {feedback.type === "success" ? "✓" : "✗"} {feedback.message}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="editor-form">
          {/* SECTION 1: Personal Information */}
          <div className="editor-card">
            <h2>1. Personal & Professional Information</h2>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Professional Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Developer"
                  value={form.profile_title}
                  onChange={(e) => setForm({ ...form, profile_title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Hourly Rate / Expected Rate</label>
                <input
                  type="text"
                  placeholder="e.g. $80/hr"
                  value={form.hourly_rate}
                  onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Work Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.value })}
                >
                  <option value="Available for full-time & contract">Available for full-time & contract</option>
                  <option value="Available for contract">Available for contract only</option>
                  <option value="Available part-time">Available part-time</option>
                  <option value="Busy / Not currently taking new projects">Busy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "16px" }}>
              <label>Short Professional Bio</label>
              <textarea
                rows="4"
                placeholder="Write a concise overview of your background, experience, and the problems you solve for clients..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 2: Programming Languages */}
          <div className="editor-card">
            <h2>2. Programming Languages</h2>
            <p className="card-subtitle">Select the programming languages you are proficient in:</p>

            <div className="tag-selector-grid">
              {COMMON_LANGUAGES.map((lang) => {
                const isSelected = form.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    className={`tag-toggle-btn ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleArrayItem("languages", lang)}
                  >
                    {isSelected ? "✓" : "+"} {lang}
                  </button>
                );
              })}
            </div>

            <div className="add-custom-row">
              <input
                type="text"
                placeholder="Add other language (e.g. Solidity, Rust)..."
                value={customLangInput}
                onChange={(e) => setCustomLangInput(e.target.value)}
              />
              <button type="button" className="btn-add-tag" onClick={addCustomLanguage}>
                Add Language
              </button>
            </div>
          </div>

          {/* SECTION 3: Technologies & Frameworks */}
          <div className="editor-card">
            <h2>3. Technologies & Frameworks</h2>
            <p className="card-subtitle">Select frameworks and tools you work with:</p>

            <div className="tag-selector-grid">
              {COMMON_FRAMEWORKS.map((fw) => {
                const isSelected = form.frameworks.includes(fw);
                return (
                  <button
                    key={fw}
                    type="button"
                    className={`tag-toggle-btn fw-toggle ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleArrayItem("frameworks", fw)}
                  >
                    {isSelected ? "✓" : "+"} {fw}
                  </button>
                );
              })}
            </div>

            <div className="add-custom-row">
              <input
                type="text"
                placeholder="Add other technology (e.g. GraphQL, Supabase)..."
                value={customFwInput}
                onChange={(e) => setCustomFwInput(e.target.value)}
              />
              <button type="button" className="btn-add-tag" onClick={addCustomFramework}>
                Add Technology
              </button>
            </div>
          </div>

          {/* SECTION 4: Skills & Core Competencies */}
          <div className="editor-card">
            <h2>4. Core Skills</h2>
            <p className="card-subtitle">Add key functional skills that clients search for:</p>

            <div className="selected-tags-box">
              {form.skills.map((skill) => (
                <span key={skill} className="skill-removable-pill">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>✕</button>
                </span>
              ))}
            </div>

            <div className="add-custom-row">
              <input
                type="text"
                placeholder="Type a skill (e.g. API Integration, Microservices, UI Design)..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
              />
              <button type="button" className="btn-add-tag" onClick={addSkill}>
                Add Skill
              </button>
            </div>
          </div>

          {/* SECTION 5: Services Offered */}
          <div className="editor-card">
            <h2>5. Services Offered</h2>
            <p className="card-subtitle">Choose the main client services you deliver:</p>

            <div className="services-checkbox-grid">
              {COMMON_SERVICES.map((srv) => {
                const checked = form.services.includes(srv);
                return (
                  <label key={srv} className={`service-check-card ${checked ? "checked" : ""}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayItem("services", srv)}
                    />
                    <span>{srv}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: Work Experience */}
          <div className="editor-card">
            <div className="card-header-flex">
              <h2>6. Previous Work Experience</h2>
              <button
                type="button"
                className="btn-outline-small"
                onClick={() => setShowExpForm(!showExpForm)}
              >
                {showExpForm ? "Cancel" : "+ Add Work Experience"}
              </button>
            </div>

            {showExpForm && (
              <div className="entry-subform">
                <h4>Add Work Experience</h4>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Role / Position Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Developer"
                      value={newExp.role}
                      onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Company / Organization</label>
                    <input
                      type="text"
                      placeholder="e.g. TechCorp Solutions"
                      value={newExp.company}
                      onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration / Dates</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021 - Present"
                      value={newExp.duration}
                      onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: "12px" }}>
                  <label>Key Responsibilities & Achievements</label>
                  <textarea
                    rows="3"
                    placeholder="Briefly describe what you built and delivered..."
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  />
                </div>
                <button type="button" className="btn-primary" onClick={handleAddExperience} style={{ marginTop: "12px" }}>
                  Save Experience Entry
                </button>
              </div>
            )}

            <div className="entries-list">
              {form.experience_history.length === 0 ? (
                <p className="empty-text">No experience entries yet.</p>
              ) : (
                form.experience_history.map((exp, idx) => (
                  <div key={idx} className="entry-item">
                    <div>
                      <strong>{exp.role}</strong> at <span className="entry-company">{exp.company}</span>
                      <p className="entry-meta">{exp.duration}</p>
                      <p className="entry-desc">{exp.description}</p>
                    </div>
                    <button type="button" className="btn-delete-entry" onClick={() => removeExperience(idx)}>
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 7: Education */}
          <div className="editor-card">
            <div className="card-header-flex">
              <h2>7. Education</h2>
              <button
                type="button"
                className="btn-outline-small"
                onClick={() => setShowEduForm(!showEduForm)}
              >
                {showEduForm ? "Cancel" : "+ Add Education"}
              </button>
            </div>

            {showEduForm && (
              <div className="entry-subform">
                <h4>Add Education</h4>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Degree / Certificate</label>
                    <input
                      type="text"
                      placeholder="e.g. B.S. in Computer Science"
                      value={newEdu.degree}
                      onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>College / University</label>
                    <input
                      type="text"
                      placeholder="e.g. Stanford University"
                      value={newEdu.university}
                      onChange={(e) => setNewEdu({ ...newEdu, university: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Graduation Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={newEdu.year}
                      onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })}
                    />
                  </div>
                </div>
                <button type="button" className="btn-primary" onClick={handleAddEducation} style={{ marginTop: "12px" }}>
                  Save Education Entry
                </button>
              </div>
            )}

            <div className="entries-list">
              {form.education.length === 0 ? (
                <p className="empty-text">No education entries yet.</p>
              ) : (
                form.education.map((edu, idx) => (
                  <div key={idx} className="entry-item">
                    <div>
                      <strong>{edu.degree}</strong> — <span className="entry-company">{edu.university}</span> ({edu.year})
                    </div>
                    <button type="button" className="btn-delete-entry" onClick={() => removeEducation(idx)}>
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sticky Save Bar */}
          <div className="editor-submit-bar">
            <button type="submit" className="btn-save-large" disabled={saving}>
              {saving ? "Saving Changes..." : "💾 Save Profile & Resume"}
            </button>
          </div>
        </form>

        {/* SECTION 8: Portfolio Showcase Projects */}
        <div className="editor-card" style={{ marginTop: "30px" }}>
          <h2>8. Portfolio & Completed Projects Showcase</h2>
          <p className="card-subtitle">Showcase projects you have completed to provide evidence of your skills:</p>

          <form onSubmit={handleCreateProject} className="add-project-form">
            <div className="form-grid-2">
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Cloud Monitoring Platform"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Your Role in Project</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Full Stack Architect"
                  value={newProject.role}
                  onChange={(e) => setNewProject({ ...newProject, role: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Technologies Used (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Live Demo URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://my-live-demo.com"
                  value={newProject.project_url}
                  onChange={(e) => setNewProject({ ...newProject, project_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>GitHub Repository URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={newProject.github_url}
                  onChange={(e) => setNewProject({ ...newProject, github_url: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label>Project Description</label>
              <textarea
                rows="3"
                placeholder="Explain what problem this project solved, architecture, and key features..."
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={addingProject} style={{ marginTop: "12px" }}>
              {addingProject ? "Adding Project..." : "+ Add Project to Portfolio"}
            </button>
          </form>

          {/* Current Projects List */}
          <div className="current-projects-grid">
            {projects.map((p) => (
              <div key={p.id} className="project-editor-card">
                <div className="p-header">
                  <h4>{p.title}</h4>
                  <button type="button" className="btn-delete-proj" onClick={() => handleDeleteProject(p.id)}>
                    ✕ Remove
                  </button>
                </div>
                <p className="p-desc">{p.description}</p>
                <div className="p-tech">
                  {(p.technologies || []).map((t, idx) => (
                    <span key={idx} className="tech-badge">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FreelancerProfileEditor;
