import axios from "axios";
import { useState, useEffect } from "react";
import i18n, { normalizeLanguage } from "../i18n";
import { BACKEND_URL } from "../lib/backend";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const serverURL = BACKEND_URL;

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    setIsAuthenticated(!!token);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
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
