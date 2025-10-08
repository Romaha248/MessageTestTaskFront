import { createContext } from "react";
import type { AuthContextType } from "../../interfaces/authContext";

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
