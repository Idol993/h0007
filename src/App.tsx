import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store";
import Home from "@/pages/Home";
import ItemDetail from "@/pages/ItemDetail";
import Publish from "@/pages/Publish";
import Profile from "@/pages/Profile";
import Messages from "@/pages/Messages";
import AuthPage from "@/pages/Auth";
import AdminLayout from "@/pages/Admin";

function AppRoutes() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/item/:id" element={<ItemDetail />} />
      <Route path="/publish" element={<Publish />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/user/:id" element={<Profile />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/admin/*" element={<AdminLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
