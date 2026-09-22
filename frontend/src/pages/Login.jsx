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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
          <ShieldIcon className="w-6 h-6 text-white" />
        </div>

        <h1 className="mt-3 text-xl font-bold text-slate-900 tracking-tight">
          Phishing Trap AI
        </h1>

        <p className="text-sm text-slate-500">
          Employee Portal
        </p>
      </div>

      <Card className="w-full max-w-[420px] p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Sign in to access your security awareness training.
        </p>

        {formError && (
          <div
            role="alert"
            className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
          >
            <p className="text-sm text-red-700">
              {formError}
            </p>
          </div>
        )}

        <form
          className="mt-6 space-y-5"
          noValidate
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Work Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your work email"
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
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                ${
                  fieldErrors.email
                    ? "border-red-400"
                    : "border-slate-300"
                }`}
            />

            {fieldErrors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-xs text-red-600"
              >
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Password
            </label>

            <div className="relative">
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
                className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
                  ${
                    fieldErrors.password
                      ? "border-red-400"
                      : "border-slate-300"
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
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4.5 h-4.5" />
                ) : (
                  <EyeIcon className="w-4.5 h-4.5" />
                )}
              </button>
            </div>

            {fieldErrors.password && (
              <p
                id="password-error"
                className="mt-1.5 text-xs text-red-600"
              >
                {fieldErrors.password}
              </p>
            )}

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <LockIcon className="w-3.5 h-3.5" />
          <span>Authorized employees only.</span>
        </div>
      </Card>

      <p className="mt-6 text-xs text-slate-400">
        Phishing Trap AI • Employee Portal
      </p>
    </div>
  );
};
export default Login;