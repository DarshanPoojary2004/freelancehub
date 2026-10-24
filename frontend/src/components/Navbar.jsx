import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    syncUser();
    window.addEventListener("auth:changed", syncUser);

    return () => {
      window.removeEventListener("auth:changed", syncUser);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("googleToken");
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/", { state: { logoutMessage: "Logged out successfully" } });
  };

  const displayName = user?.name || user?.full_name || "Account";
  const role = (user?.accountType || user?.account_type || "").toLowerCase();
  const isClient = role === "client";
  const isFreelancer = role === "freelancer";

  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab");

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Freelance<span>Hub</span>
        </Link>

        {/* Dynamic Role-Based Navigation Links */}
        <div className="navbar-links">
          {/* CLIENT NAVIGATION */}
          {isClient && (
            <>
              <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
                Home
              </Link>
              <Link to="/hire-talent" className={`nav-link ${location.pathname === "/hire-talent" ? "active" : ""}`}>
                Find Freelancers
              </Link>
              <Link
                to="/dashboard?tab=projects"
                className={`nav-link ${location.pathname === "/dashboard" && activeTab === "projects" ? "active" : ""}`}
              >
                My Projects
              </Link>
              <Link
                to="/dashboard?tab=requests"
                className={`nav-link ${location.pathname === "/dashboard" && activeTab === "requests" ? "active" : ""}`}
              >
                Hired Freelancers
              </Link>
              <Link
                to="/dashboard?tab=profile"
                className={`nav-link ${location.pathname === "/dashboard" && activeTab === "profile" ? "active" : ""}`}
              >
                Profile
              </Link>
            </>
          )}

          {/* FREELANCER NAVIGATION */}
          {isFreelancer && (
            <>
              <Link to="/" className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>
                Home
              </Link>
              <Link to="/find-work" className={`nav-link ${location.pathname === "/find-work" ? "active" : ""}`}>
                Find Work
              </Link>
              <Link
                to="/dashboard?tab=proposals"
                className={`nav-link ${location.pathname === "/dashboard" && activeTab === "proposals" ? "active" : ""}`}
              >
                My Applications
              </Link>
              <Link
                to="/dashboard?tab=requests"
                className={`nav-link ${location.pathname === "/dashboard" && activeTab === "requests" ? "active" : ""}`}
              >
                Offers
              </Link>
              <Link
                to="/profile/edit"
                className={`nav-link ${location.pathname.startsWith("/profile") ? "active" : ""}`}
              >
                My Profile
              </Link>
            </>
          )}

          {/* LOGGED OUT NAVIGATION */}
          {!user && (
            <>
              <Link to="/find-work" className={`nav-link ${location.pathname === "/find-work" ? "active" : ""}`}>
                Find Work
              </Link>
              <Link to="/hire-talent" className={`nav-link ${location.pathname === "/hire-talent" ? "active" : ""}`}>
                Hire Talent
              </Link>
            </>
          )}
        </div>

        {/* Right Auth Area */}
        <div className="navbar-auth">
          {user ? (
            <>
              <div className="nav-user-badge">
                <span className={`nav-user-avatar ${isClient ? "client-avatar" : "freelancer-avatar"}`}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <div className="nav-user-info">
                  <span className="nav-user-name">{displayName}</span>
                  <span className={`nav-user-role ${isClient ? "role-client" : "role-freelancer"}`}>
                    {isClient ? "Client" : "Freelancer"}
                  </span>
                </div>
              </div>
              <button type="button" className="nav-btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn-text">
                Login
              </Link>
              <Link to="/register" className="nav-btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
