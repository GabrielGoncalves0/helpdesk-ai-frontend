'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AUTH_COOKIE_NAME = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCurrentUser() {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (token) {
        try {
          const res = await fetch('http://localhost:3001/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          // On network error or failed auth, clear stale cookie and state
          Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    }

    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        Cookies.set(AUTH_COOKIE_NAME, data.access_token, { expires: 7, path: '/' });

        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        toast.success(`Bem-vindo de volta, ${data.user.name}!`);
        router.push('/');
        return true;
      }

      const errData = await res.json().catch(() => ({}));
      setIsLoading(false);
      toast.error(errData.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      return false;
    } catch {
      setIsLoading(false);
      toast.error('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        Cookies.set(AUTH_COOKIE_NAME, data.access_token, { expires: 7, path: '/' });

        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false);
        toast.success('Conta criada com sucesso! Sessão iniciada.');
        router.push('/');
        return true;
      }

      const errData = await res.json().catch(() => ({}));
      setIsLoading(false);
      toast.error(errData.message || 'Erro ao registrar conta.');
      return false;
    } catch {
      setIsLoading(false);
      toast.error('Erro ao conectar com o servidor. Verifique se o backend está rodando.');
      return false;
    }
  };

  const logout = () => {
    Cookies.remove(AUTH_COOKIE_NAME, { path: '/' });
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Sessão encerrada com sucesso.');
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
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
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
