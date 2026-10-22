import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Products from "./pages/Products";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import VendorDashboard from "./pages/VendorDashboard";

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/cart"
            element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>}
          />
          <Route
            path="/orders"
            element={<ProtectedRoute role="customer"><Orders /></ProtectedRoute>}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>}
          />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}