import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken as persistToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    persistToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    return api.get("/profil/").then((data) => {
      setUser(data);
      return data;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get("/profil/")
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  async function login(username, password) {
    const data = await api.post("/connexion/", { username, password });
    persistToken(data.token);
    setTokenState(data.token);
  }

  async function register(payload) {
    const data = await api.post("/inscription/", payload);
    persistToken(data.token);
    setTokenState(data.token);
    return data;
  }

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise dans un AuthProvider");
  return ctx;
}
