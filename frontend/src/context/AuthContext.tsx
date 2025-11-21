import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../lib/api';

interface AuthContextType {
    user: string | null;
    token: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<string | null>(localStorage.getItem('user'));
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const login = async (username: string, password: string) => {
        const data = await apiLogin(username, password);
        setToken(data.access_token);
        setUser(username);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', username);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
