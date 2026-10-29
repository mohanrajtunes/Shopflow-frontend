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
  const params = new URLSearchParams(location.search);
  const [q, setQ] = useState(params.get("search") || "");
  const [cat, setCat] = useState(params.get("category") || "");

  // Keep the search box in step with the URL (e.g. after clicking a category pill)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setQ(p.get("search") || "");
    setCat(p.get("category") || "");
  }, [location.search]);

  function handleSearch(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("search", q.trim());
    if (cat) p.set("category", cat);
    const qs = p.toString();
    navigate(`/${qs ? `?${qs}` : ""}#shop`);
  }

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

  return (
    <header className="navbar">
      <Link to="/" className="logo" aria-label="ShopFlow home">
        ShopFlow<i aria-hidden="true" />
      </Link>

      <form className="hsearch" role="search" onSubmit={handleSearch}>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search products"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search products"
        />
        <button type="submit" aria-label="Search">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        </button>
      </form>

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
