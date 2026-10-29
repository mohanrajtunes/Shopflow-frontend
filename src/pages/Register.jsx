import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorText } from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/register/", form);
      navigate("/login");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-art alt">
        <h2>Buy or<br />sell.</h2>
        <p>Customers browse and check out. Vendors list and manage their own products.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <h1>Create account</h1>
        <label>
          <span className="lbl">Username</span>
          <input name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} autoComplete="username" required />
        </label>
        <label>
          <span className="lbl">Email</span>
          <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" required />
        </label>
        <label>
          <span className="lbl">Password</span>
          <input name="password" type="password" placeholder="Choose a password" value={form.password} onChange={handleChange} autoComplete="new-password" required />
        </label>
        <label>
          <span className="lbl">I want to</span>
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="customer">Customer (buy products)</option>
            <option value="vendor">Vendor (sell products)</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn solid block" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
        <p className="muted">Already registered? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
