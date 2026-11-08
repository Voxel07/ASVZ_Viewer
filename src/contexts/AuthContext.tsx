import type { AuthModel } from 'pocketbase';
import { AuthContext } from './AuthState';
import { useState, useEffect, type ReactNode } from 'react';
import { pb } from '../lib/pb';

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
