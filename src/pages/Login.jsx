import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errorText } from "../api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default page reload
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-art">
        <h2>Welcome<br />back.</h2>
        <p>Pick up your cart, check your orders or manage your products.</p>
      </div>
      <form className="form" onSubmit={handleSubmit}>
        <h1>Log in</h1>
        <label>
          <span className="lbl">Username</span>
          <input name="username" placeholder="Your username" value={form.username} onChange={handleChange} autoComplete="username" required />
        </label>
        <label>
          <span className="lbl">Password</span>
          <input name="password" type="password" placeholder="Your password" value={form.password} onChange={handleChange} autoComplete="current-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn solid block" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        <p className="muted">No account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}
