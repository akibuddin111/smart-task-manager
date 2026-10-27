
import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { AuthContext } from "./authContextValue";

const TOKEN_KEY = "smart_task_manager_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const result = await apiRequest("/auth/me", { token });

        if (!cancelled) {
          setUser(result.user);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);

        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function saveSession(result) {
    localStorage.setItem(TOKEN_KEY, result.token);
    setUser(result.user);
    setToken(result.token);
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{ token, user, loading, saveSession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
