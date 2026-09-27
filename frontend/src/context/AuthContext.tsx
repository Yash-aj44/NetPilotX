import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (name: string, email: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "netpilot_admin_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse auth session", e);
    }
    // Default admin session enabled for seamless initial landing if stored
    return {
      name: "Network Operator",
      email: "admin@netpilotx.io",
      role: "Administrator",
    };
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string): Promise<boolean> => {
    // Simulated auth delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newUser: User = {
      name: email.split("@")[0].toUpperCase() || "Network Operator",
      email: email || "admin@netpilotx.io",
      role: "Administrator",
    };
    setUser(newUser);
    return true;
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newUser: User = {
      name: name || "Network Operator",
      email: email || "admin@netpilotx.io",
      role: "Administrator",
    };
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
