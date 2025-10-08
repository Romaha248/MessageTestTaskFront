import { Route, Routes } from "react-router-dom";
import RegisterPage from "../auth/RegisterPage";
import LoginPage from "../auth/LoginPage";
import HomePage from "../HomePage";
import ChatPage from "../chats/ChatPage";
import ProtectedRoute from "../ProtectedRoute";

function AllRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default AllRoutes;
