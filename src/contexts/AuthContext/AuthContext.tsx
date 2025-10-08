import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import type { AuthProviderProps, User } from "../../interfaces/authContext";
import { AuthContext } from "./AuthContextValue";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = Cookies.get("access_token");
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        setUser({
          id: decoded.id,
          username: decoded.username,
        });
      } catch (err) {
        console.error("Invalid token:", err);
        Cookies.remove("access_token");
        setUser(null);
      }
    }
  }, []);

  const logout = () => {
    Cookies.remove("access_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
