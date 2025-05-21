import { useState } from "react";
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
      await fetch("http://localhost:4000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setUser(null);
    window.location.href = "/login";
  };

  const getUser = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        setUser(user);
        return user;
      }

      throw new Error("Failed to fetch user");
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ getUser, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
