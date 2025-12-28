import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Server, Cloud, X } from 'lucide-react';
import { HEALTH_DETAILED_ENDPOINT } from '../lib/api';
import { useTheme } from '../lib/state';
import { Badge } from './ui/badge';
import RateLimitGauge from './RateLimitGauge';

const fetchHealth = async () => {
    const res = await fetch(HEALTH_DETAILED_ENDPOINT);
    if (!res.ok) throw new Error('Failed to fetch health data');
    return res.json();
};

const StatusBadge = ({ label, icon: Icon, status, details, onClick, active }: { label: string, icon: any, status: string, details?: string, onClick?: () => void, active?: boolean }) => {
    const { isDarkMode } = useTheme();
    const isHealthy = status === 'healthy';
    const isWarning = status === 'warning';

    return (
        <Badge
            variant={isHealthy ? 'default' : isWarning ? 'secondary' : 'destructive'}
            onClick={onClick}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${active ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-900' : ''
                } ${isHealthy ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30 hover:bg-green-100 dark:hover:bg-green-900/30' :
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
    const [showRateLimit, setShowRateLimit] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['systemHealth'],
        queryFn: fetchHealth,
        refetchInterval: 30000,
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowRateLimit(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isLoading) return <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse mb-6"></div>;
    if (isError) return null;

    const checks = data?.checks || {};
    const githubApi = checks.github_api;

    return (
        <div className="relative flex flex-wrap gap-3 mb-6" ref={containerRef}>
            <StatusBadge
                label="Database"
                icon={Database}
                status={checks.database?.status || 'error'}
            />
            <StatusBadge
                label="GitHub API"
                icon={Cloud}
                status={githubApi?.status || 'unknown'}
                details={githubApi ? `${githubApi.remaining} reqs left` : undefined}
                onClick={() => setShowRateLimit(!showRateLimit)}
                active={showRateLimit}
            />
            <StatusBadge
                label="System"
                icon={Server}
                status={checks.system?.status || 'unknown'}
                details={checks.system ? `CPU: ${checks.system.cpu_percent}%` : undefined}
            />

            {showRateLimit && githubApi && (
                <div className="absolute top-full left-0 mt-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative">
                        <RateLimitGauge
                            remaining={githubApi.remaining}
                            limit={githubApi.limit}
                            reset={githubApi.reset}
                        />
                        <button
                            onClick={() => setShowRateLimit(false)}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemHealth;
