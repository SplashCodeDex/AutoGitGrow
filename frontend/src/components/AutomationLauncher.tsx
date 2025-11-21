import React, { useState } from 'react';
import { Play, Settings, X, Cloud, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AutomationConfigForm from './AutomationConfigForm';
import AutomationLogs from './AutomationLogs';

interface AutomationConfig {
    followersPerRun?: number;
    whitelist?: string;
    smartTargeting?: boolean;
    targetInterests?: string;
    growthSample?: number;
}

interface AutomationLauncherProps {
    isOpen: boolean;
    onClose: () => void;
}

const AUTOMATION_SCRIPTS = [
    {
        id: 'gitgrow',
        name: 'GitGrow',
        description: 'Follow users, unfollow non-reciprocal, auto-follow-back',
        icon: '🚀',
        configs: ['followersPerRun', 'whitelist', 'smartTargeting', 'targetInterests']
    },
    {
        id: 'autostargrow',
        name: 'AutoStarGrow',
        description: 'Star repos from random users to increase visibility',
        icon: '⭐',
        configs: ['growthSample']
    },
    {
        id: 'autotrack',
        name: 'AutoTrack',
        description: 'Track and analyze GitHub activity patterns',
        icon: '📊',
        configs: []
    },
    {
        id: 'autostarback',
        name: 'AutoStarBack',
        description: 'Star back repos from users who starred yours',
        icon: '🔄',
        configs: []
    }
];

const AutomationLauncher: React.FC<AutomationLauncherProps> = ({ isOpen, onClose }) => {
    const [selectedScript, setSelectedScript] = useState(AUTOMATION_SCRIPTS[0].id);
    const [config, setConfig] = useState<AutomationConfig>({
        followersPerRun: 150,
        whitelist: '',
        smartTargeting: true,
        targetInterests: 'Python, AI, Automation, Web Development',
        growthSample: 10
    });
    const [isRunning, setIsRunning] = useState(false);
    const [executionMode, setExecutionMode] = useState<'local' | 'cloud'>('local');
    const [logs, setLogs] = useState<string[]>([]);

    const currentScript = AUTOMATION_SCRIPTS.find(s => s.id === selectedScript);

    const handleLaunch = async () => {
        setIsRunning(true);
        setLogs([]); // Clear previous logs

        // Start SSE for local mode
        let eventSource: EventSource | null = null;
        if (executionMode === 'local') {
            eventSource = new EventSource('/api/automation/logs/stream');
            eventSource.onmessage = (event) => {
                setLogs(prev => [...prev, event.data]);
            };
            eventSource.onerror = (err) => {
                console.error('SSE Error:', err);
                eventSource?.close();
            };
        }

        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/automation/run', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    action: selectedScript,
                    ref: 'main',
                    inputs: config,
                    execution_mode: executionMode
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Automation started:', result);
                if (executionMode === 'cloud') {
                    alert(`✅ ${currentScript?.name} automation started!\n\nWorkflow: ${result.workflow}\nCheck GitHub Actions for logs.`);
                    onClose();
                }
            } else {
                const error = await response.json();
                alert(`❌ Failed to start automation:\n${error.detail}`);
                setIsRunning(false);
                eventSource?.close();
            }
        } catch (error) {
            console.error('Launch error:', error);
            alert(`❌ Error: ${error}`);
            setIsRunning(false);
            eventSource?.close();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-6 h-6" />
                                    <h2 className="text-2xl font-bold">Start Automation</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="mt-2 text-indigo-100">Configure and launch your automation script</p>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
                            {/* Execution Mode Toggle */}
                            <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                                <button
                                    onClick={() => setExecutionMode('local')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${executionMode === 'local'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <Laptop className="w-4 h-4" />
                                    Run Locally (Live Logs)
                                </button>
                                <button
                                    onClick={() => setExecutionMode('cloud')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition ${executionMode === 'cloud'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    <Cloud className="w-4 h-4" />
                                    Run on GitHub Cloud
                                </button>
                            </div>

                            {/* Script Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Select Script
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {AUTOMATION_SCRIPTS.map(script => (
                                        <button
                                            key={script.id}
                                            onClick={() => setSelectedScript(script.id)}
                                            className={`p-4 rounded-xl border-2 transition text-left ${selectedScript === script.id
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-2xl">{script.icon}</span>
                                                <span className="font-semibold text-slate-800 dark:text-white">
                                                    {script.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                {script.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Configuration Form */}
                            <AutomationConfigForm
                                config={config}
                                setConfig={setConfig}
                                currentScript={currentScript}
                            />
                        </div>

                        {/* Live Logs */}
                        <AutomationLogs logs={logs} executionMode={executionMode} />

                        {/* Footer */}
                        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    This will trigger a GitHub Actions workflow
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleLaunch}
                                        disabled={isRunning}
                                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isRunning ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Launching...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4" />
                                                Start Automation
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AutomationLauncher;
