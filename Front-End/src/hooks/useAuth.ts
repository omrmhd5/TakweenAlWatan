import axios from "axios";
import { useState, useEffect } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const serverURL = "https://takweenalwatan.fly.dev";

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    setIsAuthenticated(!!token);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await axios.post(`${serverURL}/api/auth/login`, {
        username,
        password,
      });

      if (response.data && response.data.token) {
        localStorage.setItem("admin_token", response.data.token);
        setIsAuthenticated(true);
        return true;
      } else {
        console.error("No token received from server");
        return false;
      }
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
