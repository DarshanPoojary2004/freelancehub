import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "./Register.css";
import { handleGoogleSignup } from "../services/googleAuthService";
import { register } from "../services/authService";

function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    accountType: searchParams.get("role") || ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Email validation
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.accountType) {
      newErrors.accountType = "Please select an account type";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle traditional registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = await register(formData);
      window.dispatchEvent(new Event("auth:changed"));

      if (formData.accountType === "freelancer") {
        navigate("/profile/edit", {
          state: { loginSuccessMessage: `Welcome to FreelanceHub, ${user.name}! Let's build your professional resume and profile.` }
        });
      } else {
        navigate("/dashboard", {
          state: { loginSuccessMessage: `Welcome to FreelanceHub, ${user.name}! Post your first project or hire talent.` }
        });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Signup
  const handleGoogleSignupSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setErrors({});

    // If account type not selected, show error
    if (!formData.accountType) {
      setErrors({ accountType: "Please select account type first" });
      setIsLoading(false);
      return;
    }

    try {
      const result = await handleGoogleSignup(credentialResponse, formData.accountType);

      if (result.success) {
        setSuccessMessage(`Welcome to FreelanceHub, ${result.user.name}!`);
        console.log("Google signup successful:", result.user);
        
        // TODO: Send token to backend for verification when ready
        // After verification, redirect to dashboard
        setTimeout(() => {
          navigate("/");
          // navigate("/dashboard"); // Uncomment when dashboard is ready
        }, 1500);
      } else {
        setErrors({ google: result.error });
      }
    } catch (error) {
      setErrors({ google: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignupError = () => {
    setErrors({ google: "Google signup failed. Please try again." });
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-logo">
          Freelance<span>Hub</span>
        </div>

        <h1>Create your account</h1>

        <p className="register-description">
          Join FreelanceHub and start building your future
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            ✓ {successMessage}
          </div>
        )}

        {/* Error Messages */}
        {errors.submit && (
          <div className="error-message">
            ✗ {errors.submit}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && (
              <span className="error-text">{errors.fullName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
            <small className="password-hint">Minimum 6 characters</small>
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className={errors.accountType ? "input-error" : ""}
            >
              <option value="">Select account type</option>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
            </select>
            {errors.accountType && (
              <span className="error-text">{errors.accountType}</span>
            )}
          </div>

          <button
            type="submit"
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="register-divider">
          <span>OR</span>
        </div>

        {/* Google Signup Button */}
        <div className="google-signup-container">
          {errors.google && (
            <div className="error-message" style={{ marginBottom: "12px" }}>
              ✗ {errors.google}
            </div>
          )}
          <GoogleLogin
            onSuccess={handleGoogleSignupSuccess}
            onError={handleGoogleSignupError}
            width="100%"
            theme="outline"
            text="signup_with"
            locale="en"
          />
          <small className="google-hint">
            {!formData.accountType && "👆 Please select account type first"}
          </small>
        </div>

        <p className="register-login">
          Already have an account?
          <Link to="/login"> Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;