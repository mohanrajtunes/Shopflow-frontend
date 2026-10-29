import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";
import api from "./api";

const AuthContext = createContext(null);

function loadUser() {
  try {
    if (!localStorage.getItem("refresh")) return null;
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  async function login(username, password) {
    const { data } = await api.post("/api/token/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    const claims = jwtDecode(data.access);
    const me = { id: claims.user_id, username: claims.username, role: claims.role };
    localStorage.setItem("user", JSON.stringify(me));
    setUser(me);
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
