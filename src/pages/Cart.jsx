import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { money } from "../format";
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
      window.dispatchEvent(new Event("cart:changed"));
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
  const units = items.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <div>
      <div className="page-head">
        <h1>Your cart</h1>
      </div>
      {error && <p className="error">{error}</p>}

      {items.length === 0 && (
        <div className="empty">
          <h2>Your cart is empty.</h2>
          <p className="muted">Add something from the shop and it will show up here.</p>
          <Link className="btn solid" to="/">Browse products</Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="ci-info">
                  <strong>{item.product_title}</strong>
                  <p className="muted">{money(item.product_price)} each</p>
                </div>
                <div className="qty">
                  <button aria-label="Decrease quantity" onClick={() => changeQty(item, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button aria-label="Increase quantity" onClick={() => changeQty(item, item.quantity + 1)}>+</button>
                </div>
                <div className="ci-sub">{money(item.subtotal)}</div>
                <button className="btn danger small" onClick={() => removeItem(item)}>Remove</button>
              </div>
            ))}
          </div>

          <aside className="summary">
            <p className="lbl">Order summary</p>
            <div className="sum-row"><span>Items</span><span>{units}</span></div>
            <div className="sum-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="btn solid block" disabled={busy} onClick={checkout}>
              {busy ? "Placing order..." : "Checkout"}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
