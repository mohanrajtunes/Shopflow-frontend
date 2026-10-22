import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        Shop<span style={{ color: "var(--accent)" }}>Flow</span>
      </Link>
      <nav>
        <Link to="/">Products</Link>
        {user?.role === "customer" && (
          <>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">Orders</Link>
          </>
        )}
        {user?.role === "vendor" && <Link to="/dashboard">My Products</Link>}
        {user ? (
          <>
            <span className="muted">{user.username} ({user.role})</span>
            <button className="btn secondary" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}