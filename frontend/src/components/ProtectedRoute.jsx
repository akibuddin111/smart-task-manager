import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <main className="route-loading">Loading your workspace...</main>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}