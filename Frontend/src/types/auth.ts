export interface User {
  _id: string;
  username: string;
  email: string;
  profilePhoto?: string;
  lastActive: Date;
  createdAt: Date;
  isActive: boolean;
  bio?: string;
  role: 'user' | 'admin';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
} 