import React, { useState } from 'react';
import { Play, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    const currentScript = AUTOMATION_SCRIPTS.find(s => s.id === selectedScript);

    const handleLaunch = async () => {
        setIsRunning(true);

        try {
            const response = await fetch('/api/automation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: selectedScript,
                    ref: 'main',
                    inputs: config
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Automation started:', result);
                alert(`✅ ${currentScript?.name} automation started!\n\nWorkflow: ${result.workflow}\nCheck GitHub Actions for logs.`);
                onClose();
            } else {
                const error = await response.json();
                alert(`❌ Failed to start automation:\n${error.detail}`);
            }
        } catch (error) {
            console.error('Launch error:', error);
            alert(`❌ Error: ${error}`);
        } finally {
            setIsRunning(false);
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

                            {/* Configuration */}
                            {currentScript && currentScript.configs.length > 0 && (
                                <div className="space-y-4 mb-6">
                                    <h3 className="font-semibold text-slate-800 dark:text-white">Configuration</h3>

                                    {currentScript.configs.includes('followersPerRun') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Users to Follow Per Run
                                            </label>
                                            <input
                                                type="number"
                                                value={config.followersPerRun}
                                                onChange={(e) => setConfig({ ...config, followersPerRun: parseInt(e.target.value) })}
                                                min="1"
                                                max="500"
                                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Range: 1-500</p>
                                        </div>
                                    )}

                                    {currentScript.configs.includes('whitelist') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Whitelist (comma-separated usernames)
                                            </label>
                                            <textarea
                                                value={config.whitelist}
                                                onChange={(e) => setConfig({ ...config, whitelist: e.target.value })}
                                                placeholder="user1, user2, user3"
                                                rows={3}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Users who will never be unfollowed</p>
                                        </div>
                                    )}

                                    {currentScript.configs.includes('smartTargeting') && (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="smartTargeting"
                                                checked={config.smartTargeting}
                                                onChange={(e) => setConfig({ ...config, smartTargeting: e.target.checked })}
                                                className="w-5 h-5 rounded border-slate-300"
                                            />
                                            <label htmlFor="smartTargeting" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Enable Smart Targeting (AI-powered relevance filtering)
                                            </label>
                                        </div>
                                    )}

                                    {currentScript.configs.includes('targetInterests') && config.smartTargeting && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Target Interests
                                            </label>
                                            <input
                                                type="text"
                                                value={config.targetInterests}
                                                onChange={(e) => setConfig({ ...config, targetInterests: e.target.value })}
                                                placeholder="Python, AI, Web Development"
                                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                    )}

                                    {currentScript.configs.includes('growthSample') && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Growth Sample Size
                                            </label>
                                            <input
                                                type="number"
                                                value={config.growthSample}
                                                onChange={(e) => setConfig({ ...config, growthSample: parseInt(e.target.value) })}
                                                min="1"
                                                max="50"
                                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Number of new users to star repos from</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

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
