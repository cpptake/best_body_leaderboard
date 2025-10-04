import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, isAdmin, getUserData, logout as authLogout, UserData } from '@/lib/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  user: UserData | null;
  loading: boolean;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = () => {
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);

    if (authenticated) {
      const userData = getUserData();
      setUser(userData);
      setIsAdminUser(isAdmin());
    } else {
      setUser(null);
      setIsAdminUser(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    refreshAuth();

    // ルート変更時に認証状態を再チェック
    const handleRouteChange = () => {
      refreshAuth();
    };

    router.events?.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  const logout = () => {
    authLogout();
    refreshAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAdmin: isAdminUser,
        user,
        loading,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
