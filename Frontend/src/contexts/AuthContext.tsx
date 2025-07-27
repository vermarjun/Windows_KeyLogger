import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '@/utils/api';
import { User, LoginCredentials, SignupCredentials, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await api.get('/users/me');
      // Transform the backend user data to match our frontend User type
      const userData = response.data;
      const transformedUser: User = {
        _id: userData._id,
        username: userData.username,
        email: userData.email,
        profilePhoto: userData.profilePhoto || '',
        lastActive: new Date(userData.lastActive),
        createdAt: new Date(userData.createdAt),
        isActive: userData.isActive,
        bio: userData.bio || '',
        role: userData.role,
      };
      setUser(transformedUser);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/users/login', credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      
      // After login, fetch complete user data
      await verifyToken();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      await api.post('/users/signup', credentials);
      // After successful signup, we need to login to get the token
      await login({ email: credentials.email, password: credentials.password });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Signup failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 