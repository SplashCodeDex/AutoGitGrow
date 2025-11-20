import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Server, Cloud } from 'lucide-react';
import { HEALTH_DETAILED_ENDPOINT } from '../lib/api';
import { useTheme } from '../lib/state';
import { Badge } from './ui/badge';

const fetchHealth = async () => {
    const res = await fetch(HEALTH_DETAILED_ENDPOINT);
    if (!res.ok) throw new Error('Failed to fetch health data');
    return res.json();
};

const StatusBadge = ({ label, icon: Icon, status, details }: { label: string, icon: any, status: string, details?: string }) => {
    const { isDarkMode } = useTheme();
    const isHealthy = status === 'healthy';
    const isWarning = status === 'warning';

    return (
        <Badge
            variant={isHealthy ? 'default' : isWarning ? 'secondary' : 'destructive'}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all ${isHealthy ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30 hover:bg-green-100 dark:hover:bg-green-900/30' :
                    isWarning ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' :
                        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30'
                }`}
        >
            <Icon className="w-3.5 h-3.5 mr-2" />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
            {details && <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} border-l pl-2 ml-2 ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>{details}</span>}
            <div className={`w-2 h-2 rounded-full ml-2 ${isHealthy ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
        </Badge>
    );
};

const SystemHealth = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['systemHealth'],
        queryFn: fetchHealth,
        refetchInterval: 30000,
    });

    if (isLoading) return <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse mb-6"></div>;
    if (isError) return null;

    const checks = data?.checks || {};

    return (
        <div className="flex flex-wrap gap-3 mb-6">
            <StatusBadge
                label="Database"
                icon={Database}
                status={checks.database?.status || 'error'}
            />
            <StatusBadge
                label="GitHub API"
                icon={Cloud}
                status={checks.github_api?.status || 'unknown'}
                details={checks.github_api ? `${checks.github_api.remaining} reqs left` : undefined}
            />
            <StatusBadge
                label="System"
                icon={Server}
                status={checks.system?.status || 'unknown'}
                details={checks.system ? `CPU: ${checks.system.cpu_percent}%` : undefined}
            />
        </div>
    );
};

export default SystemHealth;
