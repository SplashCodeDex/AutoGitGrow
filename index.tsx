import '@/src/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Github, FileText, FileBadge, LayoutDashboard, Settings, Menu } from 'lucide-react';
import { motion } from "framer-motion";
import { ThemeToggleButton, useThemeTransition } from './src/components/ui/theme-toggle-button';
import Dashboard from './src/components/Dashboard';
import SettingsPage from './src/components/SettingsPage';
import MarkdownViewer from './src/components/MarkdownViewer';
import TextViewer from './src/components/TextViewer';
import NewSidebar from './src/components/NewSidebar';
import { Smoke } from './src/components/ui/smoke';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from './src/lib/state';

const queryClient = new QueryClient();

const App = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { startTransition } = useThemeTransition();

  const handleToggleTheme = () => {
    startTransition(() => {
      toggleTheme();
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
        return <Dashboard />;
      case 'settings':
        return <SettingsPage />;      case 'changelog':
        return <MarkdownViewer file="/CHANGELOG.md" title="Changelog" />;
      case 'license':
        return <TextViewer file="/LICENSE" title="License" />;

    }
  };

  return (
    <Smoke className="h-screen"> {/* Put h-screen back on Smoke */}
      <div className="h-full flex text-slate-700 dark:text-slate-300 font-sans antialiased"> {/* This div should be h-full, not h-screen */}
        <NewSidebar 
          navItems={navItems} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isDarkMode={isDarkMode}
          toggleTheme={handleToggleTheme}
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
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>
  );
  container.dataset.reactRootInitialized = 'true';

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      root.unmount();
      delete container.dataset.reactRootInitialized;
    });
    import.meta.hot.accept();
  }
}