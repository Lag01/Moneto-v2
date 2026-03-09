export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  isAuthenticated: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}
