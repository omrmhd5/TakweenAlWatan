import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAuthenticated(!!token);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication - in production, this would call your API
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('admin_token', 'mock_token');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, login, logout };
}