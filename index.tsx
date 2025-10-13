import './src/index.css';
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Github, FileText, FileBadge, LayoutDashboard, Settings, Sun, Moon } from 'lucide-react';
import Dashboard from './src/components/Dashboard';
import SettingsPage from './src/components/SettingsPage';
import MarkdownViewer from './src/components/MarkdownViewer';
import TextViewer from './src/components/TextViewer';



// --- Components ---



















const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

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



  const toggleTheme = () => setIsDarkMode(!isDarkMode);

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
      <aside className="w-60 bg-white dark:bg-slate-800 p-4 flex-col fixed h-full hidden md:flex shadow-md border-r border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center space-x-3 mb-10 p-2">
          <Github className="h-10 w-10 text-indigo-500" />
          <span className="text-xl font-bold text-slate-800 dark:text-white">AutoGitGrow</span>
        </div>
        <nav className="flex-grow">
          <ul className="space-y-2">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-left font-medium relative ${
                    activeTab === item.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto p-2">
            <button
                onClick={toggleTheme}
                aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                className="w-full flex items-center justify-center space-x-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors duration-200"
            >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <div className="text-xs text-slate-500 dark:text-slate-600 text-center mt-4">
                <p>Maintained by <br/><a href="https://github.com/SplashCodeDex" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-500 hover:underline">SplashCodeDex</a></p>
            </div>
        </div>
      </aside>
      
      <main className="flex-1 md:ml-60 p-4 sm:p-8 overflow-y-auto">
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