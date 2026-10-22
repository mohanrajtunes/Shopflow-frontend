import { useEffect, useState } from "react";
import api, { errorText } from "../api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/orders/")
      .then(({ data }) => setOrders(data.results ?? data))
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Loading...</p>;

  return (
    <div>
      <h1>Your orders</h1>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && <p className="muted">No orders yet.</p>}

      {orders.map((order) => (
        <div className="card" key={order.id} style={{ marginBottom: 16 }}>
          <div className="row" style={{ borderBottom: "none", padding: 0 }}>
            <h3>Order #{order.id}</h3>
            <span className="muted">
              {order.status.toUpperCase()} · {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
          {order.items.map((it) => (
            <div className="row" key={it.id}>
              <span>{it.quantity} × {it.product_title}</span>
              <span>₹{(Number(it.price) * it.quantity).toFixed(2)}</span>
            </div>
          ))}
          <p className="price">Total: ₹{Number(order.total_price).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}