import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function InvitePage() {
  const { code } = useParams();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Navigate to={`/inscription?code=${encodeURIComponent(code)}`} replace />;
}
