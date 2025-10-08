import type { ReactNode } from "react";

export interface User {
  id: string;
  username: string;
}

export interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
