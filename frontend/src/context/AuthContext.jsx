import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Khởi động: hỏi /auth/me để khôi phục phiên từ cookie
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data || null))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  // rememberMe: true -> cookie 7 ngày; false -> session cookie (auto logout khi đóng trình duyệt)
  const login = async (email, password, rememberMe = false) => {
    const res = await api.post("/auth/login", { email, password, rememberMe });
    setUser(res.data.user);
    return res.data.user; // để Login.jsx điều hướng theo role
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
  };

  const isAdmin = () => user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{ user, ready, login, register, logout, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
