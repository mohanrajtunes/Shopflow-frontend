import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { money } from "../format";
import api, { errorText } from "../api";
import { useAuth } from "../AuthContext";
import { optimized } from "../upload";

const PAGE_SIZE = 10;
const emptyFilters = { search: "", category: "", min_price: "", max_price: "", ordering: "-created_at" };

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const urlSearch = searchParams.get("search") || "";
  const startFilters = { ...emptyFilters, category: urlCategory, search: urlSearch };

  const [featured, setFeatured] = useState([]);
  const featuredLoaded = useRef(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(startFilters);
  const [filters, setFilters] = useState(startFilters);
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
        const unfiltered = Object.entries(filters).every(([k, v]) => v === emptyFilters[k]);
        if (!featuredLoaded.current && unfiltered && page === 1) {
          featuredLoaded.current = true;
          setFeatured(data.results.slice(0, 3));
        }
      })
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [page, filters]);

  // Keep the category filter in sync with the URL (navbar links, back button)
  useEffect(() => {
    const sync = (f) => (f.category === urlCategory && f.search === urlSearch ? f : { ...f, category: urlCategory, search: urlSearch });
    setFilters(sync);
    setForm(sync);
    setPage(1);
  }, [urlCategory, urlSearch]);

  useEffect(() => {
    if (location.hash === "#shop") {
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, location.search]);

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
    const qs = {};
    if (form.category) qs.category = form.category;
    if (form.search) qs.search = form.search;
    setSearchParams(qs);
  }

  function resetFilters() {
    setForm(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
    setSearchParams({});
  }

  function selectCategory(id) {
    const next = { ...filters, category: id };
    setForm(next);
    setFilters(next);
    setPage(1);
    const qs = {};
    if (id) qs.category = id;
    if (filters.search) qs.search = filters.search;
    setSearchParams(qs);
  }

  async function addToCart(product) {
    if (!user) return navigate("/login");
    setMessage("");
    try {
      await api.post("/api/cart/", { product: product.id, quantity: 1 });
      setMessage(`Added "${product.title}" to your cart`);
      window.dispatchEvent(new Event("cart:changed"));
    } catch (err) {
      if (err.response?.status === 400) {
        try {
          const { data } = await api.get("/api/cart/");
          const item = (data.results ?? data).find((i) => i.product === product.id);
          if (item) {
            await api.patch(`/api/cart/${item.id}/`, { quantity: item.quantity + 1 });
            setMessage(`Updated "${product.title}" quantity in your cart`);
            window.dispatchEvent(new Event("cart:changed"));
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

  const activeCat = categories.find((c) => String(c.id) === String(filters.category));

  return (
    <div>
      <section className="hero">
        <div className="hero-copy">
          <h1>Shop from independent vendors.</h1>
          <p className="lead">
            Fashion, electronics, beauty, books and everyday essentials, sold directly by independent sellers.
          </p>
          <div className="hero-cta">
            <a className="btn light-solid" href="#shop">Shop all products</a>
            {!user && <Link className="btn outline-light" to="/register">Create account</Link>}
          </div>
        </div>
        <div className="collage" aria-label="New in the shop">
          {(featured.length ? featured : [null, null, null]).map((p, i) => (
            <a key={p ? p.id : i} href="#shop" className={`tile t${i}`} data-c={p ? p.id % 4 : i}>
              {p && (
                <>
                  <span className="tile-letter">{(p.category_name || p.title)[0].toUpperCase()}</span>
                  {p.image_url && (
                    <img
                      src={optimized(p.image_url, 700)}
                      alt=""
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <span className="tile-cap">
                    <b>{p.title}</b>
                    <em>{money(p.price)}</em>
                  </span>
                </>
              )}
            </a>
          ))}
        </div>
      </section>

      <div className="section-head" id="shop">
        <h2>{filters.search ? `Results for “${filters.search}”` : activeCat ? activeCat.name : "All products"}</h2>
        <p className="muted">{loading ? "" : `${count} ${count === 1 ? "product" : "products"}`}</p>
      </div>

      <div className="pills" role="tablist" aria-label="Filter by category">
        <button className={!filters.category ? "pill on" : "pill"} onClick={() => selectCategory("")}>All</button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={String(filters.category) === String(c.id) ? "pill on" : "pill"}
            onClick={() => selectCategory(String(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>

      <form className="filters" onSubmit={applyFilters}>
        <input className="narrow" name="min_price" type="number" placeholder="Min ₹" value={form.min_price} onChange={handleChange} aria-label="Minimum price" />
        <input className="narrow" name="max_price" type="number" placeholder="Max ₹" value={form.max_price} onChange={handleChange} aria-label="Maximum price" />
        <select name="ordering" value={form.ordering} onChange={handleChange} aria-label="Sort">
          <option value="-created_at">Newest</option>
          <option value="price">Price: low to high</option>
          <option value="-price">Price: high to low</option>
        </select>
        <button className="btn solid">Apply</button>
        <button type="button" className="btn ghost" onClick={resetFilters}>Reset</button>
      </form>

      {message && (
        <div className="toast" role="status">
          <span>{message}</span>
          {user?.role === "customer" && <Link to="/cart">View cart</Link>}
        </div>
      )}
      {error && <p className="error">{error}</p>}

      {loading && (
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="pcard skeleton"><div className="pimg" /><div className="sk-line" /><div className="sk-line short" /></div>
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="empty">
          <h2>No products found</h2>
          <p className="muted">Try a different search or clear your filters.</p>
          <button className="btn solid" onClick={resetFilters}>Clear filters</button>
        </div>
      )}

      {!loading && (
        <div className="grid">
          {products.map((p) => (
            <article className="pcard" key={p.id}>
              <div className="pimg" data-c={p.id % 4}>
                <span className="pletter">{(p.category_name || p.title)[0].toUpperCase()}</span>
                {p.image_url && (
                  <img
                    src={optimized(p.image_url)}
                    alt={p.title}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                {p.stock <= 3 && (
                  <span className={p.stock === 0 ? "stock out" : "stock low"}>
                    {p.stock === 0 ? "Sold out" : `Only ${p.stock} left`}
                  </span>
                )}
                {(!user || user.role === "customer") && (
                  <button className="quick" disabled={p.stock === 0} onClick={() => addToCart(p)}>
                    {p.stock === 0 ? "Sold out" : "Add to cart"}
                  </button>
                )}
              </div>
              <div className="pinfo">
                <div>
                  <h3>{p.title}</h3>
                  <p className="pcat">{p.category_name || "General"} · by {p.vendor_username}</p>
                </div>
                <span className="price">{money(p.price)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="btn ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
