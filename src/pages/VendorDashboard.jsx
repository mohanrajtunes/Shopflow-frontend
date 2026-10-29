import { useEffect, useState } from "react";
import { money } from "../format";
import api, { errorText } from "../api";
import { useAuth } from "../AuthContext";
import { uploadImage, optimized } from "../upload";

const emptyForm = { title: "", description: "", price: "", stock: "", category: "", image_url: "" };
const MAX_MB = 5;

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadProducts() {
    try {
      const { data } = await api.get("/api/products/", { params: { vendor: user.id, page } });
      setProducts(data.results);
      setHasNext(Boolean(data.next));
    } catch (err) {
      setError(errorText(err));
    }
  }

  useEffect(() => {
    api.get("/api/categories/")
      .then(({ data }) => setCategories(data.results ?? data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      return setError("Please choose an image file (JPG, PNG or WebP).");
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return setError(`Image is too large. Maximum size is ${MAX_MB} MB.`);
    }

    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = ""; // lets you pick the same file again
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    const payload = {
      title: form.title,
      description: form.description,
      price: form.price,
      stock: Number(form.stock),
      category: form.category || null,
      image_url: form.image_url,
    };
    try {
      if (editingId) {
        await api.patch(`/api/products/${editingId}/`, payload);
        setMessage("Product updated.");
      } else {
        await api.post("/api/products/", payload);
        setMessage("Product created.");
      }
      setForm(emptyForm);
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setError(errorText(err));
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category ?? "",
      image_url: p.image_url ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function removeProduct(p) {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    setError("");
    try {
      await api.delete(`/api/products/${p.id}/`);
      loadProducts();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>My products</h1>
      </div>

      <div className="dash">
        <form className="panel" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit product" : "Add a product"}</h3>
          <label>
            <span className="lbl">Title</span>
            <input name="title" placeholder="Product title" value={form.title} onChange={handleChange} required />
          </label>
          <label>
            <span className="lbl">Description</span>
            <textarea name="description" placeholder="What is it?" rows={3} value={form.description} onChange={handleChange} required />
          </label>
          <div className="two">
            <label>
              <span className="lbl">Price (₹)</span>
              <input name="price" type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={handleChange} required />
            </label>
            <label>
              <span className="lbl">Stock</span>
              <input name="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={handleChange} required />
            </label>
          </div>
          <label>
            <span className="lbl">Category</span>
            <select name="category" value={form.category} onChange={handleChange}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <div className="upload-box">
            <span className="lbl">Product image</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={uploading} />
            {uploading && <p className="muted">Uploading...</p>}
            {form.image_url && !uploading && (
              <div className="preview">
                <img src={optimized(form.image_url, 300)} alt="Preview" />
                <button type="button" className="btn ghost small" onClick={() => setForm({ ...form, image_url: "" })}>
                  Remove image
                </button>
              </div>
            )}
          </div>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}
          <div className="form-actions">
            <button className="btn solid" disabled={uploading}>
              {editingId ? "Save changes" : "Create product"}
            </button>
            {editingId && <button type="button" className="btn ghost" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>

        <div className="my-list">
          {products.length === 0 && (
            <div className="empty">
              <h2>No products yet.</h2>
              <p className="muted">You haven't added any products yet. Use the form to add your first one.</p>
            </div>
          )}
          {products.map((p) => (
            <div className="my-item" key={p.id}>
              <div className="mi-thumb" data-c={p.id % 4}>
                {p.image_url ? <img src={optimized(p.image_url, 100)} alt={p.title} /> : <span>{(p.category_name || p.title)[0].toUpperCase()}</span>}
              </div>
              <div className="mi-info">
                <strong>{p.title}</strong>
                <p className="muted">{money(p.price)} · {p.stock} in stock · {p.category_name || "No category"}</p>
              </div>
              <div className="mi-actions">
                <button className="btn ghost small" onClick={() => startEdit(p)}>Edit</button>
                <button className="btn danger small" onClick={() => removeProduct(p)}>Delete</button>
              </div>
            </div>
          ))}

          <div className="pagination">
            <button className="btn ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
            <span className="lbl">Page {page}</span>
            <button className="btn ghost" disabled={!hasNext} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
