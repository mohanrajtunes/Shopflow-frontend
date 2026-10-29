import { Routes, Route, Link } from "react-router-dom";
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
          <Route
            path="*"
            element={
              <div className="empty">
                <h1>Page not found</h1>
                <p className="muted">The page you're looking for doesn't exist or has moved.</p>
                <Link className="btn solid" to="/">Back to shop</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="footer">
        <div className="foot-inner">
          <div>
            <p className="foot-logo">ShopFlow</p>
            <p className="foot-note">Fashion, electronics, beauty, books and everyday essentials from independent sellers.</p>
          </div>
          <div className="foot-links">
            <Link to="/">Shop</Link>
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
          </div>
        </div>
        <p className="foot-copy">© 2026 ShopFlow</p>
      </footer>
    </>
  );
}
