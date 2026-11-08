import { createContext, useContext } from 'react';
import type { AuthModel } from 'pocketbase';
interface AuthContextType {
    user: AuthModel | null;
    isAuthenticated: boolean;
    loading: boolean;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
