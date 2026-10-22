import { useEffect, useState } from "react";
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
      <h1>My products</h1>

      <form className="card" onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        <h3>{editingId ? "Edit product" : "Add a product"}</h3>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" rows={3} value={form.description} onChange={handleChange} required />
        <input name="price" type="number" step="0.01" min="0" placeholder="Price" value={form.price} onChange={handleChange} required />
        <input name="stock" type="number" min="0" placeholder="Stock" value={form.stock} onChange={handleChange} required />
        <select name="category" value={form.category} onChange={handleChange}>
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="upload-box">
          <label className="muted">Product image</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={uploading} />
          {uploading && <p className="muted">Uploading...</p>}
          {form.image_url && !uploading && (
            <div className="preview">
              <img src={optimized(form.image_url, 300)} alt="Preview" />
              <button type="button" className="btn secondary" onClick={() => setForm({ ...form, image_url: "" })}>
                Remove image
              </button>
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <div>
          <button className="btn" disabled={uploading}>
            {editingId ? "Save changes" : "Create product"}
          </button>{" "}
          {editingId && <button type="button" className="btn secondary" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      {products.length === 0 && <p className="muted">You haven't added any products yet.</p>}
      {products.map((p) => (
        <div className="row" key={p.id}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {p.image_url && <img className="mini-thumb" src={optimized(p.image_url, 100)} alt={p.title} />}
            <div>
              <strong>{p.title}</strong>
              <p className="muted">₹{Number(p.price).toFixed(2)} · {p.stock} in stock · {p.category_name || "No category"}</p>
            </div>
          </div>
          <div>
            <button className="btn secondary" onClick={() => startEdit(p)}>Edit</button>{" "}
            <button className="btn danger" onClick={() => removeProduct(p)}>Delete</button>
          </div>
        </div>
      ))}

      <div className="pagination">
        <button className="btn secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {page}</span>
        <button className="btn secondary" disabled={!hasNext} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}