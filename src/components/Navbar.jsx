import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";

const linkClass = ({ isActive }) => (isActive ? "active" : "");

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    api.get("/api/categories/")
      .then(({ data }) => setCategories(data.results ?? data))
      .catch(() => {});
  }, []);

  // Cart badge: refresh on navigation and whenever the cart changes
  useEffect(() => {
    if (user?.role !== "customer") {
      setCartCount(0);
      return;
    }
    function load() {
      api.get("/api/cart/")
        .then(({ data }) => {
          const items = data.results ?? data;
          setCartCount(items.reduce((sum, i) => sum + i.quantity, 0));
        })
        .catch(() => {});
    }
    load();
    window.addEventListener("cart:changed", load);
    return () => window.removeEventListener("cart:changed", load);
  }, [user, location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const activeCategory = new URLSearchParams(location.search).get("category");

  return (
    <header className="navbar">
      <Link to="/" className="logo" aria-label="ShopFlow home">
        ShopFlow<i aria-hidden="true" />
      </Link>

      <nav className="cats" aria-label="Categories">
        {categories.slice(0, 5).map((c) => (
          <Link
            key={c.id}
            to={`/?category=${c.id}#shop`}
            className={location.pathname === "/" && String(c.id) === activeCategory ? "active" : ""}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <nav className="account" aria-label="Account">
        {user?.role === "vendor" && <NavLink to="/dashboard" className={linkClass}>My products</NavLink>}
        {user?.role === "customer" && <NavLink to="/orders" className={linkClass}>Orders</NavLink>}
        {user ? (
          <>
            <span className="user-chip" title={user.role}>
              <b>{user.username[0].toUpperCase()}</b>
              {user.username}
            </span>
            <button className="link-btn" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>Log in</NavLink>
            <Link to="/register" className="btn solid small">Create account</Link>
          </>
        )}
        {user?.role === "customer" && (
          <NavLink to="/cart" className="cart-link" aria-label={`Cart, ${cartCount} items`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l-1 12H6L5 8z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </NavLink>
        )}
      </nav>
    </header>
  );
}
