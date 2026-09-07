import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, Eye, EyeOff, Gift, Lock, Mail, Phone, User, UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    telephone: "",
    code_parrain: searchParams.get("code") || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(values);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || t("auth.registerError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <h2>{t("auth.registerHeroTitle")}</h2>
        <p>{t("auth.registerHeroSubtitle")}</p>
      </div>

      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1>{t("auth.registerTitle")}</h1>
          <p className="muted" style={{ marginBottom: "1.25rem" }}>
            {t("auth.registerSubtitle")}
          </p>

          {error && (
            <div className="alert" style={{ marginBottom: "1rem" }}>
              <AlertCircle className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-field-row" style={{ marginBottom: "0.9rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.firstName")}</span>
              <input value={values.first_name} onChange={(e) => set("first_name", e.target.value)} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.lastName")}</span>
              <input value={values.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.username")} *</span>
            <div className="field-icon-wrap">
              <User className="icon-sm" />
              <input value={values.username} onChange={(e) => set("username", e.target.value)} required />
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.email")}</span>
            <div className="field-icon-wrap">
              <Mail className="icon-sm" />
              <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.phone")}</span>
            <div className="field-icon-wrap">
              <Phone className="icon-sm" />
              <input value={values.telephone} onChange={(e) => set("telephone", e.target.value)} placeholder="22212345678" />
            </div>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.password")} *</span>
            <div className="field-icon-wrap">
              <Lock className="icon-sm" />
              <input
                type={showPassword ? "text" : "password"}
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
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

          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("auth.referralCode")}</span>
            <div className="field-icon-wrap">
              <Gift className="icon-sm" />
              <input value={values.code_parrain} onChange={(e) => set("code_parrain", e.target.value)} />
            </div>
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            <UserPlus className="icon-sm" />
            {submitting ? t("auth.creatingAccount") : t("auth.createAccount")}
          </button>

          <div className="auth-switch">
            {t("auth.hasAccount")}{" "}
            <Link to="/connexion" style={{ color: "var(--primary-text)", fontWeight: 600 }}>
              {t("auth.signIn")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
