import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || t("auth.invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <h2>{t("auth.loginHeroTitle")}</h2>
        <p>{t("auth.loginHeroSubtitle")}</p>
      </div>

      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>{t("auth.loginTitle")}</h1>
          <p className="muted" style={{ marginBottom: "1.25rem" }}>
            {t("auth.loginSubtitle")}
          </p>

          {error && (
            <div className="alert" style={{ marginBottom: "1rem" }}>
              <AlertCircle className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.username")}</span>
            <div className="field-icon-wrap">
              <User className="icon-sm" />
              <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.password")}</span>
            <div className="field-icon-wrap">
              <Lock className="icon-sm" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="has-trailing-icon"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={t("auth.togglePassword")}
              >
                {showPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
              </button>
            </div>
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            <LogIn className="icon-sm" />
            {submitting ? t("auth.loggingIn") : t("auth.login")}
          </button>

          <div className="auth-switch">
            {t("auth.noAccount")}{" "}
            <Link to="/inscription" style={{ color: "var(--primary-text)", fontWeight: 600 }}>
              {t("auth.createOne")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
