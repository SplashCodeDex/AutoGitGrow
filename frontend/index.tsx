import '@/index.css';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Github, FileText, FileBadge, LayoutDashboard, Settings, Menu, Sparkles, Bot, Activity, Users, Search } from 'lucide-react';
import { motion } from "framer-motion";
import Dashboard from './src/components/Dashboard';
import SettingsPage from './src/components/SettingsPage';
import MarkdownViewer from './src/components/MarkdownViewer';
import TextViewer from './src/components/TextViewer';
import NewSidebar from './src/components/NewSidebar';
import ConnectivityBanner from './src/components/ConnectivityBanner';
import ErrorBoundary from './src/components/ErrorBoundary';
import { Toaster } from './src/components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const App = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'automations', label: 'Automations', icon: Bot },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'network', label: 'Network', icon: Users },
    { id: 'discovery', label: 'Discovery', icon: Search },
    { id: 'changelog', label: 'Changelog', icon: FileText },
    { id: 'license', label: 'License', icon: FileBadge },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
      case 'insights':
      case 'automations':
      case 'activity':
      case 'network':
      case 'discovery':
        return <Dashboard view={activeTab} />;
      case 'settings':
        return <SettingsPage />;
      case 'changelog':
        return <MarkdownViewer filePath="/CHANGELOG.md" />;
      case 'license':
        return <TextViewer filePath="/LICENSE" />;
      default:
        return <Dashboard view="overview" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      <NewSidebar navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <ConnectivityBanner />
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </React.StrictMode>
  );
  container.dataset.reactRootInitialized = 'true';
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Cleanup if needed
  });
  import.meta.hot.accept();
}
