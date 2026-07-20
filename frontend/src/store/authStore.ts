import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Company {
  id: string;
  name: string;
  type: string;
  dot_number?: string | null;
  status: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  company_id: string;
  role_id: string;
  company?: Company;
  role?: Role;
  requires_password_change?: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'freightflow-auth',
    }
  )
);
