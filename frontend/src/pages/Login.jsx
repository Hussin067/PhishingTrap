import React, { useState } from "react";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import { loginEmployee } from "../services/api";
import { useNavigate } from "react-router";

const ShieldIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
    <path d="m9.5 12 1.8 1.8L14.8 10" />
  </svg>
);

const LockIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MailIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-3.27 2.8A9.13 9.13 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 4.22-5.94" />
    <path d="M1 1l22 22" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = "Please enter your work email.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");

    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const employee = await loginEmployee(email.trim(), password);

      console.log("Logged in employee:", employee);

      localStorage.setItem("employee", JSON.stringify(employee));

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);

      setFormError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (event) => {
    event.preventDefault();
  };

  return (
    <div className="relative min-h-screen bg-ink-950 flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background cyber grid & glow orbs */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[100px]" />

      {/* Brand Header */}
      <div className="relative z-10 flex flex-col items-center mb-8 animate-fade-down">
        <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-glow-brand animate-float">
          <ShieldIcon className="w-7 h-7 text-white" />
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
          Phishing Trap <span className="text-gradient">AI</span>
        </h1>

        <p className="mt-1 text-sm font-medium text-ink-300">
          Enterprise Security Awareness Portal
        </p>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
        <Card className="relative overflow-hidden rounded-3xl !bg-ink-900/85 backdrop-blur-xl border border-white/10 shadow-elevated p-6 sm:p-8">
          {/* Subtle top card glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-600" />

          <h2 className="text-2xl font-bold text-white font-heading">
            Welcome back
          </h2>

          <p className="mt-1 text-sm text-ink-300">
            Sign in to access your security awareness training.
          </p>

          {formError && (
            <div
              role="alert"
              className="mt-5 bg-danger-500/10 border border-danger-500/30 rounded-xl px-4 py-3 flex items-start gap-2.5 animate-fade-up"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-danger-400 flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
              </svg>
              <p className="text-sm text-danger-300 leading-snug">
                {formError}
              </p>
            </div>
          )}

          <form
            className="mt-6 space-y-5"
            noValidate
            onSubmit={handleSubmit}
          >
            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-300 mb-2"
              >
                Work Email
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-ink-400">
                  <MailIcon className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: "",
                      }));
                    }

                    if (formError) {
                      setFormError("");
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-white placeholder:text-ink-400 bg-ink-950/60
                    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      fieldErrors.email
                        ? "border-danger-500 ring-1 ring-danger-500/40"
                        : "border-white/10 hover:border-white/20"
                    }`}
                />
              </div>

              {fieldErrors.email && (
                <p
                  id="email-error"
                  className="mt-1.5 text-xs text-danger-400 font-medium"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-ink-300 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-ink-400">
                  <LockIcon className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: "",
                      }));
                    }

                    if (formError) {
                      setFormError("");
                    }
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? "password-error"
                      : undefined
                  }
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-white placeholder:text-ink-400 bg-ink-950/60
                    focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      fieldErrors.password
                        ? "border-danger-500 ring-1 ring-danger-500/40"
                        : "border-white/10 hover:border-white/20"
                    }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-ink-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-xs text-danger-400 font-medium"
                >
                  {fieldErrors.password}
                </p>
              )}

              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
            <LockIcon className="w-3.5 h-3.5 text-accent-400" />
            <span>Authorized personnel & employees only</span>
          </div>
        </Card>
      </div>

      <p className="relative z-10 mt-8 text-xs text-ink-400">
        Phishing Trap AI • Enterprise Security Platform
      </p>
    </div>
  );
};

export default Login;