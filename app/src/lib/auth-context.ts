import type { UserPushSubscription } from "@/shared/types/subscription";
import { createContext, type Dispatch, type SetStateAction } from "react";

export interface User {
  id: string;
  login: string;
  avatar_url: string;
  name: string;
  pushSubscriptions: UserPushSubscription[];
}

export interface AuthContextType {
  getCookie: (code: string) => Promise<boolean>;
  getUser: () => Promise<User | null>;
  setUser: Dispatch<SetStateAction<User | null>>;
  login: () => void;
  logout: () => void;
  user: User | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);
