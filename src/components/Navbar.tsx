import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();

  const linkClass = (path: string) =>
    `px-4 py-2 rounded hover:bg-blue-100 transition ${
      location.pathname === path ? "bg-blue-200 font-bold" : ""
    }`;

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center border-b border-black">
      <div className="text-xl font-bold">MessengerApp</div>
      <div className="flex space-x-2">
        {!isLoggedIn && (
          <>
            <Link to="/" className={linkClass("/")}>
              Home
            </Link>
            <Link to="/register" className={linkClass("/register")}>
              Register
            </Link>
            <Link to="/login" className={linkClass("/login")}>
              Login
            </Link>
          </>
        )}

        {isLoggedIn && (
          <>
            <Link to="/chats" className={linkClass("/")}>
              Chats
            </Link>
            <span className="px-2 py-1 text-gray-700 font-medium">
              {user?.username}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 rounded hover:bg-red-100 transition text-red-500"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
