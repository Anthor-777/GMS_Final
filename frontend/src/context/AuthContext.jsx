import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { clearSession, getStoredUsername, getToken, setSession } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [username, setUsername] = useState(() => getStoredUsername());

  useEffect(() => {
    const onUnauthorized = () => {
      setToken(null);
      setUsername('');
    };
    window.addEventListener('gms:unauthorized', onUnauthorized);
    return () => window.removeEventListener('gms:unauthorized', onUnauthorized);
  }, []);

  const login = async (usernameValue, password) => {
    const { data } = await api.post('/auth/login', {
      username: usernameValue,
      password
    });
    const nextToken = data.data.token;
    const nextUser = data.data.username;
    setSession(nextToken, nextUser);
    setToken(nextToken);
    setUsername(nextUser);
    return data.data;
  };

  const logout = () => {
    clearSession();
    setToken(null);
    setUsername('');
  };

  const value = useMemo(
    () => ({
      token,
      username,
      isAuthenticated: Boolean(token),
      login,
      logout
    }),
    [token, username]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
