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
    const [isValid, setIsValid] = useState<boolean>(pb.authStore.isValid);
    const [loading] = useState(false); // Initial load is instant from store

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = pb.authStore.onChange((_token, model) => {
            setUser(model);
            setIsValid(pb.authStore.isValid);
        });

        // Periodically check token validity (some expirations aren't pushed via onChange)
        const interval = setInterval(() => {
            if (!pb.authStore.isValid) {
                // force clear expired auth so UI updates consistently
                pb.authStore.clear();
            } else {
                setIsValid(true);
            }
        }, 30_000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    const logout = () => {
        pb.authStore.clear();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: isValid, loading, logout }}>
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
