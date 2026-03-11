import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, profileAPI } from '@/services/api';
import { API_BASE_PATH } from "@/lib/config";
import { BadgeCheck, Code2, Crown } from 'lucide-react';
import type { User } from '@/types';
import developerUsers from '@/data/developerUsers.json';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  isAuthenticated: () => boolean;
}

// Валидация username: минимум 5 символов, только английские буквы и цифры
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.length < 5) {
    return { valid: false, error: 'Username must be at least 5 characters long' };
  }
  
  const usernameRegex = /^[a-zA-Z0-9]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username can only contain English letters and numbers' };
  }
  
  return { valid: true };
};


// Проверка на разработчика (из списка)
export const isDeveloper = (username: string): boolean => {
  if (!username) return false;
  const normalized = username.toLowerCase();
  return developerUsers.some((name) => name.toLowerCase() === normalized);
};

// Специальная иконка для zxclovly
export const isDeveloperCrown = (username: string): boolean => {
  return username?.toLowerCase() === 'zxclovly';
};

// Проверка на верифицированного пользователя (CEO или обычный verified, но не zxclovly)
export const isVerifiedUser = (user: User | null): boolean => {
  if (!user) return false;
  // Разработчики не показывают обычную галочку
  if (isDeveloper(user.username)) return false;
  // Обычная верификация: проверяем статус и срок действия
  if (!user.verified) return false;
  // Если есть срок действия, проверяем не истёк ли он
  if (user.verificationExpiry) {
    const expiryDate = new Date(user.verificationExpiry);
    const now = new Date();
    if (now > expiryDate) return false;
  }
  return true;
};

// Компонент галочки верификации
export const VerifiedBadge = ({ className = "h-4 w-4" }: { className?: string }) => (
  <BadgeCheck className={`${className} text-cyan-400 fill-cyan-400/20`} />
);

// Компонент галочки разработчика
export const DeveloperBadge = ({ className = "h-4 w-4" }: { className?: string }) => (
  <Code2 className={`${className} text-violet-400`} />
);

export const DeveloperCrownBadge = ({ className = "h-4 w-4" }: { className?: string }) => (
  <Crown className={`${className} text-amber-400 fill-amber-400/20`} />
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // При использовании cookies токен хранится в httpOnly cookie
    // и не доступен через JavaScript. Проверяем сессию через API.
    loadUserData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        const newToken = e.newValue;
        const oldToken = e.oldValue;

        if (newToken !== oldToken) {
          if (newToken) {
            setToken(newToken);
            loadUserData();
          } else {
            setToken(null);
            setUser(null);
            setLoading(false);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadUserData = async () => {
    try {
      const response = await profileAPI.getCurrentUser();
      setUser(response.user);
      // Токен из cookies не доступен, но мы можем установить флаг
      setToken('cookie');
    } catch (error) {
      console.error('Failed to load user data:', error);
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { token, user } = response;

    // Токен устанавливается в cookie на сервере
    const resolvedToken = token || 'cookie';
    setToken(resolvedToken);
    localStorage.setItem('token', resolvedToken);
    setUser(user);
  };

  const register = async (email: string, password: string, name: string, username: string) => {
    // Валидация username перед отправкой
    const validation = validateUsername(username);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const response = await authAPI.register({ email, password, name, username });
    const { token, user } = response;

    // Токен устанавливается в cookie на сервере
    const resolvedToken = token || 'cookie';
    setToken(resolvedToken);
    localStorage.setItem('token', resolvedToken);
    setUser(user);
  };

  const logout = async () => {
    // Try to invalidate refresh token on server
    try {
      await fetch(`${API_BASE_PATH}/logout`, {
        method: 'POST',
        credentials: 'include', // Отправляем cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const isAuthenticated = () => {
    return !!token;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
