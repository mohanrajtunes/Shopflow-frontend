import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorText } from "../api";

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadCart() {
    try {
      const { data } = await api.get("/api/cart/");
      setItems(data.results ?? data);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function changeQty(item, qty) {
    if (qty < 1) return;
    setError("");
    try {
      await api.patch(`/api/cart/${item.id}/`, { quantity: qty });
      loadCart();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function removeItem(item) {
    setError("");
    try {
      await api.delete(`/api/cart/${item.id}/`);
      loadCart();
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/orders/checkout/");
      navigate("/orders");
    } catch (err) {
      setError(errorText(err)); // e.g. "Insufficient stock for ..."
    } finally {
      setBusy(false);
    }
  }

  const total = items.reduce((sum, i) => sum + Number(i.subtotal), 0);

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <div>
      <h1>Your cart</h1>
      {error && <p className="error">{error}</p>}
      {items.length === 0 && <p className="muted">Your cart is empty.</p>}

      {items.map((item) => (
        <div className="row" key={item.id}>
          <div>
            <strong>{item.product_title}</strong>
            <p className="muted">₹{Number(item.product_price).toFixed(2)} each</p>
          </div>
          <div>
            <button className="btn secondary" onClick={() => changeQty(item, item.quantity - 1)}>−</button>
            <span style={{ margin: "0 12px" }}>{item.quantity}</span>
            <button className="btn secondary" onClick={() => changeQty(item, item.quantity + 1)}>+</button>
          </div>
          <div>₹{Number(item.subtotal).toFixed(2)}</div>
          <button className="btn danger" onClick={() => removeItem(item)}>Remove</button>
        </div>
      ))}

      {items.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>Total: ₹{total.toFixed(2)}</h2>
          <button className="btn" disabled={busy} onClick={checkout}>
            {busy ? "Placing order..." : "Checkout"}
          </button>
        </div>
      )}
    </div>
  );
}