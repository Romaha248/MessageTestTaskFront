import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import type { ProtectedRouteProps } from "../interfaces/protect";

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = Cookies.get("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
