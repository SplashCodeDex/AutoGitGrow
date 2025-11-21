import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    UserPlus,
    Star,
    GitMerge,
    Activity,
    Settings,
    LayoutDashboard,
    Network,
    Compass,
    Zap,
    Menu,
    X,
    Search,
    Bell,
    Play,
    Download
} from 'lucide-react';
import {
    STATS_ENDPOINT,
    ACTIVITY_FEED_ENDPOINT,
    FOLLOWER_GROWTH_ENDPOINT,
    RECIPROCITY_ENDPOINT
} from '../lib/api';
import StatCard from './StatCard';
import GrowthVelocityChart from './GrowthVelocityChart';
import GeminiInsights from './GeminiInsights';
import SystemHealth from './SystemHealth';
import AutomationsPanel from './AutomationsPanel';
import SettingsPage from './SettingsPage';
import ConnectivityBanner from './ConnectivityBanner';
import OnboardingMessage from './OnboardingMessage';
import DismissibleAnnouncement from './DismissibleAnnouncement';
import NetworkGraph3D from './NetworkGraph3D';
import ActivityHeatmap from './ActivityHeatmap';
import AutomationLauncher from './AutomationLauncher';
import { toast } from 'sonner';
import { useAtom } from 'jotai';
import { userLevelAtom, userXPAtom } from '../lib/state';
import { Progress } from './ui/progress';

