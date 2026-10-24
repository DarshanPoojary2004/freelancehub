import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./App.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FindWork from "./pages/FindWork";
import HireTalent from "./pages/HireTalent";
import FreelancerProfile from "./pages/FreelancerProfile";
import FreelancerProfileEditor from "./pages/FreelancerProfileEditor";
import Dashboard from "./pages/Dashboard";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  if (!googleClientId) {
    console.warn("Google Client ID is not set. Set VITE_GOOGLE_CLIENT_ID in .env file");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || "dummy-client-id"}>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/find-work" element={<FindWork />} />
          <Route path="/hire-talent" element={<HireTalent />} />
          <Route path="/freelancers/:id" element={<FreelancerProfile />} />
          <Route path="/profile" element={<FreelancerProfileEditor />} />
          <Route path="/profile/edit" element={<FreelancerProfileEditor />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;