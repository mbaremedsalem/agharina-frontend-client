import { Navigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">{t("common.loading")}</div>;
  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }
  return children;
}
