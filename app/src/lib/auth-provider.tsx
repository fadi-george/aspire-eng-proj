import { useState } from "react";
import { apiClient } from "./api";
import { AuthContext, type User } from "./auth-context";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user`;
    window.location.href = githubAuthUrl;
  };

  const logout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setUser(null);

    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  };

  const getUser = async () => {
    try {
      const response = await apiClient.get("/api/auth/me");

      if (response.ok) {
        const user = await response.json();
        setUser(user);
        return user;
      }

      throw new Error("Failed to fetch user");
    } catch {
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ getUser, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
