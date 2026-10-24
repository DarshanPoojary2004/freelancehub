import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-section">
          <div className="footer-logo">
            Freelance<span>Hub</span>
          </div>
          <p className="footer-description">
            Connect with top talent and build amazing projects. A professional marketplace for freelancers and clients.
          </p>
          <div className="social-links">
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="Facebook">f</a>
          </div>
        </div>

        {/* For Clients */}
        <div className="footer-section">
          <h4>For Clients</h4>
          <ul>
            <li><a href="#find-work">Find Freelancers</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#categories">Browse Categories</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#enterprise">Enterprise</a></li>
          </ul>
        </div>

        {/* For Freelancers */}
        <div className="footer-section">
          <h4>For Freelancers</h4>
          <ul>
            <li><a href="#browse-jobs">Browse Jobs</a></li>
            <li><a href="#get-started">Get Started</a></li>
            <li><a href="#portfolio">Build Portfolio</a></li>
            <li><a href="#awards">Awards & Badges</a></li>
            <li><a href="#earnings">Earnings</a></li>
          </ul>
        </div>

        {/* Company */}
        <div className="footer-section">
          <h4>Company</h4>
          <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#blog">Blog</a></li>
            <li><a href="#careers">Careers</a></li>
            <li><a href="#press">Press</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#community">Community</a></li>
            <li><a href="#safety">Safety & Reporting</a></li>
            <li><a href="#trust">Trust & Security</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>&copy; {currentYear} FreelanceHub. All rights reserved.</p>
        <div className="footer-legal">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
          <a href="#cookies">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
