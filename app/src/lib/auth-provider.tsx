import { useState } from "react";
import { AuthContext, type User } from "./auth-context";

export const TOKEN_KEY = "authToken";

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI =
  import.meta.env.VITE_GITHUB_REDIRECT_URI ||
  "http://localhost:3000/login/callback";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = () => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=user`;
    window.location.href = githubAuthUrl;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    window.location.href = "/login";
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const getUser = async () => {
    const token = getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch("http://localhost:4000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    <AuthContext.Provider value={{ getToken, getUser, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
