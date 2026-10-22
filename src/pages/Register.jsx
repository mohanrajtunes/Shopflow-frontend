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
    <form className="form" onSubmit={handleSubmit}>
      <h1>Create account</h1>
      <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
      <select name="role" value={form.role} onChange={handleChange}>
        <option value="customer">Customer (buy products)</option>
        <option value="vendor">Vendor (sell products)</option>
      </select>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? "Creating..." : "Register"}</button>
      <p className="muted">Already registered? <Link to="/login">Login</Link></p>
    </form>
  );
}