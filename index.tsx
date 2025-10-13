import './src/index.css';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Github, FileText, FileBadge, LayoutDashboard, Settings, Menu } from 'lucide-react';
import { motion } from "framer-motion";
import { ThemeToggleButton, useThemeTransition } from './src/components/ui/theme-toggle-button';
import Dashboard from './src/components/Dashboard';
import SettingsPage from './src/components/SettingsPage';
import MarkdownViewer from './src/components/MarkdownViewer';
import TextViewer from './src/components/TextViewer';



// --- Components ---



















const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const storedTheme = window.localStorage.getItem('theme');
        return storedTheme === 'dark' || (storedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);



  const { startTransition } = useThemeTransition();

  const toggleTheme = () => {
    startTransition(() => {
      setIsDarkMode(!isDarkMode);
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'changelog', label: 'Changelog', icon: FileText },
    { id: 'license', label: 'License', icon: FileBadge },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
                  isDarkMode={isDarkMode}
                  repoOwner={process.env.VITE_REPO_OWNER}
                  repoName={process.env.VITE_REPO_NAME}
               />;
      case 'settings':
        return <SettingsPage isDarkMode={isDarkMode} />;
      case 'changelog':
        return <MarkdownViewer file="/CHANGELOG.md" title="Changelog" isDarkMode={isDarkMode} />;
      case 'license':
        return <TextViewer file="/LICENSE.txt" title="License" />;

    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-sans flex antialiased">
      <aside className={`w-60 bg-white/80 dark:bg-slate-800/80 p-4 flex-col fixed h-full shadow-xl border-r border-slate-200/50 dark:border-slate-700/30 backdrop-blur-md transform transition-transform duration-300 ease-in-out z-40 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:flex`}>
        <div className="flex items-center space-x-3 mb-10 p-2">
          <Github className="h-10 w-10 text-indigo-500" />
          <span className="text-xl font-bold text-slate-800 dark:text-white">AutoGitGrow</span>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            {navItems.map(item => (
              <motion.li
                key={item.id}
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              >
                <button
                  onClick={() => setActiveTab(item.id)}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-full transition-all duration-300 ease-in-out text-left font-medium relative ${
                    activeTab === item.id 
                      ? 'bg-indigo-500 text-white shadow-lg' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 hover:text-indigo-500 dark:hover:text-indigo-400'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-2">
            <ThemeToggleButton
                theme={isDarkMode ? 'dark' : 'light'}
                onClick={toggleTheme}
                showLabel={true}
                variant="circle"
                start="center"
                className="w-full"
            />
            <div className="text-xs text-slate-500 dark:text-slate-600 text-center mt-4">
                <p>Maintained by <br/><a href="https://github.com/SplashCodeDex" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-500 hover:underline">SplashCodeDex</a></p>
            </div>
        </div>
      </aside>
      
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <main className={`flex-1 p-4 sm:p-8 overflow-y-auto ${isSidebarOpen ? 'md:ml-60' : 'md:ml-0'}`}>
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md absolute top-4 left-4 z-50"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        {renderContent()}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}