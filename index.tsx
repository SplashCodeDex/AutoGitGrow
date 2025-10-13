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
import NewSidebar from './src/components/NewSidebar';
import { Smoke } from './src/components/ui/smoke'; // Add this import



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



  const { startTransition } = useThemeTransition();

  const toggleTheme = () => {
    startTransition(() => {
      setIsDarkMode(!isDarkMode);
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    <Smoke className="h-screen"> {/* Wrap the entire application with Smoke */}
      <div className="h-full text-slate-700 dark:text-slate-300 font-sans flex antialiased">
        <NewSidebar 
          navItems={navItems} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
        
        <main className={`flex-1 p-4 sm:p-8 overflow-y-auto`}>
          {renderContent()}
        </main>
      </div>
    </Smoke> // Close the Smoke component
  );
};

const container = document.getElementById('root');

if (container && !container.dataset.reactRootInitialized) {
  const root = createRoot(container);
  root.render(<React.StrictMode><App /></React.StrictMode>);
  container.dataset.reactRootInitialized = 'true';

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      root.unmount();
      delete container.dataset.reactRootInitialized;
    });
    import.meta.hot.accept();
  }
}