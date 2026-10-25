import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import "./login.css";
import { handleGoogleLogin } from "../services/googleAuthService";
import { login } from "../services/authService";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || "");

  // Email validation
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle traditional login
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const user = await login(email, password);
      window.dispatchEvent(new Event("auth:changed"));
      navigate("/dashboard", { state: { loginSuccessMessage: `Login successful. Welcome back, ${user.name}!` } });
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setErrors({});

    try {
      const result = await handleGoogleLogin(credentialResponse);

      if (result.success) {
        setSuccessMessage(`Welcome back, ${result.user.name}!`);
        console.log("Google login successful:", result.user);
        
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

  const handleGoogleLoginError = () => {
    setErrors({ google: "Google login failed. Please try again." });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          Freelance<span>Hub</span>
        </div>

        <h1>Welcome back</h1>

        <p className="login-description">
          Login to continue to your account
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

        {/* Traditional Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <div className="password-row">
              <label>Password</label>
              <span className="forgot-password">Forgot password?</span>
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errors.password ? "input-error" : ""}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        {/* Google Login Button */}
        <div className="google-login-container">
          {errors.google && (
            <div className="error-message" style={{ marginBottom: "12px" }}>
              ✗ {errors.google}
            </div>
          )}
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={handleGoogleLoginError}
            width="100%"
            theme="outline"
            text="signin"
            locale="en"
          />
        </div>

        <p className="register-text">
          Don't have an account?
          <Link to="/register"> Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;