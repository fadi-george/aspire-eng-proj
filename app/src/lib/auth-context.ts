import { createContext } from "react";

export interface User {
  id: string;
  login: string;
  avatar_url: string;
}

export interface AuthContextType {
  getUser: () => Promise<User | null>;
  login: () => void;
  logout: () => void;
  user: User | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);
