import axios from "axios";
import { useState, useEffect } from "react";
import i18n from "../i18n";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const serverURL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    setIsAuthenticated(!!token);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const lang = i18n.language === "en" ? "en" : "ar";
      const response = await axios.post(
        `${serverURL}/api/auth/login`,
        { username, password },
        {
          headers: {
            "Accept-Language": lang,
            "X-Language": lang,
          },
        }
      );

      if (response.data && response.data.token) {
        localStorage.setItem("admin_token", response.data.token);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}
