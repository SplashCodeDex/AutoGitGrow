import React from 'react';
import { Terminal } from 'lucide-react';

interface AutomationLogsProps {
    logs: string[];
    executionMode: 'local' | 'cloud';
}

const AutomationLogs: React.FC<AutomationLogsProps> = ({ logs, executionMode }) => {
    if (logs.length === 0 || executionMode !== 'local') return null;

    return (
        <div className="px-6 pb-6">
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto border border-slate-700 shadow-inner">
                <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2">
                    <Terminal className="w-3 h-3" />
                    <span>Live Terminal Output</span>
                </div>
                <div className="space-y-1">
                    {logs.map((log, i) => (
                        <div key={i} className="break-all">{log}</div>
                    ))}
                    <div className="animate-pulse">_</div>
                </div>
            </div>
        </div>
    );
};

export default AutomationLogs;
