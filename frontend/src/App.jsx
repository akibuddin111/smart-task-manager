
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import TasksPage from "./pages/TasksPage";
import "./App.css";
import "./styles/components.css";

function AppRoutes() {
  const { token, user, loading } = useAuth();

  if (loading) {
    return <main className="route-loading">Loading your workspace...</main>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={token && user ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          token && user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage mode="login" />
          )
        }
      />

      <Route
        path="/register"
        element={
          token && user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage mode="register" />
          )
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
