import React from 'react';

interface AutomationConfig {
    followersPerRun?: number;
    whitelist?: string;
    smartTargeting?: boolean;
    targetInterests?: string;
    growthSample?: number;
}

interface AutomationConfigFormProps {
    config: AutomationConfig;
    setConfig: (config: AutomationConfig) => void;
    currentScript: any;
}

const AutomationConfigForm: React.FC<AutomationConfigFormProps> = ({ config, setConfig, currentScript }) => {
    if (!currentScript || currentScript.configs.length === 0) return null;

    return (
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
    );
};

export default AutomationConfigForm;
