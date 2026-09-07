import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, LogIn, LogOut, Menu, User, UserPlus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import NavSearch from "./NavSearch";

export default function Header() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const LINKS = [
    { to: "/biens", label: t("nav.allBiens") },
    { to: "/biens?type_transaction=vente", label: t("nav.buy") },
    { to: "/biens?type_transaction=location", label: t("nav.rent") },
    { to: "/offres", label: t("nav.offers") },
  ];

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setAccountOpen(false);
    navigate("/");
  }

  const initial = (user?.first_name || user?.username || "?").charAt(0).toUpperCase();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="brand">
          <img src="/logo.jpeg" alt="Agharina" className="brand-mark" />
        </Link>

        <nav className="site-nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/biens"}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-spacer" />

        <div className="header-actions">
          <NavSearch />
          <LanguageSwitcher />

          {isAuthenticated ? (
            <div className="header-account-menu" ref={menuRef}>
              <button
                type="button"
                className="header-avatar"
                onClick={() => setAccountOpen((v) => !v)}
                aria-label={t("nav.myAccount")}
                style={{ border: "none", cursor: "pointer" }}
              >
                {initial}
              </button>
              {accountOpen && (
                <div className="header-account-dropdown">
                  <Link to="/mon-compte" onClick={() => setAccountOpen(false)}>
                    <User className="icon-sm" />
                    {t("nav.myAccount")}
                  </Link>
                  <button type="button" onClick={handleLogout}>
                    <LogOut className="icon-sm" />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className="header-auth-buttons">
              <Link to="/connexion" className="btn btn-ghost btn-small">
                <LogIn className="icon-sm" />
                {t("nav.login")}
              </Link>
              <Link to="/inscription" className="btn btn-primary btn-small">
                <UserPlus className="icon-sm" />
                {t("nav.register")}
              </Link>
            </span>
          )}

          <button
            type="button"
            className="header-menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label={t("nav.menu")}
          >
            {open ? <X className="icon" /> : <Menu className="icon" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-nav-panel">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="mobile-nav-link">
              {l.label}
            </Link>
          ))}
          <Link to="/a-propos" onClick={() => setOpen(false)} className="mobile-nav-link">
            {t("nav.about")}
          </Link>
          <Link to="/contact" onClick={() => setOpen(false)} className="mobile-nav-link">
            {t("nav.contact")}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/mon-compte" onClick={() => setOpen(false)} className="mobile-nav-link">
                <LayoutDashboard className="icon-sm" />
                {t("nav.myAccount")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="mobile-nav-link"
              >
                <LogOut className="icon-sm" />
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <div className="mobile-nav-auth">
              <Link to="/connexion" onClick={() => setOpen(false)} className="btn btn-ghost btn-block">
                <LogIn className="icon-sm" />
                {t("nav.login")}
              </Link>
              <Link to="/inscription" onClick={() => setOpen(false)} className="btn btn-primary btn-block">
                <UserPlus className="icon-sm" />
                {t("nav.register")}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