// --- Fetch Functions ---
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const fetchStats = async () => {
    const res = await fetch(STATS_ENDPOINT, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
};

const fetchActivityFeed = async () => {
    const res = await fetch(ACTIVITY_FEED_ENDPOINT, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch activity feed');
    return res.json();
};

const fetchFollowerGrowth = async () => {
    const res = await fetch(FOLLOWER_GROWTH_ENDPOINT, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch follower growth');
    return res.json();
};

const fetchReciprocity = async () => {
    const res = await fetch(RECIPROCITY_ENDPOINT, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reciprocity data');
    return res.json();
};

// --- Components ---

const Dashboard = ({ view }: { view: string }) => {
    const [level, setLevel] = useAtom(userLevelAtom);
    const [xp, setXP] = useAtom(userXPAtom);
    const [launcherOpen, setLauncherOpen] = useState(false);

    // Real-time data fetching
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: fetchStats,
        refetchInterval: 30000,
    });

    const { data: activityFeed } = useQuery({
        queryKey: ['activityFeed'],
        queryFn: fetchActivityFeed,
        refetchInterval: 60000,
    });

    const { data: followerGrowth } = useQuery({
        queryKey: ['followerGrowth'],
        queryFn: fetchFollowerGrowth,
        refetchInterval: 60000,
    });

    const { data: reciprocity } = useQuery({
        queryKey: ['reciprocity'],
        queryFn: fetchReciprocity,
        refetchInterval: 60000,
    });

    // Gamification Logic
    useEffect(() => {
        if (stats?.followers) {
            const newLevel = Math.floor(stats.followers / 10) + 1;
            const newXP = (stats.followers % 10) * 10;

            if (newLevel > level) {
                toast.success(`Level Up! You are now level ${newLevel}! 🎉`);
            }

            setLevel(newLevel);
            setXP(newXP);
        }
    }, [stats?.followers, level, setLevel, setXP]);

    // Real-time Notifications
    useEffect(() => {
        if (stats) {
            // Simple check to simulate notifications on change.
            // In a real app, we'd compare with previous state or use a websocket event.
            // For now, we rely on the user seeing the toast when the query refetches and data changes.
        }
    }, [stats]);

    // Prepare data for Heatmap (mocked for now based on activity feed if needed, or static)
    const heatmapData = useMemo(() => {
        if (!activityFeed) return [];

        const counts: Record<string, number> = {};
        activityFeed.forEach((item: any) => {
            // item.time is "YYYY-MM-DD HH:MM:SS"
            const date = item.time.split(' ')[0];
            counts[date] = (counts[date] || 0) + 1;
        });

        const days = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = counts[dateStr] || 0;
            let type: 'high' | 'medium' | 'low' | 'none' = 'none';
            if (count > 5) type = 'high';
            else if (count > 2) type = 'medium';
            else if (count > 0) type = 'low';

            days.push({ date: dateStr, count, type });
        }
        return days;
    }, [activityFeed]);

    // Prepare nodes for 3D Graph
    const graphNodes = useMemo(() => {
        if (!reciprocity) return { nodes: [], links: [] };

        const nodes = [
            { id: 'me', group: 1, size: 20 },
            ...(reciprocity.mutuals || []).map((u: string) => ({ id: u, group: 2, size: 10 })),
            ...(reciprocity.fans || []).map((u: string) => ({ id: u, group: 3, size: 5 })),
        ];
        const links = [
            ...(reciprocity.mutuals || []).map((u: string) => ({ source: 'me', target: u })),
            ...(reciprocity.fans || []).map((u: string) => ({ source: u, target: 'me' })),
        ];
        return { nodes, links };
    }, [reciprocity]);

    const handleExportData = () => {
        const dataToExport = {
            stats,
            followerGrowth,
            activityFeed,
            reciprocity,
            exportedAt: new Date().toISOString(),
        };

        // JSON Export
        const jsonBlob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `autogitgrow-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(jsonLink);
        jsonLink.click();
        document.body.removeChild(jsonLink);
        URL.revokeObjectURL(jsonUrl);

        // CSV Export (Follower Growth)
        if (followerGrowth && followerGrowth.length > 0) {
            const headers = Object.keys(followerGrowth[0]).join(',');
            const rows = followerGrowth.map((row: any) => Object.values(row).join(',')).join('\n');
            const csvContent = `${headers}\n${rows}`;
            const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const csvUrl = URL.createObjectURL(csvBlob);
            const csvLink = document.createElement('a');
            csvLink.href = csvUrl;
            csvLink.download = `autogitgrow-growth-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(csvLink);
            csvLink.click();
            document.body.removeChild(csvLink);
            URL.revokeObjectURL(csvUrl);
        }

        toast.success('Data exported successfully (JSON & CSV)');
    };

    return (
        <div className="space-y-8">
            <AutomationLauncher isOpen={launcherOpen} onClose={() => setLauncherOpen(false)} />
            {/* Header with Gamification and System Health */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {view === 'overview' && 'Dashboard'}
                        {view === 'network' && 'Network Analysis'}
                        {view === 'discovery' && 'Discovery'}
                        {view === 'automations' && 'Automation Center'}
                        {view === 'settings' && 'Settings'}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        System Operational
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Gamification Bar */}
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Level {level}</div>
                        <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <Progress value={xp} className="h-full bg-indigo-500" />
                        </div>
                    </div>

                    <button
                        onClick={() => setLauncherOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition shadow-md font-medium text-sm mr-4"
                    >
                        <Play className="w-4 h-4" />
                        Start Automation
                    </button>

                    <button
                        onClick={handleExportData}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm font-medium text-sm mr-4"
                    >
                        <Download className="w-4 h-4" />
                        Export Data
                    </button>

                    <SystemHealth />

                    <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 border-2 border-white dark:border-slate-800 shadow-md"></div>
                </div>
            </header>

            <DismissibleAnnouncement />

            {view === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <StatCard title="Total Followers" value={stats?.followers || 0} icon={Users} color="text-blue-500" automationId="gitgrow" />
                        <StatCard title="Following" value={stats?.following || 0} icon={UserPlus} color="text-green-500" automationId="autounstarback" />
                        <StatCard title="Starred Repos" value={stats?.starred_repos || 0} icon={Star} color="text-yellow-500" automationId="autostargrow" />
                        <StatCard title="Mutuals" value={stats?.mutual_followers || 0} icon={GitMerge} color="text-purple-500" automationId="autostarback" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <GrowthVelocityChart data={followerGrowth || []} />

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <ActivityHeatmap activity={heatmapData} />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <GeminiInsights stats={stats} growthData={followerGrowth} />

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm h-[500px] flex flex-col">
                                <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Live Activity</h3>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                                    {activityFeed?.map((item: any, i: number) => (
                                        <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <div className={`p-2 rounded-full ${item.type === 'follow' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                item.type === 'star' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {item.type === 'follow' ? <UserPlus className="w-4 h-4" /> :
                                                    item.type === 'star' ? <Star className="w-4 h-4" /> :
                                                        <Activity className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                                    <span className="font-medium">{item.user || 'Someone'}</span> {item.action}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'network' && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="h-[600px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative group">
                        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-white/10">
                            Interactive Galaxy View
                        </div>
                        <NetworkGraph3D nodes={graphNodes.nodes} />
                    </div>
                </div>
            )}

            {view === 'discovery' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Discovery</h3>
                        <p className="text-slate-500 dark:text-slate-400">Explore new repositories and users...</p>
                        {/* Content for Discovery would go here */}
                    </div>
                </div>
            )}

            {view === 'automations' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <AutomationsPanel />
                </div>
            )}

            {view === 'settings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SettingsPage />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
