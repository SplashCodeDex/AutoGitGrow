import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewSidebar from './components/NewSidebar';
import Dashboard from './components/dashboard/Dashboard';
import AutomationLauncher from './components/automation/AutomationLauncher';
import Settings from './components/settings/SettingsPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LayoutDashboard, Bot, Settings as SettingsIcon } from 'lucide-react';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

function AppContent() {
    const { isAuthenticated } = useAuth();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { id: 'automation', label: 'Automation', icon: Bot, path: '/automation' },
        { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
    ];

    return (
        <div className="flex h-screen w-full bg-gray-900 text-white overflow-hidden">
            {isAuthenticated && <NewSidebar navItems={navItems} />}
            <main className="flex-1 overflow-y-auto p-8">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/automation"
                        element={
                            <ProtectedRoute>
                                <AutomationLauncher />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </QueryClientProvider>
    );
}
