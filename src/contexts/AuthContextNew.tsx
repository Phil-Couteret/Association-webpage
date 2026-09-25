import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Admin section keys for granular permissions
export const ADMIN_SECTIONS = ['events', 'artists', 'gallery', 'members', 'newsletter', 'email_automation', 'invitations', 'payment', 'open_call'] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number];

// Define user type  
// Backend authentication with secure PHP sessions
type User = {
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  permissions?: string[];
} | null;

// Define auth context type
type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  user: User;
  isLoading: boolean;
  isSuperAdmin: boolean;
  adminPermissions: string[];
  canAccessSection: (section: string) => boolean;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  user: null,
  isLoading: true,
  isSuperAdmin: false,
  adminPermissions: [],
  canAccessSection: () => false,
});

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth-check.php', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          setUser(data.user);
          setIsSuperAdmin(data.user.role === 'superadmin');
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setIsSuperAdmin(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setIsSuperAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth-login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        setIsAuthenticated(true);
        setUser(data.user);
        setIsSuperAdmin(data.user.role === 'superadmin');
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth-logout.php', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setIsSuperAdmin(false);
    }
  };

  const adminPermissions = user?.permissions ?? [];
  const canAccessSection = (section: string) =>
    isSuperAdmin || adminPermissions.includes(section);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      user,
      isLoading,
      isSuperAdmin,
      adminPermissions,
      canAccessSection,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => useContext(AuthContext);
