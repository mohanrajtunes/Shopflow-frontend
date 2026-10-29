import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../format";
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
      <div className="page-head">
        <h1>Your orders</h1>
      </div>
      {error && <p className="error">{error}</p>}

      {orders.length === 0 && (
        <div className="empty">
          <h2>No orders yet.</h2>
          <p className="muted">Once you check out, your orders appear here.</p>
          <Link className="btn solid" to="/">Start shopping</Link>
        </div>
      )}

      <div className="orders">
        {orders.map((order) => (
          <article className="order" key={order.id}>
            <header className="order-head">
              <h3>Order #{order.id}</h3>
              <span className={`status status-${order.status}`}>{order.status}</span>
              <span className="lbl">{new Date(order.created_at).toLocaleDateString()}</span>
            </header>
            <div className="order-items">
              {order.items.map((it) => (
                <div className="order-line" key={it.id}>
                  <span>{it.quantity} × {it.product_title}</span>
                  <span>{money(Number(it.price) * it.quantity)}</span>
                </div>
              ))}
            </div>
            <footer className="order-foot">
              <span className="lbl">Total</span>
              <strong>{money(order.total_price)}</strong>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
