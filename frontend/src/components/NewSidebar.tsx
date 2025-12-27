import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Settings, LogOut, User, Github } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggleButton } from './ui/theme-toggle-button';

interface NavItem {
    id: string;
    label: string;
    icon: any;
    path: string;
    hidden?: boolean;
}

interface NewSidebarProps {
    navItems: NavItem[];
}

const NewSidebar: React.FC<NewSidebarProps> = ({ navItems }) => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const { logout } = useAuth();

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed md:static inset-y-0 left-0 z-50 bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'}`}
            >
                {/* Header */}
                <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
                    <div className={`flex items-center gap-3 overflow-hidden transition-all ${isOpen ? 'w-full' : 'w-10'}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
                            <Github className="w-6 h-6" />
                        </div>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 whitespace-nowrap"
                            >
                                AutoGitGrow
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {navItems.filter(item => !item.hidden).map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-r-full"
                                    />
                                )}
                                <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                                {isOpen && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
                    <div className="flex items-center justify-between">
                        <ThemeToggleButton />
                        <button
                            onClick={toggleSidebar}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
                            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {isOpen ? <X className="w-5 h-5 shrink-0" /> : <Menu className="w-5 h-5 shrink-0" />}
                        </button>
                    </div>
                    <Link
                        to="/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${location.pathname === '/settings'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        <Settings className="w-5 h-5 shrink-0" />
                        {isOpen && <span>Settings</span>}
                    </Link>

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {isOpen && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default NewSidebar;
