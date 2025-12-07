import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthModel } from 'pocketbase';
import { pb } from '../lib/pb';

interface AuthContextType {
    user: AuthModel | null;
    isAuthenticated: boolean;
    loading: boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthModel | null>(pb.authStore.model);
    const [loading] = useState(false); // Initial load is instant from store

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = pb.authStore.onChange((_token, model) => {
            setUser(model);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const logout = () => {
        pb.authStore.clear();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, logout }}>
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
