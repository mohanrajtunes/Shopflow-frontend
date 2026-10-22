import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorText } from "../api";
import { useAuth } from "../AuthContext";

const PAGE_SIZE = 10;
const emptyFilters = { search: "", category: "", min_price: "", max_price: "", ordering: "-created_at" };

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/api/categories/")
      .then(({ data }) => setCategories(data.results ?? data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = { page };
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "") params[key] = value;
    });

    setLoading(true);
    setError("");
    api.get("/api/products/", { params })
      .then(({ data }) => {
        setProducts(data.results);
        setCount(data.count);
      })
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [page, filters]);

  // Toast disappears after 2.5 seconds
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(t);
  }, [message]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function applyFilters(e) {
    e.preventDefault();
    setPage(1);
    setFilters(form);
  }

  function resetFilters() {
    setForm(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }

  async function addToCart(product) {
    if (!user) return navigate("/login");
    setMessage("");
    try {
      await api.post("/api/cart/", { product: product.id, quantity: 1 });
      setMessage(`Added "${product.title}" to your cart`);
    } catch (err) {
      if (err.response?.status === 400) {
        try {
          const { data } = await api.get("/api/cart/");
          const item = (data.results ?? data).find((i) => i.product === product.id);
          if (item) {
            await api.patch(`/api/cart/${item.id}/`, { quantity: item.quantity + 1 });
            setMessage(`Updated "${product.title}" quantity in your cart`);
            return;
          }
        } catch (err2) {
          return setMessage(errorText(err2));
        }
      }
      setMessage(errorText(err));
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div>
      <section className="hero">
        <h1>Shop from independent vendors</h1>
        <p className="muted">Browse products, add them to your cart and check out securely.</p>
      </section>

      <form className="filters" onSubmit={applyFilters}>
        <input name="search" placeholder="Search..." value={form.search} onChange={handleChange} />
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="min_price" type="number" placeholder="Min price" value={form.min_price} onChange={handleChange} style={{ width: 110 }} />
        <input name="max_price" type="number" placeholder="Max price" value={form.max_price} onChange={handleChange} style={{ width: 110 }} />
        <select name="ordering" value={form.ordering} onChange={handleChange}>
          <option value="-created_at">Newest</option>
          <option value="price">Price: low to high</option>
          <option value="-price">Price: high to low</option>
        </select>
        <button className="btn">Apply</button>
        <button type="button" className="btn secondary" onClick={resetFilters}>Reset</button>
      </form>

      {message && <div className="toast">{message}</div>}
      {error && <p className="error">{error}</p>}

      {loading && (
        <div className="grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="muted">No products found.</p>
      )}

      {!loading && (
        <div className="grid">
          {products.map((p, i) => (
            <div
              className="card product-card fade-up"
              style={{ animationDelay: `${i * 70}ms` }}
              key={p.id}
            >
              <div className="thumb">{(p.category_name || p.title)[0].toUpperCase()}</div>
              <span className="badge">{p.category_name || "General"}</span>
              <h3>{p.title}</h3>
              <p className="muted desc">{p.description}</p>
              <p className="muted">Sold by {p.vendor_username}</p>
              <div className="card-footer">
                <span className="price">₹{Number(p.price).toFixed(2)}</span>
                <span className={p.stock <= 3 ? "badge low" : "badge"}>
                  {p.stock === 0 ? "Out of stock" : p.stock <= 3 ? `Only ${p.stock} left` : "In stock"}
                </span>
              </div>
              {(!user || user.role === "customer") && (
                <button className="btn" disabled={p.stock === 0} onClick={() => addToCart(p)}>
                  Add to cart
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pagination">
        <button className="btn secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}