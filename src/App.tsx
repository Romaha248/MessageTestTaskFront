import "./App.css";
import Navbar from "./components/Navbar";
import AllRoutes from "./components/routing/AllRoutes";
import { AuthProvider } from "./contexts/AuthContext/AuthContext";

function App() {
  return (
    <>
      <AuthProvider>
        <Navbar />
        <AllRoutes />
      </AuthProvider>
    </>
  );
}

export default App;
